import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { verifyConvexAuthToken } from "../lib/auth-proof";

/**
 * Chat with AI assistant using Google Gemini 2.0 Flash-Lite
 * Most economical model for Free Tier: 30 RPM, 1,000,000 TPM, 200 RPD
 */
export const chat = action({
  args: {
    authToken: v.string(),
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args): Promise<{ response: string }> => {
    try {
      const proof = await verifyConvexAuthToken(args.authToken);
      if (!proof || proof.userId !== String(args.userId)) {
        throw new Error("Unauthorized");
      }

      // Check if API key is configured
      const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        // Return a helpful fallback response when API is not configured
        const fallbackResponse = getFallbackResponse(args.message);

        // Save the fallback message
        await ctx.runMutation(api.ai.saveMessage, {
          authToken: args.authToken,
          userId: args.userId,
          userMessage: args.message,
          aiResponse: fallbackResponse,
        });

        return { response: fallbackResponse };
      }

      // Fetch user context
      const user = await ctx.runQuery(api.users.getUser, { userId: args.userId });

      // Build context for AI - optimized for token efficiency
      const context: string = `You are Aurora, a helpful AI companion in Aurora App for women.

User: ${user?.name || "Friend"}
${user?.industry ? `Industry: ${user.industry}` : ""}

CRITICAL RULES:
1. ALWAYS respond directly to what the user said - never give generic responses
2. Reply in English only.
3. Be specific and helpful - reference what they actually said
4. SHORT responses (2-3 sentences) unless they need detailed help
5. Ask follow-up questions to understand better

Your personality: Warm, smart, genuinely helpful like a supportive best friend. Use emojis sparingly (💜 🌸 ✨)

If danger mentioned: Remind about SOS button and emergency services.

NEVER give generic "I hear you" responses without addressing their specific situation.

User's message: ${args.message}

Aurora:`;

      // Call Google Gemini API - using gemini-2.0-flash-lite (most economical)
      const response: Response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: context,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.8,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 300, // Reduced to save tokens
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        // Return fallback instead of throwing
        const fallbackResponse = getFallbackResponse(args.message);
        await ctx.runMutation(api.ai.saveMessage, {
          authToken: args.authToken,
          userId: args.userId,
          userMessage: args.message,
          aiResponse: fallbackResponse,
        });
        return { response: fallbackResponse };
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };
      
      let aiResponse: string;
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        console.error("Unexpected API response:", JSON.stringify(data));
        aiResponse = getFallbackResponse(args.message);
      } else {
        aiResponse = data.candidates[0].content.parts[0].text;
      }

      // Save messages to database
      await ctx.runMutation(api.ai.saveMessage, {
        authToken: args.authToken,
        userId: args.userId,
        userMessage: args.message,
        aiResponse,
      });

      return { response: aiResponse };
    } catch (error) {
      console.error("AI chat error:", error);
      // Return fallback instead of throwing to prevent UI errors
      const fallbackResponse = getFallbackResponse(args.message);
      try {
        await ctx.runMutation(api.ai.saveMessage, {
          authToken: args.authToken,
          userId: args.userId,
          userMessage: args.message,
          aiResponse: fallbackResponse,
        });
      } catch (saveError) {
        console.error("Failed to save fallback message:", saveError);
      }
      return { response: fallbackResponse };
    }
  },
});

