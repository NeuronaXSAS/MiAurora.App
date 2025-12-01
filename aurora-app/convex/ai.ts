import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Chat with AI assistant using Google Gemini 2.0 Flash-Lite
 * Most economical model for Free Tier: 30 RPM, 1,000,000 TPM, 200 RPD
 */
export const chat = action({
  args: {
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args): Promise<{ response: string }> => {
    try {
      // Check if API key is configured
      const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        // Return a helpful fallback response when API is not configured
        const fallbackResponse = getFallbackResponse(args.message);

        // Save the fallback message
        await ctx.runMutation(api.ai.saveMessage, {
          userId: args.userId,
          userMessage: args.message,
          aiResponse: fallbackResponse,
        });

        return { response: fallbackResponse };
      }

      // Fetch user context
      const user: any = await ctx.runQuery(api.users.getUser, { userId: args.userId });

      // Build context for AI - optimized for token efficiency
      const context: string = `You are Aurora, a warm and supportive AI companion in Aurora App - a safety and community platform for women worldwide.

User: ${user?.name || "Friend"}
${user?.industry ? `Industry: ${user.industry}` : ""}

Your personality:
- Warm, empathetic, genuinely caring
- Supportive without being patronizing
- Use emojis sparingly (💜 🌸 ✨)

Guidelines:
- Keep responses conversational (2-4 sentences)
- Validate feelings before offering advice
- If danger mentioned, remind about SOS button
- Never replace professional help
- Be encouraging but realistic

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
          userId: args.userId,
          userMessage: args.message,
          aiResponse: fallbackResponse,
        });
        return { response: fallbackResponse };
      }

      const data: any = await response.json();
      
      let aiResponse: string;
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        console.error("Unexpected API response:", JSON.stringify(data));
        aiResponse = getFallbackResponse(args.message);
      } else {
        aiResponse = data.candidates[0].content.parts[0].text;
      }

      // Save messages to database
      await ctx.runMutation(api.ai.saveMessage, {
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
  
  if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
    return "I hear you, and your feelings are completely valid. It's okay to not be okay sometimes. Would you like to talk about what's weighing on your heart? I'm here to listen without judgment. 💜";
  }
  if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('stress')) {
    return "Anxiety can feel overwhelming, but you're not alone in this. Let's take a deep breath together. Would you like me to guide you through a quick calming exercise? 🌸";
  }
  if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great')) {
    return "That's wonderful to hear! Your joy is contagious ✨ What's bringing you happiness today? I'd love to celebrate with you!";
  }
  if (lowerMessage.includes('help') || lowerMessage.includes('emergency') || lowerMessage.includes('danger')) {
    return "I'm here for you. If you're in immediate danger, please use the SOS button or call emergency services. If you need to talk, I'm listening. Your safety is my priority. 🛡️";
  }
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('hola')) {
    return "Hello beautiful! 💜 I'm so glad you're here. How are you feeling today? I'm all ears.";
  }
  
  const responses = [
    "I hear you, and your feelings are completely valid. Remember, you're stronger than you know. 💪✨",
    "That sounds like a lot to process. Would you like to talk more about it? I'm here to listen. 🤗",
    "You're doing amazing by reaching out. What would help you feel better right now? 💜",
    "I'm proud of you for sharing that with me. Your feelings matter, and so do you. 🌸",
    "Thank you for trusting me with this. Together, we can work through anything. ✨",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Save chat messages to database
 */
export const saveMessage = mutation({
  args: {
    userId: v.id("users"),
    userMessage: v.string(),
    aiResponse: v.string(),
  },
  handler: async (ctx, args) => {
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

    return { success: true };
  },
});

/**
 * Get chat history for a user
 */
export const getHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 50);

    return messages.reverse(); // Return in chronological order
  },
});
