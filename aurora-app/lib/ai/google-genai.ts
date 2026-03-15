import { createPartFromBase64, GoogleGenAI, Part, Type } from "@google/genai";

export type AuroraChatRole = "user" | "assistant";

export interface AuroraChatTurn {
  role: AuroraChatRole;
  content: string;
}

type AuroraPart = { text: string } | Part;

interface StructuredGenerationOptions {
  message: string;
  history?: AuroraChatTurn[];
  systemInstruction: string;
  extraUserParts?: Part[];
  responseSchema: object;
  temperature?: number;
  maxOutputTokens?: number;
}

interface TextGenerationOptions {
  message: string;
  history?: AuroraChatTurn[];
  systemInstruction: string;
  extraUserParts?: Part[];
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
  const trimmedHistory: Array<{
    role: "user" | "model";
    parts: AuroraPart[];
  }> = history
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
      parts: [{ text: message.trim() }] as AuroraPart[],
    },
  ];
}

function buildContents(
  history: AuroraChatTurn[] = [],
  message: string,
  extraUserParts: Part[] = [],
) {
  const contents = normalizeHistory(history, message);
  const lastContent = contents[contents.length - 1];
  lastContent.parts = [...lastContent.parts, ...extraUserParts];
  return contents;
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
  extraUserParts = [],
  responseSchema,
  temperature = 0.7,
  maxOutputTokens = 700,
}: StructuredGenerationOptions): Promise<T> {
  const response = await getClient().models.generateContent({
    model: MODEL_NAME,
    contents: buildContents(history, message, extraUserParts),
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

export async function generateTextResponse({
  message,
  history,
  systemInstruction,
  extraUserParts = [],
  temperature = 0.7,
  maxOutputTokens = 500,
}: TextGenerationOptions): Promise<string> {
  const response = await getClient().models.generateContent({
    model: MODEL_NAME,
    contents: buildContents(history, message, extraUserParts),
    config: {
      systemInstruction,
      temperature,
      topP: 0.9,
      maxOutputTokens,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

export function createBase64Part(data: string, mimeType: string) {
  return createPartFromBase64(data, mimeType);
}
