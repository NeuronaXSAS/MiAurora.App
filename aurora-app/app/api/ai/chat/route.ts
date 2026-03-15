import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createConvexAuthToken } from "@/lib/auth-proof";
import { generateAssistantWellnessReply } from "@/lib/ai/aurora-brain";
import { isSameOriginRequest, readSession } from "@/lib/server-session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface ChatRouteTurn {
  isUser?: boolean;
  role?: "user" | "assistant";
  content: string;
}

function normalizeHistory(history: ChatRouteTurn[] = []) {
  return history
    .map((turn) => ({
      role:
        turn.role === "assistant" || turn.isUser === false
          ? ("assistant" as const)
          : ("user" as const),
      content: turn.content,
    }))
    .slice(-10);
}

function getFallbackResponse(message: string) {
  const lower = message.toLowerCase();
  const isSpanish =
    /(hola|ayuda|trabajo|dinero|pareja|ansiedad|estres|siento|quiero|necesito)/i.test(
      lower,
    );

  if (isSpanish) {
    if (/(peligro|miedo|violencia|seguir|acoso|lastimarme)/i.test(lower)) {
      return {
        reply:
          "Si sientes peligro inmediato, usa el boton SOS de Aurora o llama a emergencias en tu zona. Si puedes, aljate de la persona o lugar de riesgo y escribe a un contacto de confianza ahora mismo.",
        language: "es" as const,
        sentiment: "crisis" as const,
        emotionalState: "alarmed",
        wellbeingScore: 20,
        clarityScore: 35,
        supportScore: 95,
        resilienceScore: 40,
        topics: ["safety"],
        needsFollowUp: true,
        crisisDetected: true,
      };
    }

    return {
      reply:
        "Quiero ayudarte de verdad con esto. Cuentame un poco mas de lo que esta pasando y de lo que necesitas resolver primero.",
      language: "es" as const,
      sentiment: "neutral" as const,
      emotionalState: "unclear",
      wellbeingScore: 55,
      clarityScore: 50,
      supportScore: 75,
      resilienceScore: 55,
      topics: ["support"],
      needsFollowUp: true,
      crisisDetected: false,
    };
  }

  if (/(danger|unsafe|stalking|abuse|hurt myself|self harm|suicide)/i.test(lower)) {
    return {
      reply:
        "If you are in immediate danger, use Aurora's SOS button or call local emergency services now. If you can, move toward a safer place and contact someone you trust while we keep this simple.",
      language: "en" as const,
      sentiment: "crisis" as const,
      emotionalState: "alarmed",
      wellbeingScore: 20,
      clarityScore: 35,
      supportScore: 95,
      resilienceScore: 40,
      topics: ["safety"],
      needsFollowUp: true,
      crisisDetected: true,
    };
  }

  return {
    reply:
      "I want to be useful here, not generic. Tell me the part that feels most urgent and I will help you think it through step by step.",
    language: "en" as const,
    sentiment: "neutral" as const,
    emotionalState: "unclear",
    wellbeingScore: 55,
    clarityScore: 50,
    supportScore: 75,
    resilienceScore: 55,
    topics: ["support"],
    needsFollowUp: true,
    crisisDetected: false,
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

    const { message, conversationHistory } = (await request.json()) as {
      message?: string;
      conversationHistory?: ChatRouteTurn[];
    };

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const user = await convex.query(api.users.getUser, {
      userId: session.convexUserId as Id<"users">,
    });

    if (!user || user.workosId !== session.workosUserId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const rateLimitResult = await convex.mutation(api.rateLimit.checkRateLimit, {
      identifier: session.convexUserId,
      actionType: "aiChat",
      isPremium: Boolean(user.isPremium),
    });

    if (!rateLimitResult.allowed) {
      const resetMinutes = Math.ceil(rateLimitResult.resetIn / 60000);
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: user.isPremium
            ? `You've reached your daily assistant limit. Resets in ${resetMinutes} minutes.`
            : `You've used your 10 free Aurora messages today. Upgrade to Premium for more daily support. Resets in ${resetMinutes} minutes.`,
          remaining: rateLimitResult.remaining,
          resetIn: rateLimitResult.resetIn,
          upgradeToPremium: !user.isPremium,
        },
        { status: 429 },
      );
    }

    const authToken = await createConvexAuthToken({
      userId: session.convexUserId,
      workosUserId: session.workosUserId,
    });

    let output;
    try {
      output = await generateAssistantWellnessReply(
        message,
        normalizeHistory(conversationHistory),
        {
          userName: user.name,
          industry: user.industry,
          languagePreference: user.languagePreference,
        },
      );
    } catch (error) {
      console.error("Assistant LLM error:", error);
      output = getFallbackResponse(message);
    }

    await convex.mutation(api.ai.saveMessage, {
      authToken,
      userId: session.convexUserId as Id<"users">,
      userMessage: message.trim(),
      aiResponse: output.reply.trim(),
      metrics: {
        sentiment: output.sentiment,
        emotionalState: output.emotionalState,
        wellbeingScore: output.wellbeingScore,
        clarityScore: output.clarityScore,
        supportScore: output.supportScore,
        resilienceScore: output.resilienceScore,
        topics: output.topics,
        needsFollowUp: output.needsFollowUp,
        language: output.language,
      },
    });

    return NextResponse.json({
      response: output.reply.trim(),
      metrics: {
        sentiment: output.sentiment,
        topics: output.topics,
        emotionalState: output.emotionalState,
        needsFollowUp: output.needsFollowUp,
        crisisDetected: output.crisisDetected,
        wellbeingScore: output.wellbeingScore,
        clarityScore: output.clarityScore,
        supportScore: output.supportScore,
        resilienceScore: output.resilienceScore,
      },
    });
  } catch (error) {
    console.error("Error in AI chat endpoint:", error);
    const fallback = getFallbackResponse("help");
    return NextResponse.json({
      response: fallback.reply,
      metrics: {
        sentiment: fallback.sentiment,
        topics: fallback.topics,
        emotionalState: fallback.emotionalState,
        needsFollowUp: fallback.needsFollowUp,
        crisisDetected: fallback.crisisDetected,
        wellbeingScore: fallback.wellbeingScore,
        clarityScore: fallback.clarityScore,
        supportScore: fallback.supportScore,
        resilienceScore: fallback.resilienceScore,
      },
    });
  }
}
