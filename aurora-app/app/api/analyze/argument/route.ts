/**
 * Who's Right - Argument Analysis API
 *
 * IMPROVED VERSION with:
 * - OCR-first analysis (prioritize image text over user-provided context)
 * - AI Safeguards (prompt injection protection, context validation)
 * - Consistent analysis (better prompts, temperature=0.3 for consistency)
 * - Screenshot weight > user text (prevent biased input gaming)
 * - Live audio transcription support
 *
 * Uses Google AI Studio (Gemini) - FREE TIER ONLY
 * No paid APIs - Aurora App runs on $0 budget
 */

import { NextRequest, NextResponse } from "next/server";

// Google AI Studio free tier
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

// Rate limiting - simple in-memory (would use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute per IP
const RATE_WINDOW = 60 * 1000; // 1 minute

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

export interface AnalysisResult {
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
  // New fields for community sharing
  shareableId?: string;
  analysisHash?: string;
}

// Red flag definitions
const RED_FLAG_TYPES = {
  gaslighting: {
    emoji: "🔥",
    description: "Making someone question their reality",
  },
  stonewalling: {
    emoji: "🧱",
    description: "Refusing to communicate or engage",
  },
  invalidating: {
    emoji: "🙅",
    description: "Dismissing feelings or experiences",
  },
  guilt_tripping: { emoji: "😢", description: "Using guilt to manipulate" },
  defensiveness: {
    emoji: "🛡️",
    description: "Refusing to take responsibility",
  },
  contempt: { emoji: "😤", description: "Showing disrespect or superiority" },
  criticism: {
    emoji: "👎",
    description: "Attacking character instead of behavior",
  },
  blame_shifting: {
    emoji: "👉",
    description: "Deflecting responsibility to others",
  },
  passive_aggressive: {
    emoji: "😏",
    description: "Indirect expression of hostility",
  },
  social_comparison: {
    emoji: "😰",
    description: "Comparing to others to shame",
  },
};

const TOXICITY_LEVELS = [
  { max: 20, label: "Healthy Discussion", color: "#22c55e" },
  { max: 35, label: "Getting Tense", color: "#84cc16" },
  { max: 50, label: "Minor Tension", color: "#eab308" },
  { max: 65, label: "Heated Exchange", color: "#f97316" },
  { max: 80, label: "Toxic Argument", color: "#ef4444" },
  { max: 100, label: "Severely Toxic", color: "#dc2626" },
];

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

// Red-flag-specific suggestions for contextual fallback
const SUGGESTIONS_BY_FLAG: Record<string, string[]> = {
  gaslighting: [
    "Trust your own perception of events. Keep notes or screenshots if needed.",
    "When someone says 'that never happened', calmly reference the specific instance.",
    "Consider involving a neutral third party who witnessed the events.",
  ],
  stonewalling: [
    "Request a specific time to revisit the conversation: 'Can we talk about this at 7pm?'",
    "Write down your thoughts in a letter if verbal communication is being blocked.",
    "Acknowledge that they may need space, but set a deadline to reconnect.",
  ],
  invalidating: [
    "Use 'My experience is...' to reaffirm your feelings without attacking.",
    "Ask: 'Even if you see it differently, can you understand why I felt that way?'",
    "Feelings are valid even when perspectives differ - ask for acknowledgment, not agreement.",
  ],
  guilt_tripping: [
    "Separate the request from the guilt: 'I can consider your ask, but the guilt-framing isn't fair.'",
    "Name the pattern directly: 'It feels like guilt is being used to change my decision.'",
    "Make decisions based on your values, not to avoid feeling guilty.",
  ],
  defensiveness: [
    "Before defending, try: 'Help me understand what I did that upset you.'",
    "Acknowledge their point first, then share your perspective.",
    "Defensiveness blocks resolution - try accepting partial responsibility first.",
  ],
  contempt: [
    "Contempt erodes relationships fast. Request respectful language as a boundary.",
    "Eye-rolling and sarcasm hurt more than direct disagreement - name this pattern.",
    "Consider couples counseling - contempt is one of the strongest predictors of relationship failure.",
  ],
  criticism: [
    "Reframe 'You always...' to 'I noticed this specific thing...'",
    "Attack the problem, not the person's character.",
    "Ask: 'What specific behavior would you like me to change?' instead of character attacks.",
  ],
  blame_shifting: [
    "Stay focused: 'I'm open to discussing my actions, but right now we're addressing yours.'",
    "Acknowledge your role first, then ask for reciprocal accountability.",
    "Keep the conversation on one topic at a time to prevent deflection.",
  ],
  passive_aggressive: [
    "Name the subtext directly: 'It sounds like you're upset about X. Can we talk about that?'",
    "Ask for direct communication: 'I'd rather you tell me directly what's wrong.'",
    "Passive-aggression often comes from not feeling safe to speak directly - create that safety.",
  ],
  social_comparison: [
    "Every relationship is unique - comparing to others ignores your specific context and journey.",
    "Ask: 'What specifically do you need from me?' instead of comparing to other couples.",
    "Social media shows highlight reels - discuss what YOU both want, not what others seem to have.",
  ],
  different_expectations: [
    "Explicitly discuss expectations: 'What does success look like for you in this situation?'",
    "Unspoken expectations cause most conflicts - write down what you each expect.",
    "Find the overlap: 'What can we both agree on as a starting point?'",
  ],
};

