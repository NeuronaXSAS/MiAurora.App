import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitStatus } from '@/lib/rate-limit';

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
      // Return a fallback response instead of error
      return NextResponse.json({
        response: getFallbackResponse(message),
        userId,
      });
    }

    // Build conversation context
    const systemPrompt = getSystemPrompt();
    
    // Build conversation history for context
    let conversationContext = systemPrompt + "\n\n";
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6); // Last 6 messages for context
      recentHistory.forEach((msg: { isUser: boolean; content: string }) => {
        conversationContext += msg.isUser ? `User: ${msg.content}\n` : `Aurora: ${msg.content}\n`;
      });
    }
    conversationContext += `User: ${message}\nAurora:`;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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
            maxOutputTokens: 512,
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
      });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackResponse(message);

    return NextResponse.json({
      response: aiResponse.trim(),
      userId,
    });
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    return NextResponse.json({
      response: "I'm having a moment, but I'm still here for you. Could you try again? 💜",
      userId: null,
    });
  }
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
