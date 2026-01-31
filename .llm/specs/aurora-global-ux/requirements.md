# Requirements Document

## Introduction

This specification covers making Aurora App truly global and improving user experience across the platform. The focus is on:
1. Full internationalization (i18n) system with zero external costs
2. Onboarding flow optimization to reduce friction
3. Google AdSense integration for monetization
4. Desktop feed layout improvements to compete with Reddit/YouTube
5. Enhanced AI search with video support and Aurora personality
6. Unified search experience (web + Aurora App content)
7. Meaningful, actionable bias metrics

**CRITICAL CONSTRAINT:** All changes must preserve existing Aurora App branding, design system, and working features. Only improve what is necessary to scale correctly. No breaking changes to the current codebase.

## Glossary

- **i18n**: Internationalization - the process of designing software to support multiple languages
- **Locale**: A combination of language and regional settings (e.g., es-CO for Spanish Colombia)
- **Translation Key**: A unique identifier for a translatable string
- **RTL**: Right-to-left text direction (for Arabic, Hebrew)
- **AdSense**: Google's advertising platform for website monetization
- **Onboarding**: The process of introducing new users to the platform

## Requirements

### Requirement 1

**User Story:** As a non-English speaking user, I want the entire Aurora App interface translated to my language, so that I can use all features without language barriers.

#### Acceptance Criteria

1. WHEN a user selects a language from the language switcher THEN the system SHALL translate all UI text including navigation, buttons, labels, and messages to the selected language
2. WHEN a user's browser language is detected THEN the system SHALL automatically suggest that language if supported
3. WHEN a translation key is missing for a language THEN the system SHALL fall back to English without breaking the UI
4. WHEN a user changes language THEN the system SHALL persist the preference in localStorage and user profile (if authenticated)
5. THE system SHALL support at minimum: English, Spanish, Portuguese, French, German, Arabic (RTL), Hindi, Chinese
6. WHEN Arabic or other RTL language is selected THEN the system SHALL apply RTL layout direction to the entire interface

### Requirement 2

**User Story:** As a new user, I want a streamlined onboarding experience, so that I can start using Aurora App quickly without excessive scrolling or confusion.

#### Acceptance Criteria

1. WHEN the avatar creator dialog opens THEN the system SHALL display the avatar preview centered horizontally within its container
2. THE system SHALL remove the non-functional freckles option from the avatar creator
3. WHEN the onboarding shows the avatar step THEN the system SHALL display example avatars instead of a generic heart icon to visually connect users to the feature
4. WHEN the "Tell us about yourself" step loads THEN the system SHALL provide an auto-detect location button using browser geolocation API
5. WHEN a user clicks the auto-detect location button THEN the system SHALL request geolocation permission and populate the location field with city/country
6. THE system SHALL explain that sharing location helps the safety intelligence community but is optional
7. WHEN a user selects privacy settings in onboarding THEN the system SHALL apply those settings as defaults for all future posts

### Requirement 3

**User Story:** As the platform owner, I want Google AdSense ads displayed on the landing page and feed, so that Aurora App can generate revenue to sustain operations.

#### Acceptance Criteria

1. WHEN the landing page loads THEN the system SHALL display AdSense ad units in designated non-intrusive positions
2. WHEN the feed page loads THEN the system SHALL display AdSense ad units between content items at appropriate intervals
3. THE system SHALL ensure ad placements comply with Google AdSense policies (no deceptive placement, proper labeling)
4. WHEN ads fail to load THEN the system SHALL gracefully hide the ad container without breaking layout
5. THE system SHALL implement responsive ad units that adapt to mobile and desktop viewports

### Requirement 4

**User Story:** As a desktop user, I want a professional feed layout comparable to Reddit and YouTube, so that I can efficiently browse content with proper use of screen space.

#### Acceptance Criteria

1. WHEN viewing the feed on desktop (1024px+) THEN the system SHALL display a three-column layout: left sidebar, main content, right sidebar
2. WHEN viewing the feed on desktop THEN the system SHALL display post cards with consistent spacing and professional typography
3. THE system SHALL display engagement metrics (likes, comments, shares) in a compact horizontal format similar to Reddit
4. WHEN hovering over a post card THEN the system SHALL provide subtle visual feedback without excessive animations
5. THE system SHALL ensure the right sidebar shows relevant widgets (Safety Pulse, Communities, Trending) with proper sticky behavior

### Requirement 5

**User Story:** As a user creating content, I want my privacy settings from onboarding to apply automatically, so that I don't have to configure privacy for each post.

#### Acceptance Criteria

1. WHEN a user creates a new post THEN the system SHALL pre-select the privacy level chosen during onboarding
2. WHEN a user changes privacy settings in profile THEN the system SHALL update the default for future posts
3. THE system SHALL allow users to override the default privacy on individual posts

### Requirement 6

**User Story:** As a user searching in any language, I want AI summaries that respond in my language with Aurora App's supportive personality, so that I feel understood and motivated to use the search engine.

#### Acceptance Criteria

1. WHEN a user performs a search THEN the system SHALL detect the user's language preference from locale settings
2. WHEN generating AI summaries THEN the system SHALL respond in the user's detected language
3. THE AI summary SHALL embody Aurora App's personality: supportive, insightful, empowering, and women-first perspective
4. WHEN providing search insights THEN the system SHALL include actionable advice specific to women's safety and wellbeing
5. THE AI summary SHALL end with an empowering note that motivates continued use of the search engine

### Requirement 7

**User Story:** As a user searching for content, I want to see video results alongside web results, so that I can access multimedia content relevant to my query.

#### Acceptance Criteria

1. WHEN a search query returns video results from Brave Search API THEN the system SHALL display video thumbnails with duration and source
2. WHEN displaying video results THEN the system SHALL show video title, channel/source, view count, and upload date
3. WHEN a user clicks a video result THEN the system SHALL open the video in a new tab or embedded player
4. THE system SHALL prioritize women-focused video content when available

### Requirement 8

**User Story:** As a user, I want a unified search experience that shows both web results and Aurora App community content, so that I can discover everything relevant in one place.

#### Acceptance Criteria

1. WHEN a user searches from the authenticated portal THEN the system SHALL display both web results and Aurora App community content in a unified interface
2. THE system SHALL clearly distinguish between web results and Aurora App community content with visual indicators
3. WHEN Aurora App community content matches the query THEN the system SHALL prioritize showing relevant posts, routes, circles, and opportunities
4. THE unified search SHALL maintain the same bias analysis and credibility scoring for web results

### Requirement 9

**User Story:** As a user viewing search results, I want meaningful and actionable bias metrics, so that I can make informed decisions about the content I consume.

#### Acceptance Criteria

1. WHEN displaying bias metrics THEN the system SHALL provide specific, actionable explanations (not just generic numbers)
2. THE bias analysis SHALL include: gender representation score with explanation, source intent indicator (informational/promotional/opinion), and content freshness
3. WHEN a source has potential bias THEN the system SHALL explain WHY it may be biased (e.g., "This source is funded by X" or "Uses gendered language favoring Y")
4. THE system SHALL provide a "Why this matters" tooltip for each metric explaining its relevance to women
5. WHEN bias is detected THEN the system SHALL suggest alternative sources with better representation

