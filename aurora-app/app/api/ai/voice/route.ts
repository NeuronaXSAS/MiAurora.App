import { NextRequest, NextResponse } from 'next/server';

// Voice AI endpoint using Gemini 2.0 Flash-Lite (most economical)
// Free Tier limits: 30 RPM, 1,000,000 TPM, 200 RPD

export async function POST(request: NextRequest) {
  try {
    const { text, userId, context, audioData } = await request.json();

    if (!text && !audioData) {
      return NextResponse.json(
        { error: 'Text or audio data is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json({
        response: getVoiceFallbackResponse(text || ''),
        userId,
      });
    }

    // Build context-aware prompt for voice interactions
    const systemPrompt = getVoiceSystemPrompt(context);
    const fullPrompt = `${systemPrompt}\n\nUser: ${text}\nAurora:`;

    // Use gemini-2.0-flash-lite for voice (most economical)
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
                { text: fullPrompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200, // Shorter for voice responses
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.statusText);
      return NextResponse.json({
        response: getVoiceFallbackResponse(text || ''),
        userId,
      });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || getVoiceFallbackResponse(text || '');

    return NextResponse.json({
      response: aiResponse.trim(),
      userId,
    });
  } catch (error) {
    console.error('Error in voice AI endpoint:', error);
    return NextResponse.json({
      response: "I'm here for you. Could you try again?",
      userId: null,
    });
  }
}

// Audio transcription endpoint (for processing audio input)
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const userId = formData.get('userId') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'API key not configured',
        transcript: '',
      }, { status: 500 });
    }

    // Convert audio to base64
    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const mimeType = audioFile.type || 'audio/mp3';

    // Use Gemini to transcribe audio
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
                { text: 'Transcribe this audio accurately. Only return the transcription, nothing else.' },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1, // Low temperature for accurate transcription
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini transcription error:', response.statusText);
      return NextResponse.json({
        error: 'Transcription failed',
        transcript: '',
      }, { status: 500 });
    }

    const data = await response.json();
    const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({
      transcript: transcript.trim(),
      userId,
    });
  } catch (error) {
    console.error('Error in audio transcription:', error);
    return NextResponse.json({
      error: 'Transcription failed',
      transcript: '',
    }, { status: 500 });
  }
}

function getVoiceSystemPrompt(context?: string): string {
  const basePrompt = `You are Aurora, a warm and supportive AI voice companion for women. Keep responses SHORT and conversational (1-2 sentences max) since they will be spoken aloud.

Your voice personality:
- Warm, caring, and empathetic
- Speak naturally like a supportive friend
- Use simple, clear language
- Be encouraging and positive`;

  const contextPrompts: Record<string, string> = {
    women_support: `${basePrompt}

Focus on emotional support, safety awareness, and empowerment for women.`,
    mental_health: `${basePrompt}

Focus on mental wellness, stress relief, and emotional support. Suggest breathing exercises or grounding techniques when appropriate.`,
    career: `${basePrompt}

Focus on career guidance, interview tips, and professional empowerment for women.`,
    language_learning: `${basePrompt}

Help with language practice. Be patient and encouraging. Correct gently and praise progress.`,
  };

  return contextPrompts[context || 'women_support'] || contextPrompts.women_support;
}

function getVoiceFallbackResponse(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('help') || lowerText.includes('emergency')) {
    return "I'm here for you. If you're in danger, please use the SOS button or call emergency services.";
  }
  if (lowerText.includes('sad') || lowerText.includes('down')) {
    return "I hear you. Your feelings are valid. Would you like to talk about it?";
  }
  if (lowerText.includes('anxious') || lowerText.includes('worried')) {
    return "Let's take a deep breath together. You're not alone in this.";
  }
  if (lowerText.includes('hello') || lowerText.includes('hi')) {
    return "Hello! I'm so glad you're here. How can I support you today?";
  }
  
  return "I'm listening. Tell me more about what's on your mind.";
}
