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
      const context: string = `You are Aurora, a helpful AI companion in Aurora App for women.

User: ${user?.name || "Friend"}
${user?.industry ? `Industry: ${user.industry}` : ""}

CRITICAL RULES:
1. ALWAYS respond directly to what the user said - never give generic responses
2. If user speaks Spanish, respond in Spanish. If English, respond in English.
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
  
  // Spanish detection
  const spanishWords = ['hola', 'como', 'estás', 'qué', 'bien', 'mal', 'ayuda', 'necesito', 'tengo', 'siento', 'trabajo', 'ciudad', 'ruido', 'densa', 'funcionando'];
  const isSpanish = spanishWords.some(word => lowerMessage.includes(word));
  
  if (isSpanish) {
    if (lowerMessage.includes('ciudad') || lowerMessage.includes('ruido') || lowerMessage.includes('densa')) {
      return "Entiendo, vivir en una ciudad ruidosa puede ser agotador. ¿Qué es lo que más te afecta? Cuéntame más 💜";
    }
    if (lowerMessage.includes('triste') || lowerMessage.includes('mal') || lowerMessage.includes('deprimida')) {
      return "Lamento que te sientas así. ¿Qué está pasando? Cuéntame más 💜";
    }
    if (lowerMessage.includes('trabajo') || lowerMessage.includes('jefe')) {
      return "Los temas de trabajo pueden ser estresantes. ¿Qué está pasando específicamente?";
    }
    if (lowerMessage.includes('hola') || lowerMessage.includes('hey')) {
      return "¡Hola! 💜 ¿Cómo te puedo ayudar hoy?";
    }
    if (lowerMessage.includes('funcionando') || lowerMessage.includes('funciona')) {
      return "¡Sí, estoy funcionando! 😊 Soy Aurora. ¿En qué te puedo ayudar?";
    }
    return "Cuéntame más sobre eso. ¿Qué está pasando específicamente? 💜";
  }
  
  // English responses
  if (lowerMessage.includes('city') || lowerMessage.includes('noise') || lowerMessage.includes('traffic')) {
    return "City life can be overwhelming. What's bothering you most? Tell me more 💜";
  }
  if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
    return "I'm sorry you're feeling this way. What's going on? Tell me more 💜";
  }
  if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('stress')) {
    return "What specifically is causing you stress? Let's talk through it 🌸";
  }
  if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('boss')) {
    return "Work issues can be stressful. What's happening specifically?";
  }
  if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great')) {
    return "That's great! What's making you feel good today? ✨";
  }
  if (lowerMessage.includes('help') || lowerMessage.includes('emergency') || lowerMessage.includes('danger')) {
    return "If you're in danger, use the SOS button or call emergency services. What's happening? 🛡️";
  }
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('hola')) {
    return "Hey! 💜 How can I help you today?";
  }
  if (lowerMessage.includes('working') || lowerMessage.includes('function')) {
    return "Yes, I'm working! 😊 I'm Aurora. What can I help you with?";
  }
  
  return "Tell me more about that. What's specifically on your mind? 💜";
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
