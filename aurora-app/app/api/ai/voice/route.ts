import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, userId, context } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Get Gemini API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Build context-aware system prompt
    const systemPrompt = getSystemPrompt(context);

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
                  text: `${systemPrompt}\n\nUser: ${text}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I could not generate a response.';

    return NextResponse.json({
      response: aiResponse,
      userId,
    });
  } catch (error) {
    console.error('Error in AI voice endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function getSystemPrompt(context: string): string {
  const basePrompt = `You are Aurora, a compassionate AI voice companion designed specifically to support women worldwide. You are:

- Empathetic and understanding
- Culturally sensitive and aware
- Supportive without being patronizing
- Knowledgeable about women's issues, safety, career development, and mental health
- Able to provide practical advice and emotional support
- Respectful of diverse backgrounds and experiences

Keep your responses conversational, warm, and concise (2-3 sentences max for voice). Use a supportive tone.`;

  const contextPrompts: Record<string, string> = {
    women_support: `${basePrompt}\n\nFocus on: emotional support, safety advice, community building, and empowerment.`,
    mental_health: `${basePrompt}\n\nFocus on: stress management, anxiety relief, emotional wellbeing, and self-care strategies.`,
    language_learning: `${basePrompt}\n\nFocus on: conversational practice, cultural context, pronunciation tips, and encouraging language learning.`,
    career_coaching: `${basePrompt}\n\nFocus on: career advice, interview preparation, professional development, and workplace challenges.`,
    safety: `${basePrompt}\n\nFocus on: personal safety, situational awareness, emergency preparedness, and community safety resources.`,
  };

  return contextPrompts[context] || basePrompt;
}
