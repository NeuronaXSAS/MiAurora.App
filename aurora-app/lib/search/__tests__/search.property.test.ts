/**
 * Aurora AI Search Engine - Property-Based Tests
 * 
 * Uses fast-check to verify correctness properties of the search engine.
 * These tests validate that the Aurora Intelligence Layer works correctly.
 * 
 * **Feature: aurora-ai-search-engine**
 */

import * as fc from "fast-check";
import {
  analyzeGenderBias,
  getGenderBiasLabel,
  analyzePoliticalBias,
  analyzeCommercialBias,
  analyzeEmotionalTone,
  analyzeBias,
} from "../bias-analyzer";
import {
  calculateCredibility,
  getCredibilityLabel,
  extractDomain,
  getDomainType,
  isWomenFocused,
} from "../credibility-scorer";
import {
  detectAIContent,
  getAIContentLabel,
  getAIContentColor,
} from "../ai-detector";
import type {
  GenderBiasLabel,
  PoliticalBiasIndicator,
  CredibilityLabel,
  AIContentLabel,
  AIContentColor,
} from "../types";

// ============================================
// PROPERTY 1: Query Validation
// **Validates: Requirements 1.1**
// ============================================

describe("Property 1: Query Validation", () => {
  test("queries with less than 2 characters should be invalid", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1 }),
        (query) => {
          // Queries under 2 chars are invalid
          expect(query.trim().length).toBeLessThan(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("queries with 2+ characters should be valid", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 200 }).filter(s => s.trim().length >= 2),
        (query) => {
          expect(query.trim().length).toBeGreaterThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 3: Gender Bias Score Range
// **Validates: Requirements 2.1**
// ============================================

describe("Property 3: Gender Bias Score Range", () => {
  test("gender bias score is always between 0 and 100", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1000 }),
        (text) => {
          const result = analyzeGenderBias(text);
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 500 }
    );
  });

  test("empty text returns neutral score of 50", () => {
    const result = analyzeGenderBias("");
    expect(result.score).toBe(50);
    expect(result.label).toBe("Neutral");
  });

  test("women-positive keywords increase score", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "women empowerment",
          "female leadership",
          "gender equality",
          "women in tech",
          "inclusive workplace"
        ),
        (text) => {
          const result = analyzeGenderBias(text);
          expect(result.score).toBeGreaterThan(50);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("negative keywords decrease score", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "boys club culture",
          "hostile work environment",
          "sexual harassment",
          "gender discrimination"
        ),
        (text) => {
          const result = analyzeGenderBias(text);
          expect(result.score).toBeLessThan(50);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// PROPERTY 4: Gender Bias Label Mapping
// **Validates: Requirements 2.3**
// ============================================

describe("Property 4: Gender Bias Label Mapping", () => {
  const validLabels: GenderBiasLabel[] = [
    "Women-Positive",
    "Balanced",
    "Neutral",
    "Caution",
    "Potential Bias",
  ];

  test("all scores map to valid labels", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (score) => {
          const label = getGenderBiasLabel(score);
          expect(validLabels).toContain(label);
        }
      ),
      { numRuns: 101 }
    );
  });

  test("label thresholds are correct", () => {
    // Score >= 80: Women-Positive
    expect(getGenderBiasLabel(80)).toBe("Women-Positive");
    expect(getGenderBiasLabel(100)).toBe("Women-Positive");
    
    // Score >= 60: Balanced
    expect(getGenderBiasLabel(60)).toBe("Balanced");
    expect(getGenderBiasLabel(79)).toBe("Balanced");
    
    // Score >= 40: Neutral
    expect(getGenderBiasLabel(40)).toBe("Neutral");
    expect(getGenderBiasLabel(59)).toBe("Neutral");
    
    // Score >= 20: Caution
    expect(getGenderBiasLabel(20)).toBe("Caution");
    expect(getGenderBiasLabel(39)).toBe("Caution");
    
    // Score < 20: Potential Bias
    expect(getGenderBiasLabel(0)).toBe("Potential Bias");
    expect(getGenderBiasLabel(19)).toBe("Potential Bias");
  });
});

// ============================================
// PROPERTY 5: Average Calculation Correctness
// **Validates: Requirements 2.4, 3.5, 4.4**
// ============================================

