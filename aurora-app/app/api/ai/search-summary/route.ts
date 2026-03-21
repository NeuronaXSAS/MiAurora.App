import { NextRequest, NextResponse } from "next/server";
import { generateTextResponse } from "@/lib/ai/google-genai";
import {
  checkRequestRateLimit,
  isTrustedAppRequest,
} from "@/lib/api-security";

const LANGUAGE_PROMPTS: Record<string, string> = {
  en: "Respond in English with a warm, sharp, women-centered tone.",
  es: "Responde en espanol con un tono calido, claro y centrado en el bienestar femenino.",
  pt: "Responda em portugues com tom acolhedor, claro e atento ao bem-estar feminino.",
  fr: "Reponds en francais avec un ton chaleureux, clair et centre sur le bien-etre des femmes.",
  de: "Antworte auf Deutsch, warm, klar und mit Fokus auf das Wohlbefinden von Frauen.",
  ar: "Respond in Arabic with a warm, clear, supportive tone focused on women's wellbeing.",
  hi: "Respond in Hindi with a warm, clear, supportive tone focused on women's wellbeing.",
  zh: "Respond in Chinese with a warm, clear, supportive tone focused on women's wellbeing.",
};

function computeBiasAnalysis(results: Array<{ previewTitle?: string; previewSnippet?: string }>) {
  const positiveKeywords = [
    "women",
    "female",
    "inclusive",
    "safe",
    "support",
    "empower",
    "diverse",
    "equality",
  ];
  const negativeKeywords = [
    "only men",
    "boys club",
    "hostile",
    "discrimination",
  ];

  let biasScore = 70;
  const corpus = results
    .map((result) => `${result.previewTitle || ""} ${result.previewSnippet || ""}`)
    .join(" ")
    .toLowerCase();

  for (const keyword of positiveKeywords) {
    if (corpus.includes(keyword)) {
      biasScore += 3;
    }
  }

  for (const keyword of negativeKeywords) {
    if (corpus.includes(keyword)) {
      biasScore -= 10;
    }
  }

  const overallScore = Math.max(0, Math.min(100, biasScore));

  return {
    overallScore,
    label:
      overallScore >= 80
        ? "Women-Positive"
        : overallScore >= 60
          ? "Neutral"
          : "Mixed",
    recommendation:
      overallScore < 60
        ? "Consider exploring Aurora community perspectives for a stronger women-first lens on this topic."
        : "This search appears to include a reasonable amount of women-relevant perspective.",
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedAppRequest(request)) {
      return NextResponse.json({ summary: null, error: "Forbidden" }, { status: 403 });
    }

    const rateLimitResult = await checkRequestRateLimit(request, "aiSearchSummary");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          summary: null,
          error: "Rate limit exceeded",
          remaining: rateLimitResult.remaining,
          resetIn: rateLimitResult.resetIn,
        },
        { status: 429 },
      );
    }

    const { query, results, language = "en" } = (await request.json()) as {
      query?: string;
      results?: Array<{
        previewTitle?: string;
        previewSnippet?: string;
      }>;
      language?: string;
    };

    if (!query || !results || results.length === 0) {
      return NextResponse.json({ summary: null });
    }

    if (query.length > 200 || results.length > 10) {
      return NextResponse.json(
        { summary: null, error: "Request too large" },
        { status: 400 },
      );
    }

    const sources = results.slice(0, 6).map((result, index) => {
      const title = result.previewTitle || "Untitled result";
      const snippet = (result.previewSnippet || "").slice(0, 180);
      return `[${index + 1}] ${title} :: ${snippet}`;
    });

    const systemInstruction = `You are Aurora Search, a women-first search explainer inside Aurora App.

${LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en}

Rules:
- Answer in one short paragraph.
- Use inline citations like [1], [2], [3].
- Be specific and practical, not generic.
- Add a women-centered angle when relevant, but stay evidence-based.
- No markdown bullets or headings.
- Maximum 4 sentences.`;

    const summary = await generateTextResponse({
      message: `Search query: "${query}"\n\nSources:\n${sources.join("\n")}\n\nWrite a concise answer with inline citations.`,
      systemInstruction,
      temperature: 0.4,
      maxOutputTokens: 260,
    });

    return NextResponse.json({
      summary,
      sourcesCount: results.length,
      query,
      biasAnalysis: computeBiasAnalysis(results),
    });
  } catch (error) {
    console.error("AI Search Summary error:", error);
    return NextResponse.json({
      summary: null,
      error: "Failed to generate summary",
    });
  }
}
