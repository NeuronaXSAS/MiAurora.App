/**
 * Aurora Trust Score™ - Visual Bias Metrics
 * 
 * Calculates and formats trust scores for search results.
 * Makes bias metrics visually impactful, UNIQUE per result, and addictive to check.
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
    actionTip: string; // NEW: Actionable advice
    sistersSay: string; // NEW: What the community thinks
  };
}

const TRUST_COLORS = {
  excellent: { min: 85, color: '#22c55e', emoji: '💚', label: 'Highly Trusted' },
  good: { min: 70, color: '#84cc16', emoji: '✨', label: 'Trusted' },
  moderate: { min: 50, color: '#eab308', emoji: '🤔', label: 'Verify' },
  caution: { min: 30, color: '#f97316', emoji: '⚡', label: 'Caution' },
  warning: { min: 0, color: '#ef4444', emoji: '💔', label: 'Warning' },
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
  health: { emoji: '💗', label: 'Health' },
  career: { emoji: '💼', label: 'Career' },
  safety: { emoji: '🛡️', label: 'Safety' },
};

const FRESHNESS_BADGES = {
  fresh: { emoji: '✨', label: 'Fresh' },
  recent: { emoji: '📅', label: 'Recent' },
  dated: { emoji: '📆', label: 'Dated' },
  outdated: { emoji: '⏰', label: 'Outdated' },
};

// Dynamic explanation templates - makes each result feel unique
const TRUST_EXPLANATIONS = {
  excellent: [
    "This source consistently champions women's voices 💜",
    "Aurora loves this one - credible, fresh, and inclusive",
    "A trusted source that respects diverse perspectives",
    "High-quality content with women's interests at heart",
  ],
  good: [
    "Solid source with good credibility markers",
    "Generally trustworthy - a few things to note below",
    "Aurora gives this a thumbs up with minor caveats",
    "Reliable content, worth your time",
  ],
  moderate: [
    "Mixed signals here - read with a critical eye",
    "Some good points, but verify key claims",
    "Aurora suggests cross-checking this one",
    "Decent content, but do your own research too",
  ],
  caution: [
    "Proceed carefully - some red flags detected",
    "Aurora spotted concerns worth knowing about",
    "This source has credibility questions",
    "Consider finding alternative sources",
  ],
  warning: [
    "Aurora recommends finding better sources",
    "Multiple concerns detected - be very careful",
    "This content may not serve your best interests",
    "Strong recommendation to seek alternatives",
  ],
};

const ACTION_TIPS = {
  highAI: "💡 Tip: AI-heavy content - look for human expert quotes",
  lowCredibility: "💡 Tip: Check if other trusted sources confirm this",
  maleDominated: "💡 Tip: Seek women's perspectives on this topic too",
  outdated: "💡 Tip: Look for more recent coverage on this",
  promotional: "💡 Tip: This may be trying to sell you something",
  excellent: "💡 Tip: Great source! Consider bookmarking for future reference",
  womenFocused: "💡 Tip: This source centers women's experiences 💜",
};

const SISTERS_SAY = {
  excellent: "Sisters love this source ✨",
  good: "Generally well-received by the community",
  moderate: "Mixed reviews from sisters",
  caution: "Some sisters have flagged concerns",
  warning: "Sisters recommend alternatives",
};

/**
 * Calculate Aurora Trust Score from raw bias data
 * Now with DYNAMIC, UNIQUE explanations per result!
 */