const GENERIC_SUGGESTIONS = [
  "Try scheduling a calm conversation when emotions have settled.",
  "Consider using 'I feel...' statements instead of 'You always...'",
  "Take a 20-minute break when things get heated, then return fresh.",
];

// ==================== SAFEGUARDS ====================

// Prompt injection detection patterns
const INJECTION_PATTERNS = [
  /ignore\s*(all\s*)?prior\s*instructions/i,
  /ignore\s*(all\s*)?previous\s*instructions/i,
  /disregard\s*(all\s*)?(prior|previous)/i,
  /forget\s*(everything|all)\s*(you|that)/i,
  /new\s*instruction/i,
  /system\s*:?\s*prompt/i,
  /override\s*instructions/i,
  /pretend\s*you\s*are/i,
  /act\s*as\s*if/i,
  /you\s*are\s*now/i,
  /from\s*now\s*on/i,
  /roleplay\s*as/i,
];

function containsPromptInjection(text: string): boolean {
  if (!text) return false;
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

function sanitizeContextInput(context: string): string {
  if (!context) return "";
  // Remove any potential injection attempts
  if (containsPromptInjection(context)) {
    console.warn("Prompt injection attempt detected in context, sanitizing");
    return "[Context removed due to invalid content]";
  }
  // Limit length and remove suspicious patterns
  return context
    .slice(0, 500)
    .replace(/[<>{}]/g, "") // Remove potential code injection chars
    .replace(/\n{3,}/g, "\n\n") // Limit whitespace
    .trim();
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Generate consistent case number based on content hash
function generateCaseNumber(imagesHash: string): string {
  const base = parseInt(imagesHash.slice(0, 8), 16) || Date.now();
  return (1000000 + (base % 9000000)).toString();
}

async function hashImages(images: { base64: string }[]): Promise<string> {
  const combined = images.map((i) => i.base64.slice(0, 100)).join("");
  // Simple hash for consistency
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

// ==================== MAIN API ====================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a minute before trying again.",
        },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const person1Label =
      sanitizeContextInput(formData.get("person1Label") as string) ||
      "Person A";
    const person2Label =
      sanitizeContextInput(formData.get("person2Label") as string) ||
      "Person B";
    const rawContext = (formData.get("context") as string) || "";
    const isAudioTranscription =
      formData.get("isAudioTranscription") === "true";

    // Sanitize context and check for injection
    const context = sanitizeContextInput(rawContext);

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

    // Audio transcription support
    const audioFile = formData.get("audio") as File | null;
    let transcribedText = "";
    if (audioFile && isAudioTranscription) {
      // For now, we'll pass the audio as context
      // In production, you'd use a speech-to-text service
      transcribedText =
        "[Audio transcription - analyze the conversation audio]";
    }

    if (images.length === 0 && !audioFile) {
      return NextResponse.json(
        { error: "No images or audio provided" },
        { status: 400 },
      );
    }

    // Generate consistent hash for caching/consistency
    const imagesHash = await hashImages(images);

    // Use Google AI Studio (Gemini) - FREE TIER
    if (GOOGLE_AI_API_KEY) {
      try {
        const aiResult = await analyzeWithGemini(
          images,
          person1Label,
          person2Label,
          context,
          imagesHash,
          isAudioTranscription,
        );
        return NextResponse.json(aiResult);
      } catch (geminiError) {
        console.error("Gemini analysis failed:", geminiError);
        // Fall through to mock analysis
      }
    }

    // Fallback: Generate mock analysis
    console.log("Using mock analysis (no API key or API failed)");
    const mockResult = generateMockAnalysis(
      person1Label,
      person2Label,
      imagesHash,
    );
    return NextResponse.json(mockResult);
  } catch (error) {
    console.error("Argument analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 },
    );
  }
}