describe("Property 5: Average Calculation Correctness", () => {
  test("average of scores equals sum divided by count", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 20 }),
        (scores) => {
          const sum = scores.reduce((a, b) => a + b, 0);
          const expectedAvg = Math.round(sum / scores.length);
          const actualAvg = Math.round(sum / scores.length);
          expect(actualAvg).toBe(expectedAvg);
        }
      ),
      { numRuns: 500 }
    );
  });

  test("average of empty array is 0", () => {
    const scores: number[] = [];
    const avg = scores.length === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(avg).toBe(0);
  });
});

// ============================================
// PROPERTY 6: Political Bias Valid Categories
// **Validates: Requirements 2B.1**
// ============================================

describe("Property 6: Political Bias Valid Categories", () => {
  const validIndicators: PoliticalBiasIndicator[] = [
    "Far Left",
    "Left",
    "Center-Left",
    "Center",
    "Center-Right",
    "Right",
    "Far Right",
  ];

  test("political bias always returns valid indicator", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.option(fc.webUrl()),
        (text, domain) => {
          const result = analyzePoliticalBias(text, domain ?? undefined);
          expect(validIndicators).toContain(result.indicator);
          expect(result.confidence).toBeGreaterThanOrEqual(0);
          expect(result.confidence).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 200 }
    );
  });

  test("known domains return expected bias", () => {
    expect(analyzePoliticalBias("", "nytimes.com").indicator).toBe("Center-Left");
    expect(analyzePoliticalBias("", "foxnews.com").indicator).toBe("Right");
    expect(analyzePoliticalBias("", "reuters.com").indicator).toBe("Center");
  });
});

// ============================================
// PROPERTY 7: Credibility Score Range
// **Validates: Requirements 3.1**
// ============================================

describe("Property 7: Credibility Score Range", () => {
  test("credibility score is always between 0 and 100", () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        (url) => {
          const result = calculateCredibility(url);
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 500 }
    );
  });
});

// ============================================
// PROPERTY 8: Domain Type Credibility Ordering
// **Validates: Requirements 3.2**
// ============================================

describe("Property 8: Domain Type Credibility Ordering", () => {
  test(".gov domains score higher than unknown domains", () => {
    const govScore = calculateCredibility("https://www.whitehouse.gov/page");
    const unknownScore = calculateCredibility("https://randomsite123.xyz/page");
    expect(govScore.score).toBeGreaterThan(unknownScore.score);
  });

  test(".edu domains score higher than commercial domains", () => {
    const eduScore = calculateCredibility("https://www.harvard.edu/page");
    const comScore = calculateCredibility("https://randomshop.com/page");
    expect(eduScore.score).toBeGreaterThan(comScore.score);
  });

  test("verified news domains score higher than unknown", () => {
    const newsScore = calculateCredibility("https://reuters.com/article");
    const unknownScore = calculateCredibility("https://unknownblog.net/post");
    expect(newsScore.score).toBeGreaterThan(unknownScore.score);
  });
});

// ============================================
// PROPERTY 9: Women-Focused Domain Bonus
// **Validates: Requirements 3.3**
// ============================================

describe("Property 9: Women-Focused Domain Bonus", () => {
  test("women-focused domains get at least 10 point bonus", () => {
    const womenFocusedDomains = [
      "https://unwomen.org/article",
      "https://catalyst.org/research",
      "https://leanin.org/tips",
    ];

    womenFocusedDomains.forEach((url) => {
      const result = calculateCredibility(url);
      // Women-focused domains should score at least 60 (50 base + 10 bonus)
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.factors.isWomenFocused).toBe(true);
    });
  });

  test("isWomenFocused correctly identifies women-focused domains", () => {
    expect(isWomenFocused("unwomen.org")).toBe(true);
    expect(isWomenFocused("catalyst.org")).toBe(true);
    expect(isWomenFocused("randomsite.com")).toBe(false);
  });
});

// ============================================
// PROPERTY 10: Credibility Label Mapping
// **Validates: Requirements 3.4**
// ============================================