export function calculateTrustScore(data: {
  genderBiasScore?: number;
  credibilityScore?: number;
  aiContentPercentage?: number;
  publishedDate?: string;
  isWomenFocused?: boolean;
  domain?: string;
  contentType?: string;
  title?: string; // NEW: For more context-aware explanations
}): TrustScoreResult {
  let score = 50;
  const keyFactors: string[] = [];
  const concerns: string[] = [];

  // Gender representation (+/- 20 points)
  const genderScore = data.genderBiasScore ?? 50;
  score += (genderScore - 50) * 0.4;
  if (genderScore >= 70) {
    keyFactors.push('Inclusive language that respects all perspectives');
    keyFactors.push('Diverse voices represented in the content');
  } else if (genderScore >= 50) {
    keyFactors.push('Reasonably balanced gender representation');
  } else if (genderScore < 40) {
    concerns.push('Content may lack women\'s perspectives');
    concerns.push('Consider seeking female expert opinions on this topic');
  }

  // Source credibility (+/- 25 points)
  const credScore = data.credibilityScore ?? 50;
  score += (credScore - 50) * 0.5;
  if (credScore >= 80) {
    keyFactors.push(`${data.domain || 'This source'} has strong credibility markers`);
  } else if (credScore >= 60) {
    keyFactors.push('Source has reasonable credibility');
  } else if (credScore < 40) {
    concerns.push(`${data.domain || 'Source'} credibility could not be fully verified`);
    concerns.push('Cross-reference with established sources');
  }

  // AI content analysis (up to -15 points)
  const aiPercent = data.aiContentPercentage ?? 0;
  score -= aiPercent * 0.15;
  if (aiPercent > 70) {
    concerns.push(`High AI content detected (${aiPercent}%) - may lack human insight`);
  } else if (aiPercent > 40) {
    concerns.push(`Moderate AI content (${aiPercent}%) - verify key claims`);
  } else if (aiPercent < 20 && aiPercent > 0) {
    keyFactors.push('Primarily human-written content');
  }

  // Freshness analysis
  const freshness = getFreshness(data.publishedDate);
  if (freshness === 'fresh') {
    score += 10;
    keyFactors.push('Published recently - information is current');
  } else if (freshness === 'recent') {
    keyFactors.push('Published within the last few months');
  } else if (freshness === 'dated') {
    concerns.push('Content is over a year old - verify if still accurate');
  } else if (freshness === 'outdated') {
    score -= 10;
    concerns.push('Information may be outdated - seek recent sources');
  }

  // Women-focused bonus
  if (data.isWomenFocused) {
    score += 10;
    keyFactors.push('Source specifically centers women\'s experiences 💜');
  }

  // Domain-specific insights
  if (data.domain) {
    const domainLower = data.domain.toLowerCase();
    if (domainLower.includes('gov')) {
      keyFactors.push('Government source - typically reliable for official info');
      score += 5;
    } else if (domainLower.includes('edu')) {
      keyFactors.push('Educational institution - academic credibility');
      score += 5;
    } else if (domainLower.includes('wiki')) {
      concerns.push('Wiki content - anyone can edit, verify claims');
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Get visual properties
  const visual = getVisualProperties(score);

  // Generate UNIQUE explanation based on all factors
  const whyThisScore = generateDynamicExplanation(score, keyFactors, concerns, data);
  const actionTip = generateActionTip(score, aiPercent, genderScore, credScore, freshness, data.isWomenFocused);
  const sistersSay = generateSistersSay(score);

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
      keyFactors: keyFactors.slice(0, 3), // Top 3 factors
      concerns: concerns.slice(0, 3), // Top 3 concerns
      actionTip,
      sistersSay,
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

/**
 * Generate a UNIQUE, dynamic explanation based on all factors
 */
function generateDynamicExplanation(
  score: number, 
  factors: string[], 
  concerns: string[],
  data: { domain?: string; isWomenFocused?: boolean }
): string {
  // Pick a random template from the appropriate tier
  const tier = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'moderate' : score >= 30 ? 'caution' : 'warning';
  const templates = TRUST_EXPLANATIONS[tier];
  const baseExplanation = templates[Math.floor(Math.random() * templates.length)];
  
  // Add domain-specific context if available
  if (data.domain && score >= 70) {
    return `${baseExplanation} ${data.domain} shows strong trust signals.`;
  }
  
  // Add women-focused highlight
  if (data.isWomenFocused && score >= 60) {
    return `${baseExplanation} Plus, it centers women's perspectives!`;
  }
  
  // Add concern context for lower scores
  if (score < 50 && concerns.length > 0) {
    return `${baseExplanation} Main concern: ${concerns[0].toLowerCase()}`;
  }
  
  return baseExplanation;
}

/**
 * Generate actionable tip based on the specific issues found
 */
function generateActionTip(
  score: number,
  aiPercent: number,
  genderScore: number,
  credScore: number,
  freshness: string,
  isWomenFocused?: boolean
): string {
  // Prioritize the most relevant tip
  if (aiPercent > 50) return ACTION_TIPS.highAI;
  if (credScore < 40) return ACTION_TIPS.lowCredibility;
  if (genderScore < 40) return ACTION_TIPS.maleDominated;
  if (freshness === 'outdated') return ACTION_TIPS.outdated;
  if (isWomenFocused) return ACTION_TIPS.womenFocused;
  if (score >= 85) return ACTION_TIPS.excellent;
  
  return "💡 Tip: Always cross-reference important information";
}

/**
 * Generate what "sisters" (community) might say
 */
function generateSistersSay(score: number): string {
  if (score >= 85) return SISTERS_SAY.excellent;
  if (score >= 70) return SISTERS_SAY.good;
  if (score >= 50) return SISTERS_SAY.moderate;
  if (score >= 30) return SISTERS_SAY.caution;
  return SISTERS_SAY.warning;
}
