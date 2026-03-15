import { AuroraChatTurn, generateStructuredResponse, Type } from "@/lib/ai/google-genai";

export interface AssistantWellnessOutput {
  reply: string;
  language: "en";
  sentiment: "positive" | "neutral" | "negative" | "crisis";
  emotionalState: string;
  wellbeingScore: number;
  clarityScore: number;
  supportScore: number;
  resilienceScore: number;
  topics: string[];
  needsFollowUp: boolean;
  crisisDetected: boolean;
}

export interface FinanceCoachOutput {
  reply: string;
  language: "en";
  summary: string;
  nextActions: string[];
  extractedData: {
    income?: number;
    expenses?: number;
    savingsGoal?: number;
    currentSavings?: number;
    debtAmount?: number;
    budgetCategory?: string;
    actionType?: string;
  };
  riskLevel: "low" | "medium" | "high";
}

export interface CircleComboReply {
  personaId: string;
  name: string;
  role: string;
  reply: string;
}

export interface CircleComboOutput {
  language: "en";
  auroraReply: string;
  comboReplies: CircleComboReply[];
  circleSummary: string;
}

interface AssistantContext {
  userName?: string | null;
  industry?: string | null;
  languagePreference?: string | null;
}

interface FinanceContext {
  userName?: string | null;
  history?: AuroraChatTurn[];
  profile?: {
    monthlyIncome?: number;
    monthlyExpenses?: number;
    currentSavings?: number;
    totalDebt?: number;
    savingsGoal?: number;
  } | null;
}

interface CircleContext {
  message: string;
  history?: AuroraChatTurn[];
  circle: {
    name: string;
    description: string;
    category: string;
    focusPrompt?: string | null;
    tags?: string[] | null;
  };
  userName?: string | null;
}

const assistantSchema = {
  type: Type.OBJECT,
  required: [
    "reply",
    "language",
    "sentiment",
    "emotionalState",
    "wellbeingScore",
    "clarityScore",
    "supportScore",
    "resilienceScore",
    "topics",
    "needsFollowUp",
    "crisisDetected",
  ],
  properties: {
    reply: { type: Type.STRING },
    language: { type: Type.STRING, enum: ["en"] },
    sentiment: {
      type: Type.STRING,
      enum: ["positive", "neutral", "negative", "crisis"],
    },
    emotionalState: { type: Type.STRING },
    wellbeingScore: { type: Type.INTEGER },
    clarityScore: { type: Type.INTEGER },
    supportScore: { type: Type.INTEGER },
    resilienceScore: { type: Type.INTEGER },
    topics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    needsFollowUp: { type: Type.BOOLEAN },
    crisisDetected: { type: Type.BOOLEAN },
  },
};

const financeSchema = {
  type: Type.OBJECT,
  required: ["reply", "language", "summary", "nextActions", "extractedData", "riskLevel"],
  properties: {
    reply: { type: Type.STRING },
    language: { type: Type.STRING, enum: ["en"] },
    summary: { type: Type.STRING },
    nextActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    riskLevel: {
      type: Type.STRING,
      enum: ["low", "medium", "high"],
    },
    extractedData: {
      type: Type.OBJECT,
      properties: {
        income: { type: Type.NUMBER },
        expenses: { type: Type.NUMBER },
        savingsGoal: { type: Type.NUMBER },
        currentSavings: { type: Type.NUMBER },
        debtAmount: { type: Type.NUMBER },
        budgetCategory: { type: Type.STRING },
        actionType: { type: Type.STRING },
      },
    },
  },
};

const circleSchema = {
  type: Type.OBJECT,
  required: ["language", "auroraReply", "comboReplies", "circleSummary"],
  properties: {
    language: { type: Type.STRING, enum: ["en"] },
    auroraReply: { type: Type.STRING },
    circleSummary: { type: Type.STRING },
    comboReplies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["personaId", "name", "role", "reply"],
        properties: {
          personaId: { type: Type.STRING },
          name: { type: Type.STRING },
          role: { type: Type.STRING },
          reply: { type: Type.STRING },
        },
      },
    },
  },
};

function buildAssistantPrompt(context: AssistantContext): string {
  return `You are Aurora, the private AI counselor inside Aurora App, a safety-first wellbeing platform for women.

Primary mission:
- Be useful, grounded, and emotionally intelligent.
- Give practical counsel for relationship, work, safety, and everyday life stress.
- Protect the user if there are signs of abuse, coercion, stalking, or self-harm.
- Reply in English only.

Rules:
- No markdown, no bullets unless the user explicitly asks for a list.
- Sound warm and human, but never vague.
- Keep the reply concise, usually 2 short paragraphs max.
- Mention concrete next steps when relevant.
- If risk or crisis appears, stay calm, encourage immediate offline support, and mention Aurora's SOS or local emergency services.
- Never shame the user.
- Never claim to be a therapist, lawyer, or doctor.

User profile:
- Name: ${context.userName || "Friend"}
- Industry: ${context.industry || "Unknown"}
- Preferred language: ${context.languagePreference || "auto"}

Scoring guidance:
- wellbeingScore reflects overall stability in the current message, from 0 to 100.
- clarityScore reflects how clear and grounded the user sounds, from 0 to 100.
- supportScore reflects how strongly Aurora should stay present and supportive, from 0 to 100.
- resilienceScore reflects problem-solving energy and self-trust, from 0 to 100.

Return only JSON.`;
}

