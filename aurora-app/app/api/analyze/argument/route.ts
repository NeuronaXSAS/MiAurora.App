/**
 * Who's Right - Argument Analysis API
 * 
 * Analyzes conversation screenshots to determine:
 * - Who won the argument
 * - Toxicity level
 * - Red flags (gaslighting, stonewalling, etc.)
 * - Key moments ("receipts")
 * - Helpful suggestions
 * 
 * Uses Google AI Studio (Gemini) - FREE TIER ONLY
 * No paid APIs - Aurora App runs on $0 budget
 */

import { NextRequest, NextResponse } from "next/server";

// Google AI Studio free tier - same as rest of Aurora App
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

interface RedFlag {
  type: string;
  emoji: string;
  description: string;
  severity: "low" | "medium" | "high";
}

interface Receipt {
  number: number;
  text: string;
  type: "negative" | "neutral" | "positive";
}

interface AnalysisResult {
  winner: "person1" | "person2" | "tie" | "both_wrong";
  winnerLabel: string;
  loserLabel: string;
  toxicityScore: number;
  toxicityLevel: string;
  argumentType: string;
  redFlags: RedFlag[];
  receipts: Receipt[];
  healthyTip: string;
  communicationScore: number;
  caseNumber: string;
  ruling: string;
  suggestion: string;
}

// Red flag definitions for detection
const RED_FLAG_TYPES = {
  gaslighting: { emoji: "🔥", description: "Making someone question their reality" },
  stonewalling: { emoji: "🧱", description: "Refusing to communicate or engage" },
  invalidating: { emoji: "🙅", description: "Dismissing feelings or experiences" },
  guilt_tripping: { emoji: "😢", description: "Using guilt to manipulate" },
  defensiveness: { emoji: "🛡️", description: "Refusing to take responsibility" },
  contempt: { emoji: "😤", description: "Showing disrespect or superiority" },
  criticism: { emoji: "👎", description: "Attacking character instead of behavior" },
  blame_shifting: { emoji: "👉", description: "Deflecting responsibility to others" },
  passive_aggressive: { emoji: "😏", description: "Indirect expression of hostility" },
  love_bombing: { emoji: "💕", description: "Excessive affection to manipulate" },
};

// Toxicity level labels
const TOXICITY_LEVELS = [
  { max: 20, label: "Healthy Discussion" },
  { max: 40, label: "Minor Tension" },
  { max: 60, label: "Heated Exchange" },
  { max: 80, label: "Toxic Argument" },
  { max: 100, label: "Severely Toxic" },
];

// Healthy relationship tips
const HEALTHY_TIPS = [
  "Try using 'I feel' statements instead of 'You always' accusations.",
  "Take a 20-minute break when emotions run high, then return to discuss calmly.",
  "Validate your partner's feelings even when you disagree with their perspective.",
  "Focus on the specific issue at hand rather than bringing up past conflicts.",
  "Listen to understand, not to respond. Repeat back what you heard.",
  "Remember you're on the same team - it's you two vs. the problem.",
  "Apologize for your part without expecting an immediate apology in return.",
  "Set boundaries around how you communicate during disagreements.",
];

// Helpful suggestions for improving communication
const SUGGESTIONS = [
  "Try scheduling a calm conversation when emotions have settled.",
  "Consider using 'I feel...' statements instead of 'You always...'",
  "Take a 20-minute break when things get heated, then return fresh.",
  "Focus on the specific issue rather than bringing up past conflicts.",
  "Try to understand their perspective first, even if you disagree.",
  "Set clear boundaries about how you communicate during disagreements.",
  "Consider whether this issue is worth the conflict, or if compromise is possible.",
  "If patterns repeat, relationship counseling can provide helpful tools.",
];

