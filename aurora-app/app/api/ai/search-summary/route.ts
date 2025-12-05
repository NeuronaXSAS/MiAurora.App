/**
 * Aurora App - AI Search Summary API
 * 
 * Generates AI-powered summaries from community content.
 * Competes with Google by providing more human, honest results.
 * No ads, no manipulation - just real community wisdom.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

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

    const systemPrompt = `You are Aurora App's AI assistant, helping women find honest, helpful information from our community.

IMPORTANT RULES:
- Be warm, supportive, and empowering
- Synthesize the community content into a helpful summary
- Focus on practical, actionable insights
- Never be condescending or preachy
- Keep responses concise (2-3 short paragraphs max)
- Reference specific sources when relevant (e.g., "According to community posts...")
- If the content is about safety, be extra careful and supportive
- End with an encouraging note about joining the community for more

TONE: Like a knowledgeable friend who genuinely wants to help.`;

    const userPrompt = `A woman is searching for: "${query}"

Here's what our community has shared on this topic:

${context}

Please provide a helpful AI summary that:
1. Directly answers or addresses their search query
2. Synthesizes insights from the community content
3. Highlights the most relevant and helpful information
4. Encourages them to explore more by joining Aurora App

Keep it concise, warm, and genuinely helpful.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        { role: "user", content: userPrompt }
      ],
      system: systemPrompt,
    });

    const summary = response.content[0].type === "text" 
      ? response.content[0].text 
      : null;

    return NextResponse.json({ 
      summary,
      sourcesCount: results.length,
      query,
    });

  } catch (error) {
    console.error("AI Search Summary error:", error);
    return NextResponse.json({ summary: null, error: "Failed to generate summary" });
  }
}
