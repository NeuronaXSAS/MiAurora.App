import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { canUseGemini, recordGeminiUsage } from "@/lib/resource-guard";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const CATEGORIES = [
  "safety",
  "career",
  "health",
  "rights",
  "tech",
  "world",
] as const;

type DebateCategory = (typeof CATEGORIES)[number];

interface GeneratedDebate {
  category: DebateCategory;
  title: string;
  summary: string;
  day: number;
}

function isAdminRequest(request: NextRequest) {
  const adminKey = process.env.ADMIN_API_KEY;
  const authHeader = request.headers.get("authorization");
  if (!adminKey) {
    return false;
  }
  return authHeader === `Bearer ${adminKey}`;
}

function buildFallbackDebates(): GeneratedDebate[] {
  return [
    {
      day: 0,
      category: "safety",
      title: "Should public places be required to offer visible emergency help points?",
      summary:
        "Debating whether safety infrastructure should be as standard as fire exits in public venues.",
    },
    {
      day: 0,
      category: "career",
      title: "Should every job posting include a salary range?",
      summary:
        "Discussing whether pay transparency is necessary for fairer hiring and negotiation.",
    },
    {
      day: 0,
      category: "health",
      title: "Should menstrual and hormonal health be treated as a workplace wellbeing issue?",
      summary:
        "Examining whether employers should support women's health as a normal part of work policy.",
    },
    {
      day: 0,
      category: "rights",
      title: "Should online harassment penalties be stronger when targeted abuse is coordinated?",
      summary:
        "Exploring whether existing laws are enough when digital harm is repeated or organized.",
    },
    {
      day: 0,
      category: "tech",
      title: "Should AI products be required to publish bias testing results?",
      summary:
        "Discussing whether transparency should be mandatory before AI systems reach the public.",
    },
    {
      day: 0,
      category: "world",
      title: "Should cities measure safety policy success using women's lived experience, not only crime reports?",
      summary:
        "Debating whether public safety should be judged by how safe women actually feel and move.",
    },
  ];
}

async function generateDebatesWithAI(
  apiKey: string,
  startDate: string,
): Promise<GeneratedDebate[]> {
  const prompt = `You are creating debate topics for Aurora App, a safety-first wellbeing and community platform for women.

Generate 7 days of debate topics (42 total: 6 categories × 7 days).

Categories:
1. safety - women's personal safety, dignity, and risk prevention
2. career - workplace fairness, growth, boundaries, and pay
3. health - physical, hormonal, mental, and emotional wellbeing
4. rights - legal rights, equality, autonomy, and protection
5. tech - AI, privacy, digital safety, and product ethics
6. world - global issues affecting women and girls

Requirements:
- English only
- Each title must be a clear question under 90 characters
- Each summary must be one short sentence
- Avoid rage-bait, dehumanizing framing, and shallow clickbait
- Prioritize useful, respectful, thought-provoking debates
- Keep one debate per category per day

Starting date: ${startDate}

Respond ONLY with valid JSON array:
[
  {"day": 0, "category": "safety", "title": "Question here?", "summary": "Brief explanation."}
]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          topP: 0.9,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No response from Gemini");
  }

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from response");
  }

  const debates = JSON.parse(jsonMatch[0]) as GeneratedDebate[];
  return debates.filter(
    (debate) =>
      typeof debate.day === "number" &&
      CATEGORIES.includes(debate.category) &&
      typeof debate.title === "string" &&
      typeof debate.summary === "string",
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const startDate = body.startDate || new Date().toISOString().split("T")[0];
    const persist = body.persist !== false;

    const canUse = canUseGemini();
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

    let generated: GeneratedDebate[] = [];
    let source: "gemini" | "fallback" = "fallback";

    if (apiKey && canUse.allowed) {
      try {
        generated = await generateDebatesWithAI(apiKey, startDate);
        if (generated.length > 0) {
          recordGeminiUsage();
          source = "gemini";
        }
      } catch (error) {
        console.error("Debate generation fallback triggered:", error);
      }
    }

    if (generated.length === 0) {
      generated = buildFallbackDebates();
      source = "fallback";
    }

    const todaysDebates = generated
      .filter((debate) => debate.day === 0)
      .map((debate, index) => ({
        slot: index + 1,
        category: debate.category,
        title: debate.title.trim(),
        summary: debate.summary.trim(),
        sourceUrl:
          source === "gemini"
            ? "https://ai.google.dev/"
            : "https://miaurora.app",
        sourceName:
          source === "gemini"
            ? "Aurora Gemini Debate Pipeline"
            : "Aurora Editorial Fallback",
      }));

    let stored = null;
    if (persist) {
      stored = await convex.mutation(api.dailyDebates.replaceDebatesForDate, {
        date: startDate,
        debates: todaysDebates,
        deactivateExisting: true,
      });
    }

    return NextResponse.json({
      success: true,
      source,
      persisted: persist,
      stored,
      count: todaysDebates.length,
      quotaAvailable: canUse.allowed,
      quotaMessage: canUse.reason || "Quota available",
      debates: todaysDebates,
    });
  } catch (error) {
    console.error("Daily debate pipeline error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get("date") || undefined;
    const canUse = canUseGemini();
    const pipeline = await convex.query(api.dailyDebates.getDebatePipelineStatus, {
      date,
    });

    return NextResponse.json({
      pipeline,
      provider: process.env.GOOGLE_AI_API_KEY ? "gemini" : "fallback",
      quotaAvailable: canUse.allowed,
      quotaRemaining: canUse.remaining,
      quotaMessage: canUse.reason || "Quota available",
      adminApiKeyConfigured: Boolean(process.env.ADMIN_API_KEY),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
