/**
 * Aurora AI Search Engine - AI Content Detector
 * 
 * Detects AI-generated content by analyzing:
 * - Common AI phrases and patterns
 * - Formal language markers
 * - Lack of personal voice
 * - Structural patterns typical of AI
 * 
 * Helps women identify potentially machine-generated misinformation.
 */

import type {
  AIContentDetection,
  AIContentLabel,
  AIContentColor,
} from './types';

// ============================================
// AI DETECTION PATTERNS
// ============================================

// Common AI phrases (ChatGPT, Claude, etc.)
const AI_PHRASES = [
  'as an ai',
  'i cannot',
  'i\'m unable to',
  'it\'s important to note',
  'it is important to note',
  'in conclusion',
  'to summarize',
  'let me explain',
  'i\'d be happy to',
  'certainly!',
  'absolutely!',
  'great question',
  'that\'s a great question',
  'i hope this helps',
  'feel free to ask',
  'don\'t hesitate to',
  'please let me know',
  'i\'m here to help',
];

// Structural patterns common in AI writing
const AI_STRUCTURAL_PATTERNS = [
  /firstly.*secondly.*thirdly/i,
  /on one hand.*on the other hand/i,
  /in this article.*we will/i,
  /let's explore/i,
  /let's dive into/i,
  /let's take a look/i,
  /comprehensive guide/i,
  /ultimate guide/i,
  /everything you need to know/i,
  /step-by-step/i,
  /here are \d+ (ways|tips|reasons|things)/i,
  /\d+ (ways|tips|reasons|things) to/i,
];

// Overly formal language markers
const FORMAL_MARKERS = [
  'furthermore',
  'moreover',
  'subsequently',
  'consequently',
  'nevertheless',
  'notwithstanding',
  'henceforth',
  'whereby',
  'thereof',
  'herein',
  'aforementioned',
  'pursuant to',
  'in accordance with',
  'with respect to',
  'in light of',
  'it is worth noting',
  'it should be noted',
  'it bears mentioning',
];

// Hedging language (AI tends to hedge a lot)
const HEDGING_PHRASES = [
  'it\'s possible that',
  'it may be',
  'it could be',
  'it might be',
  'generally speaking',
  'in general',
  'typically',
  'usually',
  'often',
  'sometimes',
  'in most cases',
  'in many cases',
  'depending on',
  'it depends',
];

// ============================================
// DETECTION FUNCTIONS
// ============================================

/**
 * Counts occurrences of patterns in text
 */
function countPatterns(text: string, patterns: (string | RegExp)[]): number {
  const lowerText = text.toLowerCase();
  let count = 0;

  patterns.forEach(pattern => {
    if (typeof pattern === 'string') {
      if (lowerText.includes(pattern)) count++;
    } else {
      if (pattern.test(text)) count++;
    }
  });

  return count;
}

/**
 * Checks for lack of personal voice
 */
function hasPersonalVoice(text: string): boolean {
  const lowerText = text.toLowerCase();
  const personalPronouns = ['i ', 'my ', 'me ', 'we ', 'our ', 'us '];
  const personalCount = personalPronouns.filter(p => lowerText.includes(p)).length;
  
  // If text is long but has few personal pronouns, likely AI
  return personalCount >= 2 || text.length < 200;
}

/**
 * Analyzes sentence structure for AI patterns
 */
function analyzeStructure(text: string): number {
  let score = 0;

  // Check for numbered lists (AI loves these)
  const numberedListPattern = /^\d+\.\s/gm;
  const numberedMatches = text.match(numberedListPattern);
  if (numberedMatches && numberedMatches.length >= 3) {
    score += 15;
  }

  // Check for bullet points
  const bulletPattern = /^[•\-\*]\s/gm;
  const bulletMatches = text.match(bulletPattern);
  if (bulletMatches && bulletMatches.length >= 3) {
    score += 10;
  }

  // Check for very uniform paragraph lengths (AI tends to be consistent)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 3) {
    const lengths = paragraphs.map(p => p.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    
    // Low variance = suspiciously uniform = likely AI
    if (stdDev < avgLength * 0.2) {
      score += 10;
    }
  }

  return score;
}

// ============================================
// MAIN DETECTION FUNCTION
// ============================================

/**
 * Detects AI-generated content
 * Returns percentage (0-100) of likely AI content
 * 
 * Property 11: Percentage must be 0-100
 * Property 12: Color coding based on percentage
 */
export function detectAIContent(text: string): AIContentDetection {
  if (!text || text.trim().length === 0) {
    return {
      percentage: 0,
      label: 'Mostly Human',
      color: 'green',
      indicators: [],
    };
  }

  let score = 0;
  const indicators: string[] = [];

  // Check AI phrases
  const aiPhraseCount = countPatterns(text, AI_PHRASES);
  if (aiPhraseCount > 0) {
    score += aiPhraseCount * 12;
    indicators.push(`${aiPhraseCount} AI phrase(s) detected`);
  }

  // Check structural patterns
  const structuralCount = countPatterns(text, AI_STRUCTURAL_PATTERNS);
  if (structuralCount > 0) {
    score += structuralCount * 10;
    indicators.push(`${structuralCount} AI structural pattern(s)`);
  }

  // Check formal markers
  const formalCount = countPatterns(text, FORMAL_MARKERS);
  if (formalCount >= 2) {
    score += formalCount * 5;
    indicators.push('Overly formal language');
  }

  // Check hedging
  const hedgingCount = countPatterns(text, HEDGING_PHRASES);
  if (hedgingCount >= 3) {
    score += hedgingCount * 3;
    indicators.push('Excessive hedging language');
  }

  // Check personal voice
  if (!hasPersonalVoice(text) && text.length > 200) {
    score += 15;
    indicators.push('Lack of personal voice');
  }

  // Analyze structure
  const structureScore = analyzeStructure(text);
  if (structureScore > 0) {
    score += structureScore;
    if (structureScore >= 15) {
      indicators.push('Uniform structure typical of AI');
    }
  }

  // Clamp to 0-100 (Property 11)
  const percentage = Math.min(100, Math.max(0, score));

  return {
    percentage,
    label: getAIContentLabel(percentage),
    color: getAIContentColor(percentage),
    indicators,
  };
}

/**
 * Maps AI content percentage to label
 */
export function getAIContentLabel(percentage: number): AIContentLabel {
  if (percentage >= 50) return 'High AI Content';
  if (percentage >= 25) return 'Some AI Content';
  return 'Mostly Human';
}

/**
 * Maps AI content percentage to color
 * Property 12: AI Content Color Coding
 * - 0-30%: green
 * - 31-60%: yellow
 * - 61-100%: red
 */
export function getAIContentColor(percentage: number): AIContentColor {
  if (percentage <= 30) return 'green';
  if (percentage <= 60) return 'yellow';
  return 'red';
}

/**
 * Batch detect AI content for multiple texts
 */
export function detectAIContentBatch(texts: string[]): AIContentDetection[] {
  return texts.map(text => detectAIContent(text));
}

/**
 * Calculate average AI content percentage
 * Property 5: Average Calculation Correctness
 */
export function calculateAverageAIContent(detections: AIContentDetection[]): number {
  if (detections.length === 0) return 0;
  const sum = detections.reduce((acc, d) => acc + d.percentage, 0);
  return Math.round(sum / detections.length);
}