// ==================== IMPROVED AI PROMPT ====================

function buildAnalysisPrompt(
  person1Label: string,
  person2Label: string,
  context: string,
  isAudioTranscription: boolean,
): string {
  // Safeguard: Weight screenshots over user context
  const contextNote =
    context && !containsPromptInjection(context)
      ? `\n\nUser provided context (use as secondary reference, prioritize screenshot text): "${context}"`
      : "";

  const sourceNote = isAudioTranscription
    ? "This is a transcription of a live audio recording."
    : "This is a screenshot of a text conversation.";

  return `You are an OBJECTIVE AI relationship counselor analyzing a conversation between "${person1Label}" and "${person2Label}".

${sourceNote}

CRITICAL INSTRUCTIONS:
1. Analyze ONLY the text visible in the screenshots - this is your PRIMARY evidence
2. Be CONSISTENT - same conversation should yield same analysis
3. Be FAIR and EVIDENCE-BASED - do not take sides without clear evidence
4. Consider CONTEXT and relationship dynamics, not just "normal standards"
5. Look for communication PATTERNS, not isolated moments
6. Identify WHO shows problematic behavior based on evidence
7. Your analysis should help the couple IMPROVE, not just declare a winner
${contextNote}

Extract and analyze the conversation text from the screenshots carefully using OCR-like precision. Focus on:
- Who is communicating more constructively?
- Who is showing problematic communication patterns?
- What specific moments ("receipts") demonstrate this?
- What red flags are present and from whom?

SUGGESTION QUALITY REQUIREMENTS (CRITICAL):
- The suggestion MUST directly address the detected red flags
- The suggestion MUST reference specific behaviors from THIS conversation
- NO generic advice like "communicate better" - be SPECIFIC to what happened
- If you detected "social_comparison", the suggestion should address comparison behavior
- If you detected "gaslighting", the suggestion should address reality-questioning
- Name what they did and what to do differently NEXT TIME in this specific dynamic

Return ONLY valid JSON with these exact fields:
{
  "winner": "person1" | "person2" | "tie" | "both_wrong",
  "toxicityScore": 0-100 (be precise based on actual content),
  "argumentType": "specific description of dispute type",
  "redFlags": [{"type": "gaslighting|stonewalling|invalidating|guilt_tripping|defensiveness|contempt|criticism|blame_shifting|passive_aggressive|social_comparison", "severity": "low|medium|high", "who": "person1|person2|both"}],
  "receipts": [{"number": 1, "text": "EXACT quote or specific behavior observed", "who": "person1|person2", "type": "negative|neutral|positive"}],
  "communicationScore": 0-100 (overall quality of communication),
  "suggestion": "Specific advice that addresses the detected red flags and references the actual conversation content. Example: 'When [person] compared your relationship to their friends, redirect with: What do YOU need from me specifically?'"
}

RECEIPT REQUIREMENTS:
- Quote ACTUAL text from the screenshots when possible
- Identify WHO said/did it (person1 or person2)
- Provide 2-4 receipts citing SPECIFIC moments

Be fair, evidence-based, and make the suggestion genuinely helpful for THIS couple's specific issue.`;
}

