/**
 * Aurora Trust Score™ - Visual Bias Metrics
 * 
 * Calculates and formats trust scores for search results.
 * Makes bias metrics visually impactful and actionable.
 */

export interface TrustScoreResult {
  score: number;
  label: string;
  color: string;
  emoji: string;
  badges: {
    gender: { type: string; emoji: string; label: string };
    content: { type: string; emoji: string; label: string };
    freshness: { type: string; emoji: string; label: string };
    ai: { percentage: number; emoji: string; label: string };
  };
  details: {
    whyThisScore: string;
    keyFactors: string[];
    concerns: string[];
  };
}

const TRUST_COLORS = {
  excellent: { min: 85, color: '#22c55e', emoji: '🛡️', label: 'Highly Trusted' },
  good: { min: 70, color: '#84cc16', emoji: '✅', label: 'Trusted' },
  moderate: { min: 50, color: '#eab308', emoji: '⚠️', label: 'Verify' },
  caution: { min: 30, color: '#f97316', emoji: '🔶', label: 'Caution' },
  warning: { min: 0, color: '#ef4444', emoji: '🚨', label: 'Warning' },
};

const GENDER_BADGES = {
  positive: { emoji: '💜', label: 'Women-Positive' },
  neutral: { emoji: '⚪', label: 'Neutral' },
  dominated: { emoji: '🔵', label: 'Male-Dominated' },
};

const CONTENT_BADGES = {
  news: { emoji: '📰', label: 'News' },
  opinion: { emoji: '💭', label: 'Opinion' },
  promotional: { emoji: '💰', label: 'Promotional' },
  educational: { emoji: '📚', label: 'Educational' },
  entertainment: { emoji: '🎬', label: 'Entertainment' },
};

const FRESHNESS_BADGES = {
  fresh: { emoji: '✨', label: 'Fresh' },
  recent: { emoji: '📅', label: 'Recent' },
  dated: { emoji: '📆', label: 'Dated' },
  outdated: { emoji: '⏰', label: 'Outdated' },
};

/**
 * Calculate Aurora Trust Score from raw bias data
 */
export function calculateTrustScore(data: {
  genderBiasScore?: number;
  credibilityScore?: number;
  aiContentPercentage?: number;
  publishedDate?: string;
  isWomenFocused?: boolean;
  domain?: string;
  contentType?: string;
}): TrustScoreResult {
  let score = 50;
  const keyFactors: string[] = [];
  const concerns: string[] = [];

  // Gender representation (+/- 20 points)
  const genderScore = data.genderBiasScore ?? 50;
  score += (genderScore - 50) * 0.4;
  if (genderScore >= 70) keyFactors.push('Inclusive language and diverse perspectives');
  if (genderScore < 40) concerns.push('Limited women\'s perspectives');

  // Source credibility (+/- 25 points)
  const credScore = data.credibilityScore ?? 50;
  score += (credScore - 50) * 0.5;
  if (credScore >= 70) keyFactors.push('Established, credible source');
  if (credScore < 40) concerns.push('Source credibility unclear');

  // AI content penalty (up to -15 points)
  const aiPercent = data.aiContentPercentage ?? 0;
  score -= aiPercent * 0.15;
  if (aiPercent > 50) concerns.push(`${aiPercent}% AI-generated content detected`);

  // Freshness bonus
  const freshness = getFreshness(data.publishedDate);
  if (freshness === 'fresh') {
    score += 10;
    keyFactors.push('Recently published content');
  }
  if (freshness === 'outdated') {
    score -= 10;
    concerns.push('Information may be outdated');
  }

  // Women-focused bonus
  if (data.isWomenFocused) {
    score += 10;
    keyFactors.push('Women-focused source');
  }

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Get visual properties
  const visual = getVisualProperties(score);

  // Generate explanation
  const whyThisScore = generateExplanation(score, keyFactors, concerns);

  return {
    score,
    label: visual.label,
    color: visual.color,
    emoji: visual.emoji,
    badges: {
      gender: getGenderBadge(genderScore),
      content: getContentBadge(data.contentType),
      freshness: getFreshnessBadge(freshness),
      ai: { percentage: aiPercent, emoji: '🤖', label: `${aiPercent}% AI` },
    },
    details: {
      whyThisScore,
      keyFactors,
      concerns,
    },
  };
}

function getVisualProperties(score: number) {
  if (score >= TRUST_COLORS.excellent.min) return TRUST_COLORS.excellent;
  if (score >= TRUST_COLORS.good.min) return TRUST_COLORS.good;
  if (score >= TRUST_COLORS.moderate.min) return TRUST_COLORS.moderate;
  if (score >= TRUST_COLORS.caution.min) return TRUST_COLORS.caution;
  return TRUST_COLORS.warning;
}

function getGenderBadge(score: number) {
  if (score >= 70) return { type: 'positive', ...GENDER_BADGES.positive };
  if (score >= 40) return { type: 'neutral', ...GENDER_BADGES.neutral };
  return { type: 'dominated', ...GENDER_BADGES.dominated };
}

function getContentBadge(type?: string): { type: string; emoji: string; label: string } {
  const contentType = type?.toLowerCase() || 'news';
  const badge = CONTENT_BADGES[contentType as keyof typeof CONTENT_BADGES] || CONTENT_BADGES.news;
  return { type: contentType, ...badge };
}

function getFreshness(dateStr?: string): 'fresh' | 'recent' | 'dated' | 'outdated' {
  if (!dateStr) return 'recent';
  
  const date = new Date(dateStr);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 7) return 'fresh';
  if (daysDiff <= 90) return 'recent';
  if (daysDiff <= 365) return 'dated';
  return 'outdated';
}

function getFreshnessBadge(freshness: string) {
  return { type: freshness, ...FRESHNESS_BADGES[freshness as keyof typeof FRESHNESS_BADGES] };
}

function generateExplanation(score: number, factors: string[], concerns: string[]): string {
  if (score >= 85) {
    return `Aurora highly trusts this source. ${factors[0] || 'Quality content detected.'}`;
  }
  if (score >= 70) {
    return `This source appears trustworthy. ${factors[0] || 'Good overall quality.'}`;
  }
  if (score >= 50) {
    return `Verify this source. ${concerns[0] || 'Some quality indicators are mixed.'}`;
  }
  if (score >= 30) {
    return `Proceed with caution. ${concerns[0] || 'Quality concerns detected.'}`;
  }
  return `Aurora recommends finding alternative sources. ${concerns[0] || 'Multiple quality concerns.'}`;
}
