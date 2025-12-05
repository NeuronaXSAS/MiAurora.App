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

export async function POST(request: NextRequest) {
  try {
    const { query, results } = await request.json();

    if (!query || !results || results.length === 0) {
      return NextResponse.json({ summary: null });
    }

    // Build context from search results
    const contextParts = results.slice(0, 8).map((r: any, i: number) => {
      return `[${i + 1}] ${r.type.toUpperCase()}: "${r.previewTitle}"
Content: ${r.previewSnippet}
Category: ${r.category || "General"}`;
    });

    const context = contextParts.join("\n\n");

    const systemPrompt = `You are Aurora App's AI search assistant - the world's first women-first search engine.

YOUR MISSION:
- Provide honest, helpful, bias-aware search summaries
- Prioritize women's safety, wellbeing, and empowerment
- Highlight potential gender bias in information
- Offer practical, actionable insights
- Be warm, supportive, and empowering

IMPORTANT RULES:
1. Always consider the woman's perspective first
2. Flag any content that might be biased against women
3. Highlight safety-relevant information prominently
4. Provide balanced, honest assessments
5. Never be condescending or preachy
6. Keep responses concise (2-3 short paragraphs max)
7. Reference specific sources when relevant
8. End with an encouraging note

BIAS AWARENESS:
- Note if sources seem male-dominated or lack women's perspectives
- Highlight women-positive resources and communities
- Flag potential safety concerns for women
- Recommend Aurora App community for verified, women-first information

TONE: Like a knowledgeable friend who genuinely wants to help and protect you.`;

    const userPrompt = `A woman is searching for: "${query}"

Here's what our community and web sources have shared:

${context}

Please provide a helpful AI summary that:
1. Directly answers or addresses her search query from a women-first perspective
2. Highlights any safety considerations relevant to women
3. Notes if there's potential gender bias in the available information
4. Synthesizes the most helpful and relevant insights
5. Encourages her to explore more on Aurora App for verified, women-first content

Keep it concise, warm, genuinely helpful, and empowering.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
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
