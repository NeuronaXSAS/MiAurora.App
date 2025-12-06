# Requirements Document

## Introduction

Aurora App's Community Truth Score™ is an innovative feature that allows women to vote on search results, creating a real-time comparison between AI predictions and human perception. This crowdsourced intelligence system builds trust through transparency while maintaining full privacy and security for all users.

## Glossary

- **Community Truth Score**: Aggregated human votes on search result trustworthiness
- **AI Score**: Aurora's automated Trust Score based on bias analysis, credibility, and AI detection
- **Perception Gap**: The difference between AI Score and Community Truth Score
- **Anonymous Vote**: A vote that cannot be traced back to any individual user
- **Vote Hash**: Cryptographic hash used to prevent duplicate voting without storing user identity

## Requirements

### Requirement 1

**User Story:** As a woman searching for information, I want to vote on whether a search result is trustworthy, so that I can contribute to community intelligence and help other women.

#### Acceptance Criteria

1. WHEN a user views a search result THEN the system SHALL display voting buttons (👍 Trustworthy / 👎 Misleading) with a minimum touch target of 44x44px
2. WHEN a user clicks a vote button THEN the system SHALL record the vote anonymously using a one-way hash of the URL and session
3. WHEN a vote is recorded THEN the system SHALL update the Community Truth Score in real-time for all users viewing that result
4. WHEN a user has already voted on a result THEN the system SHALL display their vote selection and prevent duplicate voting
5. WHEN displaying vote counts THEN the system SHALL show total votes and percentage breakdown

### Requirement 2

**User Story:** As a woman using Aurora Search, I want to see how AI predictions compare to community perception, so that I can make informed decisions about which sources to trust.

#### Acceptance Criteria

1. WHEN displaying a search result with community votes THEN the system SHALL show both AI Score and Community Truth Score side-by-side
2. WHEN there is a significant gap (>15 points) between AI and Community scores THEN the system SHALL highlight this as a "Perception Gap" indicator
3. WHEN AI Score is higher than Community Score THEN the system SHALL display "AI trusts more than community" indicator
4. WHEN Community Score is higher than AI Score THEN the system SHALL display "Community trusts more than AI" indicator
5. WHEN a result has fewer than 5 votes THEN the system SHALL display "Building consensus" instead of Community Score

### Requirement 3

**User Story:** As a woman concerned about privacy, I want my votes to be completely anonymous, so that I can contribute without fear of being tracked or identified.

#### Acceptance Criteria

1. WHEN recording a vote THEN the system SHALL NOT store any personally identifiable information (PII)
2. WHEN generating vote identifiers THEN the system SHALL use a one-way cryptographic hash that cannot be reversed
3. WHEN a user is not logged in THEN the system SHALL still allow voting using session-based anonymous identification
4. WHEN storing vote data THEN the system SHALL only store: URL hash, vote value, timestamp, and anonymous session hash
5. WHEN querying vote data THEN the system SHALL never expose individual vote records, only aggregated statistics

### Requirement 4

**User Story:** As a platform administrator, I want to prevent vote manipulation and spam, so that the Community Truth Score remains accurate and trustworthy.

#### Acceptance Criteria

1. WHEN a vote is submitted THEN the system SHALL implement rate limiting (max 30 votes per session per hour)
2. WHEN detecting suspicious voting patterns THEN the system SHALL flag votes for review without blocking legitimate users
3. WHEN calculating Community Score THEN the system SHALL use weighted averaging that reduces impact of outlier voting sessions
4. WHEN a URL receives sudden vote spikes THEN the system SHALL apply temporal smoothing to prevent manipulation
5. WHEN displaying scores THEN the system SHALL show confidence level based on vote count and distribution

### Requirement 5

**User Story:** As a woman viewing search results, I want to see a beautiful visual comparison of AI vs Community scores, so that I can quickly understand the trustworthiness landscape.

#### Acceptance Criteria

1. WHEN displaying the comparison THEN the system SHALL show a dual-bar or gauge visualization with Aurora brand colors
2. WHEN animating score updates THEN the system SHALL use smooth transitions (300ms) with Aurora's feminine design language
3. WHEN showing the Perception Gap THEN the system SHALL use a gradient indicator from Aurora Purple to Aurora Pink
4. WHEN displaying vote buttons THEN the system SHALL use warm, inviting colors with subtle hover animations
5. WHEN a user votes THEN the system SHALL show a celebration micro-animation with hearts/sparkles

### Requirement 6

**User Story:** As a woman using Aurora Search, I want to see trending perception gaps, so that I can discover topics where AI and humans disagree.

#### Acceptance Criteria

1. WHEN displaying search results THEN the system SHALL optionally show "Hot Debates" section with largest perception gaps
2. WHEN a topic has high engagement THEN the system SHALL display "Sisters are discussing this" indicator
3. WHEN showing trending items THEN the system SHALL display vote velocity (votes per hour) as engagement indicator
4. WHEN filtering results THEN the system SHALL allow sorting by "Most Debated" (largest perception gap)