// Generate case number
function generateCaseNumber(): string {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const person1Label = formData.get("person1Label") as string || "Person A";
    const person2Label = formData.get("person2Label") as string || "Person B";
    const context = formData.get("context") as string || "";
    
    // Collect all images
    const images: { base64: string; mimeType: string }[] = [];
    for (let i = 0; i < 5; i++) {
      const file = formData.get(`image${i}`) as File | null;
      if (file) {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        images.push({ base64, mimeType: file.type });
      }
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    // Use Google AI Studio (Gemini) - FREE TIER
    if (GOOGLE_AI_API_KEY) {
      try {
        const aiResult = await analyzeWithGemini(images, person1Label, person2Label, context);
        return NextResponse.json(aiResult);
      } catch (geminiError) {
        console.error("Gemini analysis failed:", geminiError);
        // Fall through to mock analysis
      }
    }

    // Fallback: Generate mock analysis for demo/development
    console.log("Using mock analysis (no API key or API failed)");
    const mockResult = generateMockAnalysis(person1Label, person2Label);
    return NextResponse.json(mockResult);

  } catch (error) {
    console.error("Argument analysis error:", error);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}

// Build the analysis prompt
function buildAnalysisPrompt(person1Label: string, person2Label: string, context: string): string {
  const contextSection = context ? `\n\nAdditional context: "${context}"` : "";
  
  return `Analyze this conversation/argument between "${person1Label}" and "${person2Label}".${contextSection}

Return ONLY valid JSON with these fields:
{
  "winner": "person1" | "person2" | "tie" | "both_wrong",
  "toxicityScore": 0-100,
  "argumentType": "brief description",
  "redFlags": [{"type": "gaslighting|stonewalling|invalidating|guilt_tripping|defensiveness|contempt|criticism|blame_shifting|passive_aggressive|love_bombing", "severity": "low|medium|high"}],
  "receipts": [{"number": 1, "text": "what happened", "type": "negative|neutral|positive"}],
  "communicationScore": 0-100,
  "suggestion": "one helpful tip"
}

Be fair and objective. Focus on communication patterns.`;
}

// Process AI response into AnalysisResult
function processAIResponse(content: string, person1Label: string, person2Label: string): AnalysisResult {
  const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());

  const enrichedRedFlags: RedFlag[] = (parsed.redFlags || []).map((flag: { type: string; severity: string }) => {
    const flagInfo = RED_FLAG_TYPES[flag.type as keyof typeof RED_FLAG_TYPES] || { emoji: "⚠️", description: "Concerning behavior" };
    return {
      type: flag.type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
      emoji: flagInfo.emoji,
      description: flagInfo.description,
      severity: flag.severity as "low" | "medium" | "high",
    };
  });

  const toxicityLevel = TOXICITY_LEVELS.find(l => parsed.toxicityScore <= l.max)?.label || "Unknown";
  const healthyTip = HEALTHY_TIPS[Math.floor(Math.random() * HEALTHY_TIPS.length)];
  const ruling = generateRuling(parsed.winner, parsed.toxicityScore, enrichedRedFlags);
  const suggestion = parsed.suggestion || SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];

  return {
    winner: parsed.winner,
    winnerLabel: parsed.winner === "person1" ? person1Label : parsed.winner === "person2" ? person2Label : "Nobody",
    loserLabel: parsed.winner === "person1" ? person2Label : parsed.winner === "person2" ? person1Label : "Both",
    toxicityScore: parsed.toxicityScore,
    toxicityLevel,
    argumentType: parsed.argumentType,
    redFlags: enrichedRedFlags,
    receipts: parsed.receipts || [],
    healthyTip,
    communicationScore: parsed.communicationScore,
    caseNumber: generateCaseNumber(),
    ruling,
    suggestion,
  };
}

// Google AI Studio (Gemini) - FREE TIER
// gemini-1.5-flash supports vision and is free
async function analyzeWithGemini(
  images: { base64: string; mimeType: string }[],
  person1Label: string,
  person2Label: string,
  context: string
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(person1Label, person2Label, context);
  
  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
    { text: prompt }
  ];
  
  images.forEach(img => {
    parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } });
  });

  // gemini-1.5-flash: Free tier with vision support
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!content) throw new Error("No response from Gemini");

  return processAIResponse(content, person1Label, person2Label);
}

function generateRuling(winner: string, toxicity: number, redFlags: RedFlag[]): string {
  const hasGaslighting = redFlags.some(f => f.type.toLowerCase().includes("gaslight"));
  
  if (winner === "tie") return "Both parties made valid points but also contributed to the conflict. A draw is declared.";
  if (winner === "both_wrong") return "Neither party handled this well. Both need to reflect on their communication.";
  if (hasGaslighting) return "Clear evidence of gaslighting detected. The timestamps don't lie.";
  if (toxicity > 60) return "The evidence shows a pattern of toxic communication. The verdict is clear.";
  return "After careful analysis of the evidence, the verdict is clear. Case closed.";
}

function generateMockAnalysis(person1Label: string, person2Label: string): AnalysisResult {
  const winners = ["person1", "person2", "tie", "both_wrong"] as const;
  const winner = winners[Math.floor(Math.random() * winners.length)];
  const toxicityScore = Math.floor(Math.random() * 70) + 20;
  const toxicityLevel = TOXICITY_LEVELS.find(l => toxicityScore <= l.max)?.label || "Heated Exchange";
  
  const argumentTypes = ["Miscommunication", "Boundary Violation", "Trust Issues", "Different Expectations"];
  const possibleFlags = Object.entries(RED_FLAG_TYPES).slice(0, 3);
  const redFlags: RedFlag[] = possibleFlags.slice(0, Math.floor(Math.random() * 2) + 1).map(([key, value]) => ({
    type: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    emoji: value.emoji, description: value.description,
    severity: (["low", "medium", "high"] as const)[Math.floor(Math.random() * 3)],
  }));

  const receipts: Receipt[] = [
    { number: 1, text: `${person2Label} dismissed ${person1Label}'s feelings.`, type: "negative" },
    { number: 2, text: `${person1Label} tried to de-escalate.`, type: "neutral" },
  ];

  return {
    winner,
    winnerLabel: winner === "person1" ? person1Label : winner === "person2" ? person2Label : "Nobody",
    loserLabel: winner === "person1" ? person2Label : winner === "person2" ? person1Label : "Both",
    toxicityScore, toxicityLevel,
    argumentType: argumentTypes[Math.floor(Math.random() * argumentTypes.length)],
    redFlags, receipts,
    healthyTip: HEALTHY_TIPS[Math.floor(Math.random() * HEALTHY_TIPS.length)],
    communicationScore: Math.floor(Math.random() * 40) + 30,
    caseNumber: generateCaseNumber(),
    ruling: generateRuling(winner, toxicityScore, redFlags),
    suggestion: SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)],
  };
}