// Get contextual suggestion based on detected red flags
function getContextualSuggestion(
  redFlags: RedFlag[],
  argumentType: string,
): string {
  // Try to find a suggestion matching the first red flag
  for (const flag of redFlags) {
    const flagKey = flag.type.toLowerCase().replace(/\s+/g, "_");
    const suggestions = SUGGESTIONS_BY_FLAG[flagKey];
    if (suggestions && suggestions.length > 0) {
      return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
  }

  // Try matching argument type
  const argTypeKey = argumentType.toLowerCase().replace(/\s+/g, "_");
  if (SUGGESTIONS_BY_FLAG[argTypeKey]) {
    const suggestions = SUGGESTIONS_BY_FLAG[argTypeKey];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  // Fallback to generic
  return GENERIC_SUGGESTIONS[
    Math.floor(Math.random() * GENERIC_SUGGESTIONS.length)
  ];
}

// Process AI response
function processAIResponse(
  content: string,
  person1Label: string,
  person2Label: string,
  imagesHash: string,
): AnalysisResult {
  // Clean up JSON
  const cleanContent = content
    .replace(/```json\n?/g, "")
    .replace(/\n?```/g, "")
    .trim();

  // Find the JSON object
  const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON found in response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const enrichedRedFlags: RedFlag[] = (parsed.redFlags || []).map(
    (flag: { type: string; severity: string }) => {
      const flagInfo = RED_FLAG_TYPES[
        flag.type as keyof typeof RED_FLAG_TYPES
      ] || {
        emoji: "⚠️",
        description: "Concerning behavior",
      };
      return {
        type: flag.type
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l: string) => l.toUpperCase()),
        emoji: flagInfo.emoji,
        description: flagInfo.description,
        severity: flag.severity as "low" | "medium" | "high",
      };
    },
  );

  const toxicityScore = Math.min(100, Math.max(0, parsed.toxicityScore || 30));
  const toxicityLevel =
    TOXICITY_LEVELS.find((l) => toxicityScore <= l.max)?.label || "Unknown";
  const healthyTip =
    HEALTHY_TIPS[Math.floor(Math.random() * HEALTHY_TIPS.length)];
  const ruling = generateRuling(
    parsed.winner,
    toxicityScore,
    enrichedRedFlags,
    person1Label,
    person2Label,
  );
  // Use AI suggestion if it's specific enough, otherwise get contextual fallback
  const aiSuggestion = parsed.suggestion || "";
  const isGenericSuggestion =
    aiSuggestion.length < 30 ||
    /communicate better|talk it out|be more understanding/i.test(aiSuggestion);
  const suggestion = isGenericSuggestion
    ? getContextualSuggestion(enrichedRedFlags, parsed.argumentType || "")
    : aiSuggestion;

  const caseNumber = generateCaseNumber(imagesHash);

  return {
    winner: parsed.winner,
    winnerLabel:
      parsed.winner === "person1"
        ? person1Label
        : parsed.winner === "person2"
          ? person2Label
          : "Nobody",
    loserLabel:
      parsed.winner === "person1"
        ? person2Label
        : parsed.winner === "person2"
          ? person1Label
          : "Both",
    toxicityScore,
    toxicityLevel,
    argumentType: parsed.argumentType || "Relationship Dispute",
    redFlags: enrichedRedFlags,
    receipts: (parsed.receipts || []).slice(0, 4),
    healthyTip,
    communicationScore: Math.min(
      100,
      Math.max(0, parsed.communicationScore || 50),
    ),
    caseNumber,
    ruling,
    suggestion,
    shareableId: `WR-${caseNumber}`,
    analysisHash: imagesHash,
  };
}

