import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createConvexAuthToken } from "@/lib/auth-proof";
import { generateCircleComboReply, getCircleCompanions } from "@/lib/ai/aurora-brain";
import { isSameOriginRequest, readSession } from "@/lib/server-session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type CircleMessage = {
  senderType: "aurora" | "companion";
  senderName: string;
  personaId?: string;
  content: string;
};

function fallbackCircleReply(category: string, message: string) {
  const companions = getCircleCompanions(category).slice(0, 3);
  const isSpanish =
    /(hola|ayuda|pareja|trabajo|dinero|estres|ansiedad|seguridad)/i.test(
      message,
    );

  return {
    language: isSpanish ? ("es" as const) : ("en" as const),
    circleSummary: isSpanish
      ? "El circulo necesita bajar el ruido y enfocarse en un siguiente paso claro."
      : "This circle needs to reduce noise and focus on one clear next step.",
    auroraReply: isSpanish
      ? "Estoy contigo. Cuanto mas concreta seas con lo que acaba de pasar, mejor podemos darte apoyo util y cuidadoso."
      : "I'm with you. The more concrete you are about what just happened, the more useful and caring this circle can be.",
    comboReplies: companions.map((companion) => ({
      personaId: companion.personaId,
      name: companion.name,
      role: companion.role,
      reply: isSpanish
        ? "Quiero ayudarte a ver esto con mas claridad y sin juzgarte."
        : "I want to help you look at this more clearly, without judging you.",
    })),
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const cookieStore = await cookies();
    const session = await readSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { circleId, message } = (await request.json()) as {
      circleId?: string;
      message?: string;
    };

    if (!circleId || !message?.trim()) {
      return NextResponse.json(
        { error: "Circle and message are required" },
        { status: 400 },
      );
    }

    const userId = session.convexUserId as Id<"users">;
    const typedCircleId = circleId as Id<"circles">;

    const user = await convex.query(api.users.getUser, { userId });
    if (!user || user.workosId !== session.workosUserId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const authToken = await createConvexAuthToken({
      userId: session.convexUserId,
      workosUserId: session.workosUserId,
    });

    const circle = await convex.query(api.circles.getCircleDetails, {
      authToken,
      circleId: typedCircleId,
      userId,
    });

    if (!circle || !circle.isMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const history = await convex.query(api.circles.getCircleMessages, {
      authToken,
      userId,
      circleId: typedCircleId,
      limit: 12,
    });

    const normalizedHistory = history.map((entry) => ({
      role: entry.senderType === "user" ? ("user" as const) : ("assistant" as const),
      content: `${entry.senderName}: ${entry.content}`,
    }));

    let output;
    try {
      output = await generateCircleComboReply({
        message: message.trim(),
        history: normalizedHistory,
        userName: user.name,
        circle: {
          name: circle.name,
          description: circle.description,
          category: circle.category,
          focusPrompt: circle.focusPrompt,
          tags: circle.tags,
        },
      });
    } catch (error) {
      console.error("Circle combo LLM error:", error);
      output = fallbackCircleReply(circle.category, message.trim());
    }

    const aiMessages: CircleMessage[] = [
      {
        senderType: "aurora",
        senderName: "Aurora",
        personaId: "aurora",
        content: output.auroraReply.trim(),
      },
      ...output.comboReplies.slice(0, 3).map((reply) => ({
        senderType: "companion" as const,
        senderName: reply.name,
        personaId: reply.personaId,
        content: reply.reply.trim(),
      })),
    ];

    await convex.mutation(api.circles.appendCircleConversation, {
      authToken,
      userId,
      circleId: typedCircleId,
      userMessage: message.trim(),
      language: output.language,
      aiMessages,
    });

    return NextResponse.json({
      summary: output.circleSummary,
      language: output.language,
      messages: aiMessages,
    });
  } catch (error) {
    console.error("Circle AI chat error:", error);
    return NextResponse.json(
      { error: "Failed to process circle chat" },
      { status: 500 },
    );
  }
}