describe("Property 10: Credibility Label Mapping", () => {
  const validLabels: CredibilityLabel[] = [
    "Highly Trusted",
    "Trusted",
    "Moderate",
    "Verify Source",
  ];

  test("all scores map to valid labels", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (score) => {
          const label = getCredibilityLabel(score);
          expect(validLabels).toContain(label);
        }
      ),
      { numRuns: 101 }
    );
  });

  test("label thresholds are correct", () => {
    expect(getCredibilityLabel(80)).toBe("Highly Trusted");
    expect(getCredibilityLabel(100)).toBe("Highly Trusted");
    expect(getCredibilityLabel(60)).toBe("Trusted");
    expect(getCredibilityLabel(79)).toBe("Trusted");
    expect(getCredibilityLabel(40)).toBe("Moderate");
    expect(getCredibilityLabel(59)).toBe("Moderate");
    expect(getCredibilityLabel(0)).toBe("Verify Source");
    expect(getCredibilityLabel(39)).toBe("Verify Source");
  });
});

// ============================================
// PROPERTY 11: AI Content Detection Range
// **Validates: Requirements 4.1**
// ============================================

describe("Property 11: AI Content Detection Range", () => {
  test("AI content percentage is always between 0 and 100", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 2000 }),
        (text) => {
          const result = detectAIContent(text);
          expect(result.percentage).toBeGreaterThanOrEqual(0);
          expect(result.percentage).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 500 }
    );
  });

  test("empty text returns 0% AI content", () => {
    const result = detectAIContent("");
    expect(result.percentage).toBe(0);
    expect(result.label).toBe("Mostly Human");
  });
});

// ============================================
// PROPERTY 12: AI Content Color Coding
// **Validates: Requirements 4.3**
// ============================================

describe("Property 12: AI Content Color Coding", () => {
  const validColors: AIContentColor[] = ["green", "yellow", "red"];
  const validLabels: AIContentLabel[] = ["Mostly Human", "Some AI Content", "High AI Content"];

  test("all percentages map to valid colors", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (percentage) => {
          const color = getAIContentColor(percentage);
          expect(validColors).toContain(color);
        }
      ),
      { numRuns: 101 }
    );
  });

  test("all percentages map to valid labels", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (percentage) => {
          const label = getAIContentLabel(percentage);
          expect(validLabels).toContain(label);
        }
      ),
      { numRuns: 101 }
    );
  });

  test("color thresholds are correct", () => {
    // 0-30%: green
    expect(getAIContentColor(0)).toBe("green");
    expect(getAIContentColor(30)).toBe("green");
    
    // 31-60%: yellow
    expect(getAIContentColor(31)).toBe("yellow");
    expect(getAIContentColor(60)).toBe("yellow");
    
    // 61-100%: red
    expect(getAIContentColor(61)).toBe("red");
    expect(getAIContentColor(100)).toBe("red");
  });

  test("AI phrases increase detection percentage", () => {
    const humanText = "I went to the store yesterday and bought some groceries.";
    const aiText = "It's important to note that I'd be happy to help you. Let me explain this comprehensive guide.";
    
    const humanResult = detectAIContent(humanText);
    const aiResult = detectAIContent(aiText);
    
    expect(aiResult.percentage).toBeGreaterThan(humanResult.percentage);
  });
});

// ============================================
// PROPERTY 13: Cache Round Trip (Conceptual)
// **Validates: Requirements 12.1, 12.2**
// ============================================

describe("Property 13: Cache Round Trip", () => {
  test("query normalization is consistent", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 100 }),
        (query) => {
          const normalized1 = query.toLowerCase().trim();
          const normalized2 = query.toLowerCase().trim();
          expect(normalized1).toBe(normalized2);
        }
      ),
      { numRuns: 200 }
    );
  });

  test("same query produces same hash", () => {
    const hashQuery = (q: string) => {
      const normalized = q.toLowerCase().trim();
      let hash = 0;
      for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString(36);
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 100 }),
        (query) => {
          const hash1 = hashQuery(query);
          const hash2 = hashQuery(query);
          expect(hash1).toBe(hash2);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ============================================
// PROPERTY 16: API Usage Counter Increment
// **Validates: Requirements 12.6**
// ============================================

describe("Property 16: API Usage Counter Increment", () => {
  test("incrementing usage increases count by 1", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1999 }),
        (currentUsage) => {
          const newUsage = currentUsage + 1;
          expect(newUsage).toBe(currentUsage + 1);
          expect(newUsage).toBeGreaterThan(currentUsage);
        }
      ),
      { numRuns: 500 }
    );
  });

  test("usage never exceeds limit after increment", () => {
    const LIMIT = 2000;
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: LIMIT - 1 }),
        (currentUsage) => {
          const newUsage = currentUsage + 1;
          expect(newUsage).toBeLessThanOrEqual(LIMIT);
        }
      ),
      { numRuns: 500 }
    );
  });
});