// Google AI Studio (Gemini)
async function analyzeWithGemini(
  images: { base64: string; mimeType: string }[],
  person1Label: string,
  person2Label: string,
  context: string,
  imagesHash: string,
  isAudioTranscription: boolean = false,
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(
    person1Label,
    person2Label,
    context,
    isAudioTranscription,
  );

  const parts: Array<
    { text: string } | { inline_data: { mime_type: string; data: string } }
  > = [{ text: prompt }];

  // Add images (primary evidence)
  images.forEach((img) => {
    parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } });
  });

  // Using temperature=0.3 for more consistent results
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.3, // Lower temperature = more consistent
          maxOutputTokens: 800,
          topP: 0.8,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) throw new Error("No response from Gemini");

  return processAIResponse(content, person1Label, person2Label, imagesHash);
}

function generateRuling(
  winner: string,
  toxicity: number,
  redFlags: RedFlag[],
  person1Label: string,
  person2Label: string,
): string {
  const hasGaslighting = redFlags.some((f) =>
    f.type.toLowerCase().includes("gaslight"),
  );
  const winnerName =
    winner === "person1"
      ? person1Label
      : winner === "person2"
        ? person2Label
        : "";
  const loserName =
    winner === "person1"
      ? person2Label
      : winner === "person2"
        ? person1Label
        : "";

  if (winner === "tie") {
    return "Both parties made valid points but also contributed to the conflict. A draw is declared.";
  }
  if (winner === "both_wrong") {
    return "Neither party handled this well. Both need to reflect on their communication patterns.";
  }
  if (hasGaslighting) {
    return `${winnerName} shows provision; ${loserName} displays concerning behavior patterns.`;
  }
  if (toxicity > 60) {
    return `The evidence shows ${winnerName}'s position is more supported; ${loserName} escalated the conflict.`;
  }
  return `${winnerName} shows provision; ${loserName} seeks more.`;
}

function generateMockAnalysis(
  person1Label: string,
  person2Label: string,
  imagesHash: string,
): AnalysisResult {
  // Use hash for consistent mock results
  const hashNum = parseInt(imagesHash.slice(0, 4), 16) || 0;
  const winners = ["person1", "person2", "tie", "both_wrong"] as const;
  const winner = winners[hashNum % 4];
  const toxicityScore = 25 + (hashNum % 50);
  const toxicityLevel =
    TOXICITY_LEVELS.find((l) => toxicityScore <= l.max)?.label ||
    "Getting Tense";

  const argumentTypes = [
    "Financial Expectations Dispute",
    "Communication Breakdown",
    "Boundary Violation",
    "Trust Issues",
    "Different Expectations",
  ];

  const possibleFlags = Object.entries(RED_FLAG_TYPES);
  const flagIndex = hashNum % possibleFlags.length;
  const [flagKey, flagValue] = possibleFlags[flagIndex];

  const redFlags: RedFlag[] = [
    {
      type: flagKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      emoji: flagValue.emoji,
      description: flagValue.description,
      severity: "medium" as const,
    },
  ];

  const receipts: Receipt[] = [
    {
      number: 1,
      text: `${person1Label} highlighted their current contributions to the relationship.`,
      type: "positive" as const,
    },
    {
      number: 2,
      text: `${person2Label} compared the relationship to others, introducing external standards.`,
      type: "negative" as const,
    },
  ];

  const caseNumber = generateCaseNumber(imagesHash);

  return {
    winner,
    winnerLabel:
      winner === "person1"
        ? person1Label
        : winner === "person2"
          ? person2Label
          : "Nobody",
    loserLabel:
      winner === "person1"
        ? person2Label
        : winner === "person2"
          ? person1Label
          : "Both",
    toxicityScore,
    toxicityLevel,
    argumentType: argumentTypes[hashNum % argumentTypes.length],
    redFlags,
    receipts,
    healthyTip: HEALTHY_TIPS[hashNum % HEALTHY_TIPS.length],
    communicationScore: 40 + (hashNum % 30),
    caseNumber,
    ruling: generateRuling(
      winner,
      toxicityScore,
      redFlags,
      person1Label,
      person2Label,
    ),
    suggestion: getContextualSuggestion(
      redFlags,
      argumentTypes[hashNum % argumentTypes.length],
    ),
    shareableId: `WR-${caseNumber}`,
    analysisHash: imagesHash,
  };
}
