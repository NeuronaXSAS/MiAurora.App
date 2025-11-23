import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Chat with AI assistant using Google Gemini
 */
export const chat = action({
  args: {
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args): Promise<{ response: string }> => {
    try {
      // Check if API key is configured
      if (!process.env.GOOGLE_AI_API_KEY) {
        throw new Error("Google AI API key is not configured. Please add GOOGLE_AI_API_KEY to your environment variables.");
      }

      // Fetch user context
      const user: any = await ctx.runQuery(api.users.getUser, { userId: args.userId });
      const userStats: any = await ctx.runQuery(api.users.getUserStats, { userId: args.userId });
      const recentPosts: any = await ctx.runQuery(api.posts.getUserRecent, { 
        userId: args.userId, 
        limit: 5 
      });

      // Build context for AI
      const context: string = `You are Aurora, an AI assistant for Aurora App - a platform helping women navigate life safely and advance their careers.

User Profile:
- Name: ${user?.name || "User"}
- Industry: ${user?.industry || "Not specified"}
- Location: ${user?.location || "Not specified"}
- Career Goals: ${user?.careerGoals || "Not specified"}
- Credits: ${user?.credits || 0}
- Trust Score: ${user?.trustScore || 0}

User Activity:
- Total Posts: ${userStats?.totalPosts || 0}
- Total Verifications: ${userStats?.totalVerifications || 0}
- Women Helped: ${userStats?.womenHelped || 0}
- Recent Posts: ${recentPosts?.length || 0}

Your role:
- Provide personalized career advice based on their profile
- Offer safety recommendations for workplaces and locations
- Help them navigate opportunities on the platform
- Encourage them to contribute and earn credits
- Be supportive, empowering, and specific

User's message: ${args.message}`;

      // Call Google Gemini API
      const response: Response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
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
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        console.error("Unexpected API response:", JSON.stringify(data));
        throw new Error("Invalid response from AI service");
      }
      
      const aiResponse: string = data.candidates[0].content.parts[0].text;

      // Save messages to database
      await ctx.runMutation(api.ai.saveMessage, {
        userId: args.userId,
        userMessage: args.message,
        aiResponse,
      });

      return { response: aiResponse };
    } catch (error) {
      console.error("AI chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get AI response: ${errorMessage}`);
    }
  },
});

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
