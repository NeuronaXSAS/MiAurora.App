import { GoogleGenAI, Type } from "@google/genai";

export type AuroraChatRole = "user" | "assistant";

export interface AuroraChatTurn {
  role: AuroraChatRole;
  content: string;
}

interface StructuredGenerationOptions {
  message: string;
  history?: AuroraChatTurn[];
  systemInstruction: string;
  responseSchema: object;
  temperature?: number;
  maxOutputTokens?: number;
}

const MODEL_NAME = "gemini-2.5-flash-lite";

let cachedClient: GoogleGenAI | null = null;

export { Type };

function getApiKey(): string {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("Google AI API key is not configured");
  }

  return apiKey;
}

function getClient(): GoogleGenAI {
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey: getApiKey(),
      apiVersion: "v1beta",
    });
  }

  return cachedClient;
}

function normalizeHistory(history: AuroraChatTurn[] = [], message: string) {
  const trimmedHistory = history
    .filter((turn) => turn.content.trim().length > 0)
    .slice(-10)
    .map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content.trim() }],
    }));

  return [
    ...trimmedHistory,
    {
      role: "user",
      parts: [{ text: message.trim() }],
    },
  ];
}

function parseStructuredResponse<T>(rawText: string): T {
  const cleaned = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  return JSON.parse(cleaned) as T;
}

export async function generateStructuredResponse<T>({
  message,
  history,
  systemInstruction,
  responseSchema,
  temperature = 0.7,
  maxOutputTokens = 700,
}: StructuredGenerationOptions): Promise<T> {
  const response = await getClient().models.generateContent({
    model: MODEL_NAME,
    contents: normalizeHistory(history, message),
    config: {
      systemInstruction,
      temperature,
      topP: 0.9,
      maxOutputTokens,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return parseStructuredResponse<T>(text);
}
