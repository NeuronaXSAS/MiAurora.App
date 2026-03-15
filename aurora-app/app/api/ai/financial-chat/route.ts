import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createConvexAuthToken } from "@/lib/auth-proof";
import { generateFinanceCoachReply } from "@/lib/ai/aurora-brain";
import { isSameOriginRequest, readSession } from "@/lib/server-session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface FinanceHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

function cleanExtractedData(
  extractedData: Record<string, number | string | undefined>,
) {
  return Object.fromEntries(
    Object.entries(extractedData).filter(([, value]) => value !== undefined),
  );
}

function getFinanceFallback(message: string) {
  const isSpanish =
    /(hola|dinero|deuda|ahorro|ingreso|gasto|presupuesto)/i.test(message);

  return {
    reply: isSpanish
      ? "Puedo ayudarte a ordenar esto mejor si me dices tres cosas: cuanto entra al mes, cuanto sale al mes y cual es la prioridad mas urgente ahora mismo."
      : "I can make this much more useful if you tell me three things: what comes in each month, what goes out each month, and what feels most urgent right now.",
    language: isSpanish ? ("es" as const) : ("en" as const),
    summary: isSpanish
      ? "Necesitas una foto mas clara de tu situacion financiera."
      : "You need a clearer picture of your current money situation.",
    nextActions: isSpanish
      ? [
          "Anota ingreso neto mensual.",
          "Anota gastos fijos mensuales.",
          "Define una prioridad para los proximos 30 dias.",
        ]
      : [
          "Write down your monthly take-home income.",
          "List your fixed monthly expenses.",
          "Pick one money priority for the next 30 days.",
        ],
    extractedData: {},
    riskLevel: "medium" as const,
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

    const { message } = (await request.json()) as { message?: string };
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
      actionType: "aiFinancialChat",
      isPremium: Boolean(user.isPremium),
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message:
            "You've reached your financial chat limit for now. Please try again later.",
          remaining: rateLimitResult.remaining,
          resetIn: rateLimitResult.resetIn,
        },
        { status: 429 },
      );
    }

    const authToken = await createConvexAuthToken({
      userId: session.convexUserId,
      workosUserId: session.workosUserId,
    });

    const chatHistory = await convex.query(api.financialChat.getChatHistory, {
      authToken,
      userId: session.convexUserId as Id<"users">,
      limit: 8,
    }).catch(() => [] as Array<{ userMessage: string; aiResponse: string }>);

    const profile = await convex.query(api.financialChat.getFinancialProfile, {
      authToken,
      userId: session.convexUserId as Id<"users">,
    }).catch(() => null);

    let output;
    try {
      const history: FinanceHistoryTurn[] = chatHistory.flatMap((turn) => [
        { role: "user", content: turn.userMessage },
        { role: "assistant", content: turn.aiResponse },
      ]);

      output = await generateFinanceCoachReply(message.trim(), {
        userName: user.name,
        history,
        profile,
      });
    } catch (error) {
      console.error("Finance LLM error:", error);
      output = getFinanceFallback(message.trim());
    }

    return NextResponse.json({
      response: output.reply.trim(),
      summary: output.summary,
      nextActions: output.nextActions,
      riskLevel: output.riskLevel,
      extractedData: cleanExtractedData(output.extractedData),
    });
  } catch (error) {
    console.error("Financial chat error:", error);
    const fallback = getFinanceFallback("help");
    return NextResponse.json(
      {
        response: fallback.reply,
        summary: fallback.summary,
        nextActions: fallback.nextActions,
        riskLevel: fallback.riskLevel,
        extractedData: fallback.extractedData,
      },
      { status: 200 },
    );
  }
}
