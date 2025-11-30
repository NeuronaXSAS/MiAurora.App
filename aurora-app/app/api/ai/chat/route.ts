import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitStatus } from '@/lib/rate-limit';

// Mental health metrics tracking
interface MentalHealthMetrics {
  sentiment: 'positive' | 'neutral' | 'negative' | 'crisis';
  topics: string[];
  emotionalState?: string;
  needsFollowUp: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, conversationHistory, isPremium } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check rate limit for AI chat
    if (userId) {
      const rateLimitResult = checkRateLimit(userId, 'aiChat', isPremium || false);
      
      if (!rateLimitResult.success) {
        const resetMinutes = Math.ceil(rateLimitResult.resetIn / 60000);
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: isPremium 
              ? `You've reached your daily limit. Resets in ${resetMinutes} minutes.`
              : `You've used your 10 free messages today. Upgrade to Premium for 1000 daily messages! Resets in ${resetMinutes} minutes.`,
            remaining: rateLimitResult.remaining,
            resetIn: rateLimitResult.resetIn,
            upgradeToPremium: !isPremium,
          },
          { status: 429 }
        );
      }
    }

    // Get Gemini API key from environment
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json({
        response: getFallbackResponse(message),
        userId,
        metrics: analyzeMentalHealthLocally(message),
      });
    }

    // Build conversation context with mental health focus
    const systemPrompt = getSystemPrompt();
    
    // Build conversation history for context (limit to save tokens)
    let conversationContext = systemPrompt + "\n\n";
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-4); // Last 4 messages to save tokens
      recentHistory.forEach((msg: { isUser: boolean; content: string }) => {
        conversationContext += msg.isUser ? `User: ${msg.content}\n` : `Aurora: ${msg.content}\n`;
      });
    }
    conversationContext += `User: ${message}\nAurora:`;

    // Use gemini-2.0-flash-lite - MOST ECONOMICAL for Free Tier
    // Rate limits: 30 RPM, 1,000,000 TPM, 200 RPD
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: conversationContext,
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
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.statusText);
      return NextResponse.json({
        response: getFallbackResponse(message),
        userId,
        metrics: analyzeMentalHealthLocally(message),
      });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackResponse(message);

    // Analyze mental health metrics from conversation
    const metrics = analyzeMentalHealthLocally(message);

    return NextResponse.json({
      response: aiResponse.trim(),
      userId,
      metrics, // Return mental health metrics for tracking
    });
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    return NextResponse.json({
      response: "I'm having a moment, but I'm still here for you. Could you try again? 💜",
      userId: null,
      metrics: { sentiment: 'neutral', topics: [], needsFollowUp: false },
    });
  }
}

// Local mental health analysis (no API cost)
function analyzeMentalHealthLocally(message: string): MentalHealthMetrics {
  const lowerMessage = message.toLowerCase();
  const topics: string[] = [];
  let sentiment: 'positive' | 'neutral' | 'negative' | 'crisis' = 'neutral';
  let emotionalState: string | undefined;
  let needsFollowUp = false;

  // Crisis detection (highest priority)
  const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'want to die', 'self harm', 'hurt myself'];
  if (crisisKeywords.some(k => lowerMessage.includes(k))) {
    sentiment = 'crisis';
    topics.push('crisis');
    needsFollowUp = true;
    emotionalState = 'crisis';
    return { sentiment, topics, emotionalState, needsFollowUp };
  }

  // Negative sentiment detection
  const negativeKeywords = ['sad', 'depressed', 'anxious', 'worried', 'stressed', 'lonely', 'scared', 'angry', 'frustrated', 'hopeless', 'overwhelmed', 'tired', 'exhausted'];
  const positiveKeywords = ['happy', 'good', 'great', 'excited', 'grateful', 'thankful', 'proud', 'confident', 'hopeful', 'peaceful', 'calm'];

  const negativeCount = negativeKeywords.filter(k => lowerMessage.includes(k)).length;
  const positiveCount = positiveKeywords.filter(k => lowerMessage.includes(k)).length;

  if (negativeCount > positiveCount) {
    sentiment = 'negative';
    needsFollowUp = negativeCount >= 2;
  } else if (positiveCount > negativeCount) {
    sentiment = 'positive';
  }

  // Topic detection
  if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('career')) {
    topics.push('career');
  }
  if (lowerMessage.includes('relationship') || lowerMessage.includes('partner') || lowerMessage.includes('boyfriend') || lowerMessage.includes('husband')) {
    topics.push('relationships');
  }
  if (lowerMessage.includes('family') || lowerMessage.includes('mom') || lowerMessage.includes('dad') || lowerMessage.includes('parent')) {
    topics.push('family');
  }
  if (lowerMessage.includes('health') || lowerMessage.includes('sick') || lowerMessage.includes('pain')) {
    topics.push('health');
  }
  if (lowerMessage.includes('money') || lowerMessage.includes('financial') || lowerMessage.includes('debt')) {
    topics.push('financial');
  }
  if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired')) {
    topics.push('sleep');
  }
  if (lowerMessage.includes('safe') || lowerMessage.includes('danger') || lowerMessage.includes('afraid') || lowerMessage.includes('threat')) {
    topics.push('safety');
    needsFollowUp = true;
  }

  // Emotional state detection
  if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) emotionalState = 'anxious';
  else if (lowerMessage.includes('sad') || lowerMessage.includes('depressed')) emotionalState = 'sad';
  else if (lowerMessage.includes('angry') || lowerMessage.includes('frustrated')) emotionalState = 'angry';
  else if (lowerMessage.includes('happy') || lowerMessage.includes('excited')) emotionalState = 'happy';
  else if (lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed')) emotionalState = 'stressed';

  return { sentiment, topics, emotionalState, needsFollowUp };
}

function getSystemPrompt(): string {
  return `You are Aurora, a compassionate AI companion in the Aurora App - a safety and community platform designed specifically for women worldwide.

Your personality:
- Warm, empathetic, and genuinely caring
- Supportive without being patronizing
- Culturally sensitive and inclusive
- Knowledgeable about women's issues, safety, mental health, and career development
- You use emojis sparingly but meaningfully (💜 🌸 ✨ 🤗)

Your capabilities in Aurora App:
- Emotional support and active listening
- Safety advice and awareness
- Mental health check-ins and coping strategies
- Career guidance and empowerment
- Community connection suggestions

Guidelines:
- Keep responses conversational and warm (2-4 sentences typically)
- Validate feelings before offering advice
- If someone mentions danger or emergency, remind them about the SOS button and emergency services
- Never provide medical diagnoses or replace professional help
- Encourage community connection and self-care
- Be encouraging but realistic

Remember: You're talking to women who may be going through difficult times. Be their supportive friend.`;
}

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
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
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
