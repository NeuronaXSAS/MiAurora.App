/**
 * AI Metadata Extraction for Reels
 * 
 * Analyzes reel content using Google Gemini to extract safety metadata.
 * This enables automatic categorization and safety scoring.
 */

'use node';

import { v } from 'convex/values';
import { action } from '../_generated/server';
import { api } from '../_generated/api';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with API key from environment
const getGenAI = () => {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured. Check docs/ENV_MASTER_GUIDE.md');
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Analyze reel content and extract safety metadata
 * 
 * This action is triggered after a reel is uploaded.
 * It uses Google Gemini to analyze the caption and context.
 */
export const analyzeReelContent = action({
  args: {
    reelId: v.id('reels'),
  },
  handler: async (ctx, args) => {
    try {
      // Fetch the reel data
      const reel = await ctx.runQuery(api.reels.getReel, {
        reelId: args.reelId,
      });

      if (!reel) {
        throw new Error('Reel not found');
      }

      // Prepare context for AI analysis
      const analysisContext = `
Video Caption: ${reel.caption || 'No caption provided'}
Hashtags: ${reel.hashtags?.join(', ') || 'None'}
Location: ${reel.location?.name || 'Not specified'}
Duration: ${reel.duration} seconds
      `.trim();

      // Call Google Gemini for analysis
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
You are an AI assistant for a women's safety platform called Aurora App.
Analyze the following video content and provide safety intelligence.

Context:
${analysisContext}

Please analyze this content and respond with a JSON object containing:
1. "safetyCategory": One of ["Harassment", "Joy", "Lighting Issue", "Infrastructure Problem", "Positive Experience", "Warning"]
2. "sentiment": A number from -1 (very negative) to 1 (very positive)
3. "detectedObjects": Array of relevant objects/themes mentioned (e.g., ["street", "lighting", "crowd"])
4. "visualTags": Array of descriptive tags (e.g., ["dark street", "well-lit", "crowded area", "isolated"])
5. "safetyScore": A number from 0-100 indicating overall safety level (100 = very safe)

Focus on safety-relevant aspects for women navigating urban spaces.
Respond ONLY with valid JSON, no additional text.
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Parse AI response
      let aiMetadata;
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiMetadata = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseText);
        // Fallback metadata
        aiMetadata = {
          safetyCategory: 'Positive Experience',
          sentiment: 0,
          detectedObjects: [],
          visualTags: [],
          safetyScore: 50,
        };
      }

      // Update the reel with AI metadata
      await ctx.runMutation(api.reels.updateAIMetadata, {
        reelId: args.reelId,
        aiMetadata: {
          safetyCategory: aiMetadata.safetyCategory,
          sentiment: aiMetadata.sentiment,
          detectedObjects: aiMetadata.detectedObjects || [],
          visualTags: aiMetadata.visualTags || [],
        },
      });

      // Update moderation status to approved (basic auto-approval)
      // In production, you'd have more sophisticated moderation logic
      await ctx.runMutation(api.reels.updateModerationStatus, {
        reelId: args.reelId,
        status: 'approved',
      });

      return {
        success: true,
        metadata: aiMetadata,
      };
    } catch (error) {
      console.error('Failed to analyze reel:', error);
      
      // Still approve the reel even if AI analysis fails
      try {
        await ctx.runMutation(api.reels.updateModerationStatus, {
          reelId: args.reelId,
          status: 'approved',
        });
      } catch (updateError) {
        console.error('Failed to update moderation status:', updateError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      };
    }
  },
});