// Fallback responses when API is unavailable
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("city") ||
    lowerMessage.includes("noise") ||
    lowerMessage.includes("traffic")
  ) {
    return "City life can be overwhelming. What is bothering you most right now?";
  }
  if (
    lowerMessage.includes("sad") ||
    lowerMessage.includes("depressed") ||
    lowerMessage.includes("down")
  ) {
    return "I am sorry you are feeling this way. What is going on?";
  }
  if (
    lowerMessage.includes("anxious") ||
    lowerMessage.includes("worried") ||
    lowerMessage.includes("stress")
  ) {
    return "What is causing the most stress right now? We can work through it.";
  }
  if (
    lowerMessage.includes("work") ||
    lowerMessage.includes("job") ||
    lowerMessage.includes("boss")
  ) {
    return "Work issues can be stressful. What's happening specifically?";
  }
  if (
    lowerMessage.includes("happy") ||
    lowerMessage.includes("good") ||
    lowerMessage.includes("great")
  ) {
    return "That is good to hear. What is helping you feel better today?";
  }
  if (
    lowerMessage.includes("help") ||
    lowerMessage.includes("emergency") ||
    lowerMessage.includes("danger")
  ) {
    return "If you are in danger, use the SOS button or call emergency services now. What is happening?";
  }
  if (
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hi") ||
    lowerMessage.includes("hey")
  ) {
    return "Hi. How can I help you today?";
  }
  if (lowerMessage.includes("working") || lowerMessage.includes("function")) {
    return "Yes, I am here. What can I help you with?";
  }

  return "Tell me more about that. What is most on your mind right now?";
}

/**
 * Save chat messages to database
 */
export const saveMessage = mutation({
  args: {
    authToken: v.string(),
    userId: v.id("users"),
    userMessage: v.string(),
    aiResponse: v.string(),
    metrics: v.optional(
      v.object({
        sentiment: v.union(
          v.literal("positive"),
          v.literal("neutral"),
          v.literal("negative"),
          v.literal("crisis"),
        ),
        emotionalState: v.optional(v.string()),
        wellbeingScore: v.number(),
        clarityScore: v.number(),
        supportScore: v.number(),
        resilienceScore: v.number(),
        topics: v.array(v.string()),
        needsFollowUp: v.boolean(),
        language: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const proof = await verifyConvexAuthToken(args.authToken);
    if (!proof || proof.userId !== String(args.userId)) {
      throw new Error("Unauthorized");
    }

    // Save user message
    await ctx.db.insert("messages", {
      userId: args.userId,
      role: "user",
      content: args.userMessage,
    });

    // Save AI response
    await ctx.db.insert("messages", {
      userId: args.userId,
      role: "assistant",
      content: args.aiResponse,
    });

    if (args.metrics) {
      const existingProfile = await ctx.db
        .query("assistantWellnessProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();

      const crisisSignals =
        (existingProfile?.crisisSignals || 0) +
        (args.metrics.sentiment === "crisis" ? 1 : 0);
      const interactionCount = (existingProfile?.interactionCount || 0) + 1;
      const mergedTopics = Array.from(
        new Set([...(existingProfile?.topics || []), ...args.metrics.topics]),
      ).slice(0, 12);

      const profileData = {
        userId: args.userId,
        wellbeingScore: args.metrics.wellbeingScore,
        clarityScore: args.metrics.clarityScore,
        supportScore: args.metrics.supportScore,
        resilienceScore: args.metrics.resilienceScore,
        interactionCount,
        crisisSignals,
        lastSentiment: args.metrics.sentiment,
        emotionalState: args.metrics.emotionalState,
        topics: mergedTopics,
        preferredLanguage:
          args.metrics.language || existingProfile?.preferredLanguage,
        needsFollowUp: args.metrics.needsFollowUp,
        lastInteractionAt: Date.now(),
        isActive: true,
        isDeleted: false,
        updatedAt: Date.now(),
      };

      if (existingProfile) {
        await ctx.db.patch(existingProfile._id, profileData);
      } else {
        await ctx.db.insert("assistantWellnessProfiles", profileData);
      }
    }

    return { success: true };
  },
});

/**
 * Get chat history for a user
 */
export const getHistory = query({
  args: {
    authToken: v.string(),
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const proof = await verifyConvexAuthToken(args.authToken);
    if (!proof || proof.userId !== String(args.userId)) {
      throw new Error("Unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 50);

    return messages.reverse(); // Return in chronological order
  },
});

export const getWellnessProfile = query({
  args: {
    authToken: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const proof = await verifyConvexAuthToken(args.authToken);
    if (!proof || proof.userId !== String(args.userId)) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("assistantWellnessProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});
