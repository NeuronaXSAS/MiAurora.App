/**
 * Aurora AI Search Engine - Gemini Summary Service
 * 
 * Generates women-first AI summaries using Google Gemini.
 * Summaries prioritize women's safety, wellbeing, and empowerment.
 * 
 * Requirements: 1.2, 1.3, 1.4
 */

import type { SearchResult, SummaryResponse } from './types';

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Women-first perspective prompt
 */
const WOMEN_FIRST_PROMPT = `You are Aurora App's AI assistant, the world's first women-first search engine.
Your role is to summarize search results with a focus on women's safety, wellbeing, and empowerment.

Guidelines:
1. Prioritize information relevant to women's perspectives and needs
2. Highlight safety considerations when relevant
3. Note any potential biases or concerns in the sources
4. Be supportive and empowering in tone
5. Keep summaries concise (2-3 paragraphs maximum)
6. Always cite sources by number [1], [2], etc.
7. If the topic relates to women's health, safety, or rights, emphasize trusted resources

Format your response as:
- A clear, helpful summary (2-3 paragraphs)
- End with "Sources: [1], [2], ..." referencing which results you used`;

/**
 * Generates a women-first summary of search results
 */
export async function generateSummary(
  query: string,
  results: SearchResult[]
): Promise<SummaryResponse> {
  if (!GEMINI_API_KEY) {
    return {
      summary: 'AI summary unavailable. Configure GOOGLE_AI_API_KEY to enable summaries.',
      sources: [],
      perspective: 'balanced',
      generatedAt: new Date().toISOString(),
    };
  }

  if (results.length === 0) {
    return {
      summary: 'No results found to summarize.',
      sources: [],
      perspective: 'balanced',
      generatedAt: new Date().toISOString(),
    };
  }

  // Prepare context from search results
  const resultsContext = results
    .slice(0, 5) // Use top 5 results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.description}\nSource: ${r.domain}`)
    .join('\n\n');

  const prompt = `${WOMEN_FIRST_PROMPT}

User's search query: "${query}"

Search results to summarize:
${resultsContext}

Please provide a helpful, women-first summary of these results.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.9,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const summaryText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract source references from summary
    const sourceMatches = summaryText.match(/\[(\d+)\]/g) || [];
    const parsedIndices = sourceMatches.map((m: string) => parseInt(m.replace(/[\[\]]/g, '')));
    const uniqueIndices = Array.from(new Set(parsedIndices));
    const sources = uniqueIndices
      .filter((i) => i <= results.length)
      .map((i) => results[i - 1]?.url)
      .filter((url): url is string => Boolean(url));

    // Validate summary length (Property 2: max 3 paragraphs)
    const paragraphs = summaryText.split(/\n\n+/).filter((p: string) => p.trim().length > 0);
    const trimmedSummary = paragraphs.slice(0, 3).join('\n\n');

    return {
      summary: trimmedSummary,
      sources,
      perspective: 'women-first',
      generatedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Gemini summary error:', error);
    return {
      summary: 'Unable to generate AI summary at this time. Please review the search results directly.',
      sources: [],
      perspective: 'balanced',
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Validates that summary meets requirements
 * Property 2: Summary Length Constraint
 */
export function validateSummary(summary: string): {
  isValid: boolean;
  paragraphCount: number;
  hasSourceReferences: boolean;
} {
  const paragraphs = summary.split(/\n\n+/).filter(p => p.trim().length > 0);
  const hasSourceReferences = /\[\d+\]/.test(summary);

  return {
    isValid: paragraphs.length <= 3 && hasSourceReferences,
    paragraphCount: paragraphs.length,
    hasSourceReferences,
  };
}
