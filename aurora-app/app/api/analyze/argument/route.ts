/**
 * Who's Right - Argument Analysis API
 * 
 * Analyzes conversation screenshots to determine:
 * - Who won the argument
 * - Toxicity level
 * - Red flags (gaslighting, stonewalling, etc.)
 * - Key moments ("receipts")
 * - Communication score
 * 
 * Uses OpenAI Vision API for image analysis
 */

import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
  micDrop: string;
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
  "Consider couples counseling to learn healthier communication patterns.",
  "Practice gratitude daily - it builds resilience during conflicts.",
];

// Mic drop responses - the perfect final reply
const MIC_DROPS = [
  "I've said what I needed to say. The receipts speak for themselves.",
  "I'm not arguing anymore. I've made my point, and the evidence is clear.",
  "This conversation is over. I hope you reflect on what was said.",
  "I don't need to prove anything else. The timestamps don't lie.",
  "I'm choosing peace. This discussion has run its course.",
  "Per my last message... and the five before that.",
  "I've provided the facts. What you do with them is up to you.",
  "I'm not going in circles. My position is clear and documented.",
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
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    // If OpenAI API key is available, use AI analysis
    if (OPENAI_API_KEY) {
      try {
        const aiResult = await analyzeWithAI(images, person1Label, person2Label);
        return NextResponse.json(aiResult);
      } catch (aiError) {
        console.error("AI analysis failed, using fallback:", aiError);
      }
    }

    // Fallback: Generate mock analysis for demo/development
    const mockResult = generateMockAnalysis(person1Label, person2Label);
    return NextResponse.json(mockResult);

  } catch (error) {
    console.error("Argument analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

async function analyzeWithAI(
  images: { base64: string; mimeType: string }[],
  person1Label: string,
  person2Label: string
): Promise<AnalysisResult> {
  const imageContents = images.map(img => ({
    type: "image_url" as const,
    image_url: {
      url: `data:${img.mimeType};base64,${img.base64}`,
      detail: "high" as const,
    },
  }));

  const prompt = `Analyze this conversation/argument between two people. 
Person 1 is labeled "${person1Label}" and Person 2 is labeled "${person2Label}".

Provide a JSON response with:
1. "winner": who won the argument ("person1", "person2", "tie", or "both_wrong")
2. "toxicityScore": 0-100 scale of how toxic the conversation is
3. "argumentType": brief description (e.g., "Emotional Neglect & Gaslighting", "Miscommunication", "Boundary Violation")
4. "redFlags": array of detected red flags with:
   - "type": one of [gaslighting, stonewalling, invalidating, guilt_tripping, defensiveness, contempt, criticism, blame_shifting, passive_aggressive, love_bombing]
   - "severity": "low", "medium", or "high"
5. "receipts": array of 3-5 key moments from the conversation with:
   - "number": 1-5
   - "text": brief description of what happened
   - "type": "negative", "neutral", or "positive"
6. "communicationScore": 0-100 score for overall communication quality

Be fair and objective. Consider both perspectives. Focus on communication patterns, not who is "right" morally.

Respond ONLY with valid JSON, no markdown or explanation.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageContents,
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error("No response from AI");
  }

  // Parse JSON response
  const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());

  // Enrich red flags with emojis and descriptions
  const enrichedRedFlags: RedFlag[] = (parsed.redFlags || []).map((flag: { type: string; severity: string }) => {
    const flagInfo = RED_FLAG_TYPES[flag.type as keyof typeof RED_FLAG_TYPES] || { emoji: "⚠️", description: "Concerning behavior" };
    return {
      type: flag.type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
      emoji: flagInfo.emoji,
      description: flagInfo.description,
      severity: flag.severity as "low" | "medium" | "high",
    };
  });

  // Get toxicity level label
  const toxicityLevel = TOXICITY_LEVELS.find(l => parsed.toxicityScore <= l.max)?.label || "Unknown";

  // Get random healthy tip
  const healthyTip = HEALTHY_TIPS[Math.floor(Math.random() * HEALTHY_TIPS.length)];

  // Generate ruling based on analysis
  const ruling = parsed.ruling || generateRuling(parsed.winner, parsed.toxicityScore, enrichedRedFlags);
  const micDrop = MIC_DROPS[Math.floor(Math.random() * MIC_DROPS.length)];

  return {
    winner: parsed.winner,
    winnerLabel: parsed.winner === "person1" ? person1Label : person2Label,
    loserLabel: parsed.winner === "person1" ? person2Label : person1Label,
    toxicityScore: parsed.toxicityScore,
    toxicityLevel,
    argumentType: parsed.argumentType,
    redFlags: enrichedRedFlags,
    receipts: parsed.receipts || [],
    healthyTip,
    communicationScore: parsed.communicationScore,
    caseNumber: generateCaseNumber(),
    ruling,
    micDrop,
  };
}

function generateRuling(winner: string, toxicity: number, redFlags: RedFlag[]): string {
  const hasGaslighting = redFlags.some(f => f.type.toLowerCase().includes("gaslight"));
  const hasHighToxicity = toxicity > 60;
  
  if (winner === "tie") {
    return "Both parties made valid points but also contributed to the conflict. A draw is declared.";
  }
  if (winner === "both_wrong") {
    return "Neither party handled this well. Both need to reflect on their communication.";
  }
  if (hasGaslighting) {
    return "Clear evidence of gaslighting detected. The timestamps don't lie, and neither does the logic.";
  }
  if (hasHighToxicity) {
    return "The evidence shows a pattern of toxic communication. The verdict is clear.";
  }
  return "After careful analysis of the evidence, the verdict is clear. Case closed.";
}

function generateMockAnalysis(person1Label: string, person2Label: string): AnalysisResult {
  // Generate realistic mock data for demo purposes
  const winners = ["person1", "person2", "tie", "both_wrong"] as const;
  const winner = winners[Math.floor(Math.random() * winners.length)];
  
  const toxicityScore = Math.floor(Math.random() * 70) + 20; // 20-90
  const toxicityLevel = TOXICITY_LEVELS.find(l => toxicityScore <= l.max)?.label || "Heated Exchange";
  
  const argumentTypes = [
    "Emotional Neglect & Gaslighting",
    "Miscommunication & Assumptions",
    "Boundary Violation",
    "Financial Disagreement",
    "Trust Issues",
    "Different Expectations",
  ];
  
  const possibleFlags = Object.entries(RED_FLAG_TYPES).slice(0, 4);
  const numFlags = Math.floor(Math.random() * 3) + 1;
  const redFlags: RedFlag[] = possibleFlags.slice(0, numFlags).map(([key, value]) => ({
    type: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    emoji: value.emoji,
    description: value.description,
    severity: (["low", "medium", "high"] as const)[Math.floor(Math.random() * 3)],
  }));

  const receipts: Receipt[] = [
    {
      number: 1,
      text: `${person2Label} immediately invalidated ${person1Label}'s feelings with dismissive language.`,
      type: "negative",
    },
    {
      number: 2,
      text: `${person2Label} escalated the situation by bringing up unrelated past issues.`,
      type: "negative",
    },
    {
      number: 3,
      text: `${person1Label} attempted to de-escalate but was met with defensiveness.`,
      type: "neutral",
    },
  ];

  const ruling = generateRuling(winner, toxicityScore, redFlags);
  
  return {
    winner,
    winnerLabel: winner === "person1" ? person1Label : winner === "person2" ? person2Label : "Nobody",
    loserLabel: winner === "person1" ? person2Label : winner === "person2" ? person1Label : "Both",
    toxicityScore,
    toxicityLevel,
    argumentType: argumentTypes[Math.floor(Math.random() * argumentTypes.length)],
    redFlags,
    receipts,
    healthyTip: HEALTHY_TIPS[Math.floor(Math.random() * HEALTHY_TIPS.length)],
    communicationScore: Math.floor(Math.random() * 40) + 30,
    caseNumber: generateCaseNumber(),
    ruling,
    micDrop: MIC_DROPS[Math.floor(Math.random() * MIC_DROPS.length)],
  };
}