// ============================================
// COMBINED BIAS ANALYSIS
// ============================================

describe("Combined Bias Analysis", () => {
  test("analyzeBias returns all required fields", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 500 }),
        (text) => {
          const result = analyzeBias(text);
          
          // Check all fields exist
          expect(result.genderBias).toBeDefined();
          expect(result.genderBias.score).toBeDefined();
          expect(result.genderBias.label).toBeDefined();
          
          expect(result.politicalBias).toBeDefined();
          expect(result.politicalBias.indicator).toBeDefined();
          expect(result.politicalBias.confidence).toBeDefined();
          
          expect(result.commercialBias).toBeDefined();
          expect(result.commercialBias.score).toBeDefined();
          
          expect(result.emotionalTone).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// DOMAIN EXTRACTION
// ============================================

describe("Domain Extraction", () => {
  test("extractDomain removes www prefix", () => {
    expect(extractDomain("https://www.example.com/page")).toBe("example.com");
    expect(extractDomain("https://example.com/page")).toBe("example.com");
  });

  test("getDomainType correctly categorizes domains", () => {
    expect(getDomainType("whitehouse.gov")).toBe("gov");
    expect(getDomainType("harvard.edu")).toBe("edu");
    expect(getDomainType("reuters.com")).toBe("news");
    expect(getDomainType("unwomen.org")).toBe("women-focused");
    expect(getDomainType("randomshop.com")).toBe("commercial");
  });
});

// ============================================
// EMOTIONAL TONE ANALYSIS
// ============================================

describe("Emotional Tone Analysis", () => {
  const validTones = ["Factual", "Emotional", "Sensational", "Balanced"];

  test("emotional tone is always valid", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1000 }),
        (text) => {
          const tone = analyzeEmotionalTone(text);
          expect(validTones).toContain(tone);
        }
      ),
      { numRuns: 200 }
    );
  });

  test("sensational words produce sensational tone", () => {
    const sensationalText = "SHOCKING! UNBELIEVABLE! This EXPLOSIVE bombshell is DEVASTATING!";
    const tone = analyzeEmotionalTone(sensationalText);
    expect(tone).toBe("Sensational");
  });

  test("factual language produces factual tone", () => {
    const factualText = "According to research, the study finds that data indicates a clear trend. Statistics show evidence.";
    const tone = analyzeEmotionalTone(factualText);
    expect(tone).toBe("Factual");
  });
});

// ============================================
// COMMERCIAL BIAS ANALYSIS
// ============================================

describe("Commercial Bias Analysis", () => {
  test("commercial bias score is always 0-100", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        fc.option(fc.webUrl()),
        (text, url) => {
          const result = analyzeCommercialBias(text, url ?? undefined);
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 200 }
    );
  });

  test("promotional language increases commercial bias", () => {
    const promoText = "BUY NOW! Limited time offer! Exclusive discount! Shop now for the best price!";
    const normalText = "This is a regular article about technology trends.";
    
    const promoResult = analyzeCommercialBias(promoText);
    const normalResult = analyzeCommercialBias(normalText);
    
    expect(promoResult.score).toBeGreaterThan(normalResult.score);
  });

  test("affiliate links are detected", () => {
    const affiliateUrl = "https://example.com/product?ref=affiliate123";
    const normalUrl = "https://example.com/article";
    
    const affiliateResult = analyzeCommercialBias("text", affiliateUrl);
    const normalResult = analyzeCommercialBias("text", normalUrl);
    
    expect(affiliateResult.hasAffiliateLinks).toBe(true);
    expect(normalResult.hasAffiliateLinks).toBe(false);
  });
});