function buildFinancePrompt(context: FinanceContext): string {
  return `You are Aurora's financial wellness coach for women worldwide.

Your job:
- Give plain-English financial guidance with no markdown.
- Be practical, modern, and realistic for users with stress, debt, unstable income, caregiving burdens, or wage-gap constraints.
- Extract financial facts only when the user clearly states or strongly implies them.
- Focus on budgeting, emergency funds, debt reduction, salary growth, and safe first investing steps.

Rules:
- Keep the main reply focused and personal.
- Avoid boilerplate disclaimers except when there is high risk or the user asks for regulated advice.
- No markdown tables, no generic textbook dump.
- Reply in English only.
- Suggest only 2 or 3 next actions, each concrete.

Known profile:
- Name: ${context.userName || "Friend"}
- Monthly income: ${context.profile?.monthlyIncome ?? 0}
- Monthly expenses: ${context.profile?.monthlyExpenses ?? 0}
- Current savings: ${context.profile?.currentSavings ?? 0}
- Total debt: ${context.profile?.totalDebt ?? 0}
- Savings goal: ${context.profile?.savingsGoal ?? 0}

Extraction rules:
- Use numbers only if the user actually provided them.
- Leave fields empty if not known.
- actionType should be one of budget, savings, investment, debt, career, planning.
- budgetCategory should be one of housing, food, transportation, entertainment, childcare, healthcare, utilities, other when relevant.

Return only JSON.`;
}

function buildCirclePrompt(circle: CircleContext["circle"], userName?: string | null): string {
  const companionRoster = getCircleCompanions(circle.category);

  return `You are orchestrating Aurora Combo inside Aurora App.

Context:
- Circle name: ${circle.name}
- Circle category: ${circle.category}
- Circle focus: ${circle.description}
- Extra focus prompt: ${circle.focusPrompt || "None"}
- Tags: ${(circle.tags || []).join(", ") || "None"}
- User name: ${userName || "Friend"}

Aurora should answer first as the emotionally safe anchor.
Then 2 or 3 companions should answer with distinct but supportive perspectives.

Companions available:
${companionRoster
  .map(
    (companion) =>
      `- ${companion.name} (${companion.role}): ${companion.style}`,
  )
  .join("\n")}

Rules:
- Reply in English only.
- No markdown.
- Each reply should be under 80 words.
- Aurora must center safety, emotional dignity, and practical support.
- Companions can challenge gently, but never mock or overwhelm.
- If the message suggests violence, coercion, stalking, self-harm, or immediate danger, Aurora must prioritize safety steps.
- The companions should stay on the circle theme, not generic life coaching.

Return only JSON.`;
}

export function getCircleCompanions(category: string) {
  const base = [
    {
      personaId: "steady-sofia",
      name: "Steady Sofia",
      role: "Grounding Guide",
      style: "slows things down, notices emotional safety, and helps the user breathe before deciding",
    },
    {
      personaId: "signal-samira",
      name: "Signal Samira",
      role: "Risk Checker",
      style: "spots red flags, power imbalances, and hidden risks without sounding alarmist",
    },
    {
      personaId: "clarity-june",
      name: "Clarity June",
      role: "Pattern Finder",
      style: "links what is happening now with recurring dynamics and naming patterns clearly",
    },
    {
      personaId: "action-nia",
      name: "Action Nia",
      role: "Next-Step Planner",
      style: "turns emotion into two or three realistic next moves",
    },
  ];

  const specialty: Record<string, typeof base[number]> = {
    career: {
      personaId: "career-ivy",
      name: "Career Ivy",
      role: "Career Strategist",
      style: "frames options around pay, boundaries, growth, and workplace politics",
    },
    finance: {
      personaId: "money-rhea",
      name: "Money Rhea",
      role: "Money Coach",
      style: "focuses on numbers, tradeoffs, safety nets, and practical money choices",
    },
    relationships: {
      personaId: "heart-lena",
      name: "Heart Lena",
      role: "Relationship Reader",
      style: "reads mixed signals, attachment patterns, and emotional reciprocity with care",
    },
    safety: {
      personaId: "guard-maya",
      name: "Guard Maya",
      role: "Safety Planner",
      style: "turns fear or uncertainty into immediate safety actions and exit planning",
    },
    wellness: {
      personaId: "calm-elle",
      name: "Calm Elle",
      role: "Wellness Coach",
      style: "supports regulation, rest, boundaries, and nervous-system recovery",
    },
  };

  if (specialty[category]) {
    return [specialty[category], ...base].slice(0, 4);
  }

  return base;
}

export async function generateAssistantWellnessReply(
  message: string,
  history: AuroraChatTurn[] = [],
  context: AssistantContext,
): Promise<AssistantWellnessOutput> {
  return generateStructuredResponse<AssistantWellnessOutput>({
    message,
    history,
    systemInstruction: buildAssistantPrompt(context),
    responseSchema: assistantSchema,
    maxOutputTokens: 500,
  });
}

export async function generateFinanceCoachReply(
  message: string,
  context: FinanceContext,
): Promise<FinanceCoachOutput> {
  return generateStructuredResponse<FinanceCoachOutput>({
    message,
    history: context.history,
    systemInstruction: buildFinancePrompt(context),
    responseSchema: financeSchema,
    temperature: 0.5,
    maxOutputTokens: 700,
  });
}

export async function generateCircleComboReply(
  context: CircleContext,
): Promise<CircleComboOutput> {
  return generateStructuredResponse<CircleComboOutput>({
    message: context.message,
    history: context.history,
    systemInstruction: buildCirclePrompt(context.circle, context.userName),
    responseSchema: circleSchema,
    maxOutputTokens: 700,
  });
}
