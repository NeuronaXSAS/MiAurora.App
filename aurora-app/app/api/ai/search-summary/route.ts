/**
 * Aurora App - AI Search Summary API
 * 
 * The world's first women-first search engine AI.
 * Generates bias-aware, women-positive summaries from search results.
 * Uses Google AI Studio (Gemini) as the AI provider.
 * No ads, no manipulation - just real community wisdom.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

// Language-specific prompts for international users
const LANGUAGE_PROMPTS: Record<string, { instruction: string; tone: string }> = {
  en: { instruction: "Respond in English.", tone: "warm and supportive" },
  es: { instruction: "Responde en español. Usa un tono cálido y cercano.", tone: "cálido y solidario" },
  pt: { instruction: "Responda em português. Use um tom acolhedor e solidário.", tone: "acolhedor e solidário" },
  fr: { instruction: "Réponds en français. Utilise un ton chaleureux et bienveillant.", tone: "chaleureux et bienveillant" },
  de: { instruction: "Antworte auf Deutsch. Verwende einen warmen und unterstützenden Ton.", tone: "warm und unterstützend" },
  ar: { instruction: "أجب باللغة العربية. استخدم نبرة دافئة وداعمة.", tone: "دافئ وداعم" },
  hi: { instruction: "हिंदी में जवाब दें। गर्मजोशी और सहायक स्वर का उपयोग करें।", tone: "गर्मजोशी और सहायक" },
  zh: { instruction: "用中文回答。使用温暖和支持的语气。", tone: "温暖和支持" },
};

export async function POST(request: NextRequest) {
  try {
    const { query, results, language = 'en' } = await request.json();

    if (!query || !results || results.length === 0) {
      return NextResponse.json({ summary: null });
    }

    // Build context from search results with source numbers for citations
    const contextParts = results.slice(0, 6).map((r: any, i: number) => {
      return `[${i + 1}] "${r.previewTitle}" - ${r.previewSnippet?.slice(0, 150)}...`;
    });

    const context = contextParts.join("\n");
    const langPrompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en;

    const systemPrompt = `You are Aurora, the AI assistant for Aurora Search - the world's first women-first search engine.

${langPrompt.instruction}

YOUR PERSONALITY:
- You're like a wise, supportive older sister who always has your back
- You're insightful and specific, never generic or vague
- You're safety-conscious, always considering women's wellbeing
- You're empowering, encouraging confidence and action

RESPONSE FORMAT:
1. Direct answer (2-3 sentences) - Get to the point with specific, actionable info
2. Women's perspective (1 sentence) - Add insight relevant to women's experience
3. Empowering close (1 sentence) - End with encouragement like "You've got this!" or "Trust your instincts"

RULES:
- Use [1], [2], etc. to cite sources - these become clickable links
- Be specific, not generic. "Check reviews on [1]" not "do your research"
- If safety-related, prioritize caution and verified sources
- No fluff, no filler words
- Maximum 4 sentences total

FORMAT: Short paragraph with inline citations. No bullet points.`;

    const userPrompt = `Search: "${query}"

Sources:
${context}

Give a brief, helpful summary (3-4 sentences max) with source citations [1], [2], etc.`;

    // COST OPTIMIZATION: Use gemini-2.0-flash-lite (most economical)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-lite",
    });

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const summary = response.text();

    // Calculate bias metrics (simplified - in production would use more sophisticated analysis)
    const biasKeywords = {
      positive: ["women", "female", "inclusive", "safe", "support", "empower", "diverse", "equality"],
      negative: ["only men", "boys club", "aggressive", "hostile", "discrimination"],
    };

    let biasScore = 70;
    const allText = results.map((r: any) => `${r.previewTitle} ${r.previewSnippet}`).join(" ").toLowerCase();
    
    biasKeywords.positive.forEach(kw => {
      if (allText.includes(kw)) biasScore += 3;
    });
    biasKeywords.negative.forEach(kw => {
      if (allText.includes(kw)) biasScore -= 10;
    });
    
    biasScore = Math.max(0, Math.min(100, biasScore));

    return NextResponse.json({ 
      summary,
      sourcesCount: results.length,
      query,
      biasAnalysis: {
        overallScore: biasScore,
        label: biasScore >= 80 ? "Women-Positive" : biasScore >= 60 ? "Neutral" : "Mixed",
        recommendation: biasScore < 60 
          ? "Consider exploring Aurora App community for more women-focused perspectives on this topic."
          : "This search shows good representation of women's perspectives.",
      },
    });

  } catch (error) {
    console.error("AI Search Summary error:", error);
    return NextResponse.json({ summary: null, error: "Failed to generate summary" });
  }
}
