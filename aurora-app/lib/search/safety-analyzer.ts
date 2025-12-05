/**
 * Aurora AI Search Engine - Safety Analyzer
 * 
 * Detects safety-relevant content and flags:
 * - Verified Content
 * - Women-Led organizations
 * - Safe Spaces
 * - Scam Warnings
 * - Safety Concerns
 * - Women-Focused sources
 * 
 * Helps women quickly identify important safety resources.
 */

import type { SafetyFlag } from './types';
import { isWomenFocused } from './credibility-scorer';

// ============================================
// SAFETY DETECTION PATTERNS
// ============================================

// Positive safety indicators
const VERIFIED_INDICATORS = [
  'verified', 'certified', 'accredited', 'official',
  'authorized', 'licensed', 'registered', 'approved',
  'trusted', 'recognized', 'endorsed'
];

const WOMEN_LED_INDICATORS = [
  'women-owned', 'woman-owned', 'female-founded', 'women-led',
  'woman-led', 'female-led', 'founded by women', 'led by women',
  'women entrepreneurs', 'female entrepreneurs', 'women in leadership',
  'female ceo', 'woman ceo', 'women executives'
];

const SAFE_SPACE_INDICATORS = [
  'safe space', 'safe environment', 'inclusive space',
  'welcoming environment', 'supportive community', 'judgment-free',
  'lgbtq+ friendly', 'women-friendly', 'family-friendly',
  'harassment-free', 'discrimination-free', 'zero tolerance'
];

// Warning indicators
const SCAM_INDICATORS = [
  'scam', 'fraud', 'fraudulent', 'fake', 'phishing',
  'pyramid scheme', 'ponzi', 'get rich quick', 'too good to be true',
  'wire transfer', 'western union', 'gift cards', 'cryptocurrency scam',
  'romance scam', 'job scam', 'lottery scam', 'inheritance scam'
];

const SAFETY_CONCERN_INDICATORS = [
  'harassment', 'abuse', 'violence', 'assault', 'stalking',
  'domestic violence', 'sexual harassment', 'workplace harassment',
  'cyberbullying', 'online harassment', 'threats', 'intimidation',
  'discrimination', 'hostile environment', 'toxic workplace',
  'unsafe', 'dangerous', 'warning', 'caution', 'alert'
];

// Women-focused content indicators
const WOMEN_FOCUSED_INDICATORS = [
  'for women', 'women\'s', 'female', 'feminine', 'girl',
  'mother', 'sister', 'daughter', 'women empowerment',
  'women\'s health', 'women\'s rights', 'gender equality',
  'women in tech', 'women in stem', 'women in business'
];

// ============================================
// DETECTION FUNCTIONS
// ============================================

/**
 * Checks if text contains any of the given indicators
 */
function containsIndicators(text: string, indicators: string[]): boolean {
  const lowerText = text.toLowerCase();
  return indicators.some(indicator => lowerText.includes(indicator));
}

/**
 * Counts how many indicators are present
 */
function countIndicators(text: string, indicators: string[]): number {
  const lowerText = text.toLowerCase();
  return indicators.filter(indicator => lowerText.includes(indicator)).length;
}

// ============================================
// MAIN DETECTION FUNCTION
// ============================================

/**
 * Detects safety flags in content
 * Returns array of applicable safety flags
 */
export function detectSafetyFlags(text: string, url?: string): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  const lowerText = text.toLowerCase();

  // Check for verified content
  if (containsIndicators(lowerText, VERIFIED_INDICATORS)) {
    flags.push('Verified Content');
  }

  // Check for women-led organizations
  if (containsIndicators(lowerText, WOMEN_LED_INDICATORS)) {
    flags.push('Women-Led');
  }

  // Check for safe spaces
  if (containsIndicators(lowerText, SAFE_SPACE_INDICATORS)) {
    flags.push('Safe Space');
  }

  // Check for scam warnings
  if (containsIndicators(lowerText, SCAM_INDICATORS)) {
    flags.push('Scam Warning');
  }

  // Check for safety concerns
  if (containsIndicators(lowerText, SAFETY_CONCERN_INDICATORS)) {
    flags.push('Safety Concern');
  }

  // Check for women-focused content
  const womenFocusedCount = countIndicators(lowerText, WOMEN_FOCUSED_INDICATORS);
  if (womenFocusedCount >= 2) {
    flags.push('Women-Focused');
  }

  // Also check domain for women-focused
  if (url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '').toLowerCase();
      if (isWomenFocused(domain) && !flags.includes('Women-Focused')) {
        flags.push('Women-Focused');
      }
    } catch {
      // Invalid URL, skip domain check
    }
  }

  return flags;
}

/**
 * Checks if content is women-focused
 */
export function isContentWomenFocused(text: string, url?: string): boolean {
  const flags = detectSafetyFlags(text, url);
  return flags.includes('Women-Focused') || flags.includes('Women-Led');
}

/**
 * Checks if content has safety warnings
 */
export function hasSafetyWarnings(text: string): boolean {
  const flags = detectSafetyFlags(text);
  return flags.includes('Scam Warning') || flags.includes('Safety Concern');
}

/**
 * Checks if content is safety-critical (needs prominent display)
 */
export function isSafetyCritical(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Emergency/crisis indicators
  const crisisIndicators = [
    'emergency', 'crisis', 'hotline', 'helpline', 'shelter',
    'domestic violence', 'sexual assault', 'suicide prevention',
    'mental health crisis', 'abuse hotline', 'safe house'
  ];

  return containsIndicators(lowerText, crisisIndicators);
}

/**
 * Gets safety flag icon for display
 */
export function getSafetyFlagIcon(flag: SafetyFlag): string {
  switch (flag) {
    case 'Verified Content':
      return '✓';
    case 'Women-Led':
      return '👩';
    case 'Safe Space':
      return '🛡️';
    case 'Scam Warning':
      return '⚠️';
    case 'Safety Concern':
      return '⚠️';
    case 'Women-Focused':
      return '💜';
    default:
      return '•';
  }
}

/**
 * Gets safety flag color for display
 */
export function getSafetyFlagColor(flag: SafetyFlag): string {
  switch (flag) {
    case 'Verified Content':
      return 'green';
    case 'Women-Led':
      return 'purple';
    case 'Safe Space':
      return 'blue';
    case 'Scam Warning':
      return 'red';
    case 'Safety Concern':
      return 'orange';
    case 'Women-Focused':
      return 'pink';
    default:
      return 'gray';
  }
}

/**
 * Batch detect safety flags for multiple texts
 */
export function detectSafetyFlagsBatch(
  items: Array<{ text: string; url?: string }>
): SafetyFlag[][] {
  return items.map(item => detectSafetyFlags(item.text, item.url));
}

/**
 * Count women-focused results
 */
export function countWomenFocusedResults(
  items: Array<{ text: string; url?: string }>
): { count: number; percentage: number } {
  const womenFocused = items.filter(item => isContentWomenFocused(item.text, item.url));
  return {
    count: womenFocused.length,
    percentage: items.length > 0 ? Math.round((womenFocused.length / items.length) * 100) : 0,
  };
}
