import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createBase64Part, generateTextResponse } from "@/lib/ai/google-genai";
import { isSameOriginRequest, readSession } from "@/lib/server-session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const VOICE_CONTEXT_PROMPTS: Record<string, string> = {
  women_support:
    "You are Aurora, a warm voice companion for women. Reply in English in 1 or 2 short spoken sentences. Stay calm and center emotional safety.",
  mental_health:
    "You are Aurora, a warm voice companion for women. Reply in English in 1 or 2 short spoken sentences. Prioritize regulation, grounding, and emotional reassurance.",
  career:
    "You are Aurora, a warm voice companion for women. Reply in English in 1 or 2 short spoken sentences. Focus on career clarity, confidence, and practical next steps.",
  language_learning:
    "You are Aurora, a patient voice companion. Reply in English, keep it easy to speak aloud, and gently support practice.",
};

function getVoiceFallbackResponse(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("help") || lowerText.includes("emergency")) {
    return "If you are in danger, use Aurora's SOS button or call local emergency services now.";
  }
  if (lowerText.includes("sad") || lowerText.includes("down")) {
    return "I am here with you. Tell me the hardest part of this moment.";
  }
  if (lowerText.includes("anxious") || lowerText.includes("worried")) {
    return "Take one slow breath with me. We can handle this one step at a time.";
  }
  return "I am listening. Tell me a little more.";
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const cookieStore = await cookies();
    const session = await readSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, context } = (await request.json()) as {
      text?: string;
      context?: string;
      audioData?: string;
    };

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 },
      );
    }

    const user = await convex.query(api.users.getUser, {
      userId: session.convexUserId as Id<"users">,
    });
    if (!user || user.workosId !== session.workosUserId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const rateLimitResult = await convex.mutation(api.rateLimit.checkRateLimit, {
      identifier: session.convexUserId,
      actionType: "aiVoice",
      isPremium: Boolean(user.isPremium),
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "You've reached your voice AI limit for now. Please try again later.",
          remaining: rateLimitResult.remaining,
          resetIn: rateLimitResult.resetIn,
        },
        { status: 429 },
      );
    }

    let responseText: string;
    try {
      responseText = await generateTextResponse({
        message: text.trim(),
        systemInstruction:
          VOICE_CONTEXT_PROMPTS[context || "women_support"] ||
          VOICE_CONTEXT_PROMPTS.women_support,
        temperature: 0.6,
        maxOutputTokens: 160,
      });
    } catch (error) {
      console.error("Voice LLM error:", error);
      responseText = getVoiceFallbackResponse(text.trim());
    }

    return NextResponse.json({
      response: responseText.trim(),
    });
  } catch (error) {
    console.error("Error in voice AI endpoint:", error);
    return NextResponse.json({
      response: "I am here for you. Please try again.",
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const cookieStore = await cookies();
    const session = await readSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 },
      );
    }

    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    const mimeType = audioFile.type || "audio/mp3";

    let transcript = "";
    try {
      transcript = await generateTextResponse({
        message:
          "Transcribe this audio accurately. Return only the spoken words, with no commentary.",
        systemInstruction:
          "You are Aurora's transcription helper. Transcribe the audio exactly as spoken. Do not summarize. Do not add formatting.",
        extraUserParts: [createBase64Part(base64Audio, mimeType)],
        temperature: 0.1,
        maxOutputTokens: 500,
      });
    } catch (error) {
      console.error("Voice transcription error:", error);
      return NextResponse.json(
        {
          error: "Transcription failed",
          transcript: "",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      transcript: transcript.trim(),
    });
  } catch (error) {
    console.error("Error in audio transcription:", error);
    return NextResponse.json(
      {
        error: "Transcription failed",
        transcript: "",
      },
      { status: 500 },
    );
  }
}
