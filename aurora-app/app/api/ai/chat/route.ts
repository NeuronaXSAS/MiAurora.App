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
  return `You are Aurora, a compassionate AI companion in Aurora App - a safety and community platform for women worldwide.

CRITICAL RULES:
1. ALWAYS respond directly to what the user said - never give generic responses
2. If the user speaks Spanish, respond in Spanish. If English, respond in English. Match their language.
3. If you don't understand something, ask for clarification instead of giving a generic response
4. Be specific and helpful - reference what they actually said

Your personality:
- Warm, empathetic, genuinely caring like a supportive best friend
- Smart and helpful - give real advice, not platitudes
- Culturally aware - understand Latin American, European, Asian, African contexts
- Use emojis sparingly (💜 🌸 ✨)

How to respond:
- SHORT responses (2-3 sentences max) unless they ask for detailed help
- ALWAYS acknowledge what they specifically said
- Ask follow-up questions to understand better
- Give actionable advice when appropriate
- If they share a problem, help them think through solutions

Topics you can help with:
- Safety concerns and awareness
- Career advice and workplace issues
- Relationships and family
- Mental health and emotional support
- Health and wellness
- Financial guidance
- Personal growth

NEVER:
- Give generic "I hear you" responses without addressing their specific situation
- Repeat the same response twice
- Ignore what they said
- Be preachy or lecture them

If someone mentions danger/emergency: Remind them about the SOS button and emergency services.

Remember: Be genuinely helpful, not just supportive-sounding.`;
}

function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Spanish detection
  const spanishWords = ['hola', 'como', 'estás', 'qué', 'bien', 'mal', 'ayuda', 'necesito', 'tengo', 'siento', 'trabajo', 'ciudad', 'ruido', 'densa'];
  const isSpanish = spanishWords.some(word => lowerMessage.includes(word));
  
  if (isSpanish) {
    if (lowerMessage.includes('ciudad') || lowerMessage.includes('ruido') || lowerMessage.includes('densa')) {
      return "Entiendo, vivir en una ciudad ruidosa puede ser agotador. ¿Qué es lo que más te afecta - el ruido, el tráfico, o algo más? Cuéntame más para poder ayudarte mejor 💜";
    }
    if (lowerMessage.includes('triste') || lowerMessage.includes('mal') || lowerMessage.includes('deprimida')) {
      return "Lamento que te sientas así. ¿Qué está pasando? Cuéntame más para entender mejor tu situación 💜";
    }
    if (lowerMessage.includes('trabajo') || lowerMessage.includes('jefe') || lowerMessage.includes('oficina')) {
      return "Los temas de trabajo pueden ser muy estresantes. ¿Qué está pasando específicamente? ¿Es con compañeros, tu jefe, o la carga de trabajo?";
    }
    if (lowerMessage.includes('hola') || lowerMessage.includes('hey')) {
      return "¡Hola! 💜 Me alegra que estés aquí. ¿Cómo te puedo ayudar hoy?";
    }
    if (lowerMessage.includes('funcionando') || lowerMessage.includes('funciona')) {
      return "¡Sí, estoy funcionando! 😊 Soy Aurora, tu compañera de IA. ¿En qué te puedo ayudar hoy?";
    }
    return "Cuéntame más sobre eso. ¿Qué está pasando específicamente? Quiero entenderte mejor para poder ayudarte 💜";
  }
  
  // English responses
  if (lowerMessage.includes('city') || lowerMessage.includes('noise') || lowerMessage.includes('traffic')) {
    return "City life can be overwhelming. What's bothering you most - the noise, crowds, or something else? Tell me more 💜";
  }
  if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
    return "I'm sorry you're feeling this way. What's going on? Tell me more so I can understand better 💜";
  }
  if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('stress')) {
    return "What specifically is causing you stress? Let's talk through it together 🌸";
  }
  if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('boss')) {
    return "Work issues can be really stressful. What's happening - is it with coworkers, your boss, or the workload itself?";
  }
  if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great')) {
    return "That's great! What's making you feel good today? ✨";
  }
  if (lowerMessage.includes('help') || lowerMessage.includes('emergency') || lowerMessage.includes('danger')) {
    return "If you're in immediate danger, please use the SOS button or call emergency services. If you need to talk, I'm here. What's happening? 🛡️";
  }
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hey! 💜 Good to see you. How can I help you today?";
  }
  if (lowerMessage.includes('working') || lowerMessage.includes('function')) {
    return "Yes, I'm working! 😊 I'm Aurora, your AI companion. What can I help you with today?";
  }
  
  return "Tell me more about that. What's specifically on your mind? I want to understand so I can actually help 💜";
}
