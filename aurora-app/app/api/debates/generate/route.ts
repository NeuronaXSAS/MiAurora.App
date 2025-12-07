/**
 * AI Debate Generation API - Weekly Batch Generation
 * 
 * COST-OPTIMIZED STRATEGY:
 * - Generates 7 days of debates in ONE API call (42 debates total)
 * - Uses Google AI Studio free tier (Gemini)
 * - Integrates with resource-guard for quota protection
 * - Falls back to predefined topics if AI fails or quota exceeded
 * 
 * USAGE:
 * - Admin-triggered only (no automatic calls)
 * - Call once per week to generate next 7 days
 * - Single prompt = ~500 tokens input, ~2000 tokens output
 * 
 * ESTIMATED COST: $0/month (free tier) or ~$0.01/week if paid
 */

import { NextRequest, NextResponse } from "next/server";
import { canUseGemini, recordGeminiUsage } from "@/lib/resource-guard";

// AI Generation is DISABLED by default - enable when ready
const AI_DEBATES_ENABLED = false;

// Categories for debates
const CATEGORIES = ["safety", "career", "health", "rights", "tech", "world"] as const;

interface GeneratedDebate {
  category: typeof CATEGORIES[number];
  title: string;
  summary: string;
  day: number; // 0-6 (days from start date)
}

interface WeeklyDebatesResponse {
  success: boolean;
  debates?: GeneratedDebate[];
  source: "ai" | "fallback";
  message: string;
  daysGenerated?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<WeeklyDebatesResponse>> {
  try {
    // Check if AI generation is enabled
    if (!AI_DEBATES_ENABLED) {
      return NextResponse.json({
        success: false,
        source: "fallback",
        message: "AI debate generation is disabled. Using predefined topics.",
      });
    }

    // Check resource quota before making AI call
    const canUse = canUseGemini();
    if (!canUse.allowed) {
      return NextResponse.json({
        success: false,
        source: "fallback",
        message: `AI quota exceeded: ${canUse.reason}. Using predefined topics.`,
      });
    }

    // Get API key
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        source: "fallback",
        message: "Google AI API key not configured. Using predefined topics.",
      });
    }

    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({}));
    const startDate = body.startDate || new Date().toISOString().split("T")[0];

    // Generate debates using Gemini
    const debates = await generateDebatesWithAI(apiKey, startDate);
    
    if (debates && debates.length > 0) {
      // Record successful API usage
      recordGeminiUsage();
      
      return NextResponse.json({
        success: true,
        debates,
        source: "ai",
        message: `Generated ${debates.length} debates for 7 days starting ${startDate}`,
        daysGenerated: 7,
      });
    }

    return NextResponse.json({
      success: false,
      source: "fallback",
      message: "AI generation returned no results. Using predefined topics.",
    });

  } catch (error) {
    console.error("AI debate generation error:", error);
    return NextResponse.json({
      success: false,
      source: "fallback",
      message: `AI generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Generate debates using Google AI (Gemini)
 * Single prompt generates all 42 debates (6 categories × 7 days)
 */
async function generateDebatesWithAI(apiKey: string, startDate: string): Promise<GeneratedDebate[]> {
  const prompt = `You are creating debate topics for Aurora App, a women-focused safety and community platform.

Generate 7 days of debate topics (42 total: 6 categories × 7 days).

Categories:
1. safety - Women's personal safety, security, protection
2. career - Workplace, professional development, gender equality at work
3. health - Women's health, mental health, wellness
4. rights - Women's rights, legal issues, equality
5. tech - Technology, AI, digital safety, women in tech
6. world - Global issues affecting women, international news

Requirements:
- Each topic should be a thought-provoking question that women can vote Agree/Disagree/Neutral
- Topics should be relevant to current events and women's experiences
- Keep titles under 80 characters
- Summaries should be 1 sentence explaining the debate
- Make topics diverse - don't repeat similar themes

Starting date: ${startDate}

Respond ONLY with valid JSON array, no markdown:
[
  {"day": 0, "category": "safety", "title": "Question here?", "summary": "Brief explanation."},
  ...
]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4000,
          topP: 0.9,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error("No response from Gemini");
  }

  // Parse JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from response");
  }

  const debates: GeneratedDebate[] = JSON.parse(jsonMatch[0]);
  
  // Validate structure
  const validDebates = debates.filter(d => 
    typeof d.day === "number" &&
    CATEGORIES.includes(d.category as any) &&
    typeof d.title === "string" &&
    typeof d.summary === "string"
  );

  return validDebates;
}

// GET endpoint to check AI generation status
export async function GET(): Promise<NextResponse> {
  const canUse = canUseGemini();
  
  return NextResponse.json({
    aiEnabled: AI_DEBATES_ENABLED,
    quotaAvailable: canUse.allowed,
    quotaRemaining: canUse.remaining,
    quotaMessage: canUse.reason || "Quota available",
    instructions: AI_DEBATES_ENABLED 
      ? "POST to this endpoint to generate 7 days of AI debates"
      : "AI generation is disabled. Set AI_DEBATES_ENABLED=true to enable.",
  });
}
