# Design Document

## Overview

The Community Truth Score™ system creates a unique differentiator for Aurora Search by combining AI analysis with crowdsourced human perception. This creates a "Rotten Tomatoes for News" experience where users can see both the algorithmic score and what real women think, building trust through transparency.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Aurora Search Results                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │  AI Score   │    │  Community  │    │   Perception Gap    │ │
│  │    🛡️ 78    │ vs │  Score 💜 62 │ => │   ⚡ 16 points     │ │
│  │  (Aurora)   │    │  (Sisters)  │    │  "AI trusts more"   │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Vote: Is this trustworthy?  👍 Trust (234)  👎 Flag (89) │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Vote Recording System (Convex)

```typescript
// Schema: searchVotes table
{
  urlHash: v.string(),        // SHA-256 hash of normalized URL
  sessionHash: v.string(),    // One-way hash of session (not user ID)
  vote: v.union(v.literal("trust"), v.literal("flag")),
  timestamp: v.number(),
  // NO PII stored - completely anonymous
}

// Schema: searchVoteAggregates table (real-time aggregation)
{
  urlHash: v.string(),
  trustCount: v.number(),
  flagCount: v.number(),
  totalVotes: v.number(),
  communityScore: v.number(), // 0-100 calculated score
  lastUpdated: v.number(),
  confidenceLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
}
```

### 2. Anonymous Session Hash Generation

```typescript
// Client-side: Generate anonymous session identifier
function generateAnonymousSessionHash(): string {
  // Combine: random session ID + browser fingerprint subset + timestamp day
  // This allows duplicate prevention without tracking users
  const sessionId = sessionStorage.getItem('aurora-anon-session') || crypto.randomUUID();
  sessionStorage.setItem('aurora-anon-session', sessionId);
  
  // Hash with day granularity - resets daily for extra privacy
  const dayKey = new Date().toISOString().split('T')[0];
  return sha256(`${sessionId}-${dayKey}`);
}

// URL normalization for consistent hashing
function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  // Remove tracking params, normalize protocol, lowercase
  return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
}
```

### 3. Community Score Calculation

```typescript
// Weighted score calculation with anti-manipulation
function calculateCommunityScore(votes: VoteAggregate): CommunityScore {
  const { trustCount, flagCount, totalVotes } = votes;
  
  // Minimum votes for confidence
  if (totalVotes < 5) {
    return { score: null, confidence: 'building', label: 'Building consensus' };
  }
  
  // Base score: percentage of trust votes
  const baseScore = (trustCount / totalVotes) * 100;
  
  // Confidence based on vote count
  const confidence = totalVotes >= 50 ? 'high' : totalVotes >= 15 ? 'medium' : 'low';
  
  return {
    score: Math.round(baseScore),
    confidence,
    totalVotes,
    label: getScoreLabel(baseScore),
  };
}
```

### 4. Perception Gap Visualization

```typescript
interface PerceptionGapProps {
  aiScore: number;
  communityScore: number | null;
  totalVotes: number;
}

// Visual indicators for the gap
const getPerceptionGapIndicator = (aiScore: number, communityScore: number) => {
  const gap = aiScore - communityScore;
  const absGap = Math.abs(gap);
  
  if (absGap < 10) return { type: 'aligned', label: 'AI & Community agree', emoji: '🤝' };
  if (gap > 0) return { type: 'ai-higher', label: 'AI trusts more', emoji: '🤖' };
  return { type: 'community-higher', label: 'Sisters trust more', emoji: '💜' };
};
```

## Data Models

### Vote Record (Anonymous)
```typescript
interface AnonymousVote {
  urlHash: string;      // SHA-256 of normalized URL
  sessionHash: string;  // One-way hash, not reversible to user
  vote: 'trust' | 'flag';
  timestamp: number;
}
```

### Vote Aggregate (Real-time)
```typescript
interface VoteAggregate {
  urlHash: string;
  trustCount: number;
  flagCount: number;
  totalVotes: number;
  communityScore: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  lastUpdated: number;
}
```

### Community Truth Display
```typescript
interface CommunityTruthDisplay {
  aiScore: TrustScoreResult;
  communityScore: CommunityScore | null;
  perceptionGap: PerceptionGap | null;
  userVote: 'trust' | 'flag' | null;
  canVote: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Vote Anonymity Preservation
*For any* vote record stored in the database, there SHALL be no way to reverse the sessionHash to identify the original user or session.
**Validates: Requirements 3.1, 3.2, 3.4**

### Property 2: Duplicate Vote Prevention
*For any* combination of URL and session, the system SHALL allow at most one vote, preventing the same session from voting multiple times on the same result.
**Validates: Requirements 1.4, 4.1**

### Property 3: Score Calculation Consistency
*For any* set of votes on a URL, the Community Score SHALL equal (trustCount / totalVotes) * 100, rounded to the nearest integer.
**Validates: Requirements 2.1, 4.3**

### Property 4: Real-time Update Propagation
*For any* new vote recorded, all users viewing that search result SHALL see the updated Community Score within 2 seconds.
**Validates: Requirements 1.3, 2.1**

### Property 5: Rate Limiting Enforcement
*For any* session, the system SHALL reject votes exceeding 30 per hour, returning an appropriate error message.
**Validates: Requirements 4.1**

### Property 6: Minimum Vote Threshold
*For any* URL with fewer than 5 votes, the system SHALL display "Building consensus" instead of a numeric Community Score.
**Validates: Requirements 2.5**

## Error Handling

1. **Vote Submission Failure**: Show toast "Vote saved locally, syncing..." and retry with exponential backoff
2. **Rate Limit Exceeded**: Show friendly message "You're voting fast! Take a breath 💜"
3. **Network Error**: Queue vote locally, sync when connection restored
4. **Invalid URL**: Skip community voting for malformed URLs

## Testing Strategy

### Unit Tests
- URL normalization produces consistent hashes
- Score calculation matches expected values
- Rate limiting correctly blocks excess votes

### Property-Based Tests
- Anonymity: No PII in any stored vote record
- Consistency: Score always matches vote counts
- Idempotency: Duplicate votes don't change totals

### Integration Tests
- Real-time updates propagate to all clients
- Votes persist across page refreshes
- Session hash remains stable within a day

## Security Considerations

1. **No PII Storage**: Only hashes stored, never user IDs or IPs
2. **One-Way Hashing**: SHA-256 with salt, cannot be reversed
3. **Rate Limiting**: Prevents spam and manipulation
4. **Temporal Smoothing**: Sudden vote spikes are dampened
5. **Session Isolation**: Each browser session gets unique hash
6. **Daily Reset**: Session hashes rotate daily for extra privacy

