# Requirements Document - Aurora App UI/UX & Functionality Improvements

## Introduction

This specification addresses critical improvements needed across Aurora App to align with brand identity, fix broken functionality, and enhance user experience. The improvements span branding consistency, navigation, page designs, and backend fixes.

## Glossary

- **Aurora App**: The women's safety and community platform
- **Sidebar**: Main navigation component on desktop and mobile
- **Feed**: Social content stream showing posts, routes, and community updates
- **Mapbox**: Map service provider for route visualization
- **Convex**: Backend database and real-time data platform
- **Theme**: Light/dark mode visual appearance

## Requirements

### Requirement 1: Fix Critical Backend Errors

**User Story:** As a user, I want all pages to load without errors, so that I can access all features of Aurora App.

#### Acceptance Criteria

1. WHEN a user visits /health THEN the system SHALL load the page without cycleTracker query errors
2. WHEN a user visits /profile THEN the system SHALL load the page without hydration query errors
3. WHEN a user visits /assistant THEN the system SHALL successfully send and receive chat messages
4. WHEN a user visits /live THEN the system SHALL handle Agora token generation gracefully
5. WHEN a user visits /reels/create THEN the system SHALL generate upload credentials correctly

### Requirement 2: Brand Identity Consistency

**User Story:** As a user, I want consistent Aurora App branding across all pages, so that I have a cohesive visual experience.

#### Acceptance Criteria

1. THE system SHALL use Aurora App official color palette on all pages (no white backgrounds)
2. THE system SHALL display the Aurora App logo correctly in the sidebar on both desktop and mobile
3. WHEN in dark mode THEN the system SHALL use Aurora Violet (#3d0d73) as primary background
4. WHEN in light mode THEN the system SHALL use Aurora Cream (#fffaf1) as primary background
5. THE system SHALL ensure all text has proper contrast ratios in both themes

### Requirement 3: Navigation Improvements

**User Story:** As a user, I want intuitive navigation that works consistently across devices, so that I can easily access all features.

#### Acceptance Criteria

1. WHEN on mobile THEN the system SHALL display a hamburger menu on the LEFT side of the screen
2. WHEN on mobile THEN the system SHALL maintain the bottom navigation with the "+" button for creating posts
3. WHEN on desktop THEN the system SHALL display a fixed sidebar with Aurora App branding
4. THE sidebar SHALL be consistent across all authenticated views

### Requirement 4: Mapbox Route Visualization

**User Story:** As a user, I want to see route maps with drawn paths, so that I can visualize safety routes.

#### Acceptance Criteria

1. WHEN viewing a route post in the feed THEN the system SHALL display the Mapbox map with the route drawn
2. WHEN viewing /routes/discover THEN the system SHALL show route previews with Mapbox maps
3. WHEN viewing a specific route (/routes/[routeId]) THEN the system SHALL display the full route on Mapbox
4. WHEN a route is shared THEN the system SHALL display distance (km) and duration (minutes)
5. THE system SHALL use the configured Mapbox style consistently across all map views

### Requirement 5: Avatar System Improvements

**User Story:** As a user, I want feminine, adult-looking avatars, so that the platform feels appropriate for women.

#### Acceptance Criteria

1. THE avatar system SHALL generate feminine, adult-looking avatars (not childlike)
2. THE avatar customization SHALL include feminine hairstyles, earrings, and accessories
3. WHEN in onboarding THEN the system SHALL display the Aurora App logo
4. THE onboarding form SHALL use Aurora App brand colors

### Requirement 6: Page Design Improvements

**User Story:** As a user, I want all pages to have beautiful, consistent designs, so that I enjoy using the app.

#### Acceptance Criteria

1. THE /legal/privacy page SHALL have proper text contrast and be readable
2. THE /legal/terms page SHALL have proper text contrast and be readable
3. THE /credits page SHALL use Aurora App brand colors with proper contrast
4. THE /settings page SHALL have proper contrast in light theme
5. THE /intelligence page SHALL have an improved, branded design
6. THE /messages page SHALL have an improved, branded design
7. THE /opportunities page SHALL have an improved, branded design
8. THE /routes page SHALL have an improved design with route previews
9. THE /routes/track page SHALL be responsive on mobile without overlapping bottom navigation

### Requirement 7: Theme Toggle Improvements

**User Story:** As a user, I want a clear theme toggle with proper icons, so that I can switch between light and dark modes.

#### Acceptance Criteria

1. THE theme toggle button SHALL display a sun icon for light mode
2. THE theme toggle button SHALL display a moon icon for dark mode
3. WHEN switching themes THEN the system SHALL apply changes immediately

### Requirement 8: Feed Engagement Improvements

**User Story:** As a user, I want an engaging, fun feed experience, so that I enjoy interacting with the community.

#### Acceptance Criteria

1. THE feed SHALL display route posts with Mapbox previews showing the drawn route
2. THE feed SHALL show distance and duration for route posts
3. THE post creation menus SHALL have beautiful, animated appearances
4. THE post creation SHALL support photo capture and file attachments
5. THE feed SHALL have proper contrast for post text in dark mode

### Requirement 9: AI Assistant Functionality

**User Story:** As a user, I want a working AI chat assistant, so that I can get support and insights.

#### Acceptance Criteria

1. WHEN sending a message to the assistant THEN the system SHALL process and respond without errors
2. THE Voice Companion feature SHALL be marked as premium-only
3. THE Voice Companion panel SHALL be designed and ready for API integration
4. THE text chat SHALL provide mental health metrics and insights

### Requirement 10: Live Streaming & Reels

**User Story:** As a user, I want working live streaming and reels features, so that I can create and share content.

#### Acceptance Criteria

1. WHEN starting a livestream THEN the system SHALL handle Agora token generation gracefully
2. IF Agora is not configured THEN the system SHALL show a friendly "coming soon" message
3. WHEN creating a reel THEN the system SHALL generate upload credentials correctly
4. IF upload fails THEN the system SHALL show a helpful error message

### Requirement 11: Performance Optimization

**User Story:** As a user on a slow connection or old device, I want Aurora App to work smoothly, so that I can access safety features regardless of my device or network.

#### Acceptance Criteria

1. THE system SHALL load critical content (navigation, panic button) within 3 seconds on slow 3G connections
2. THE system SHALL display skeleton screens immediately while content loads
3. THE system SHALL use progressive loading (critical content first, ads last)
4. THE system SHALL cache safety features for offline access
5. THE system SHALL adapt image quality based on connection speed
6. THE system SHALL virtualize long lists (feed, messages) to reduce memory usage
7. THE initial bundle size SHALL be less than 150KB gzipped

### Requirement 12: Non-Disruptive Advertising

**User Story:** As a user, I want to see relevant ads without them interrupting my experience, so that Aurora App can be sustainable while I enjoy using it.

#### Acceptance Criteria

1. THE system SHALL display native ads that match the feed card design
2. THE system SHALL show ads only every 5th post in the feed
3. THE system SHALL NEVER show ads in emergency, safety, or health features
4. THE system SHALL NEVER show ads during onboarding
5. WHEN a user is premium THEN the system SHALL show no ads
6. THE system SHALL load ads AFTER main content is interactive
7. THE system SHALL offer optional rewarded ads (watch ad for credits)

### Requirement 13: Virtual Gifts & Donations System

**User Story:** As a user, I want to send virtual gifts to creators I appreciate, so that I can support them financially while enjoying beautiful animations.

#### Acceptance Criteria

1. THE system SHALL allow users to purchase Aurora Gems via Stripe
2. THE system SHALL offer gem packages with bonus gems for larger purchases
3. THE system SHALL provide feminine-themed virtual gifts (hearts, flowers, jewelry, crowns)
4. WHEN a user sends a gift THEN the system SHALL display a beautiful animation
5. THE system SHALL split gift revenue 80% to creator, 20% to Aurora App
6. WHEN a creator receives a gift THEN the system SHALL notify them in real-time
7. THE system SHALL allow creators to withdraw earnings via Stripe Connect
8. THE minimum withdrawal amount SHALL be $10

### Requirement 14: Feed Engagement System

**User Story:** As a user, I want an engaging, Reddit-like feed experience, so that I can discover content, interact with the community, and support creators.

#### Acceptance Criteria

1. THE feed SHALL support infinite scroll with virtualization for performance
2. THE feed SHALL display upvotes, downvotes, comments, shares, and gifts received
3. THE system SHALL support threaded comments (Reddit-style nesting)
4. THE system SHALL allow quick actions via swipe gestures on mobile
5. THE feed SHALL update in real-time when new posts are created
6. THE system SHALL reward quality engagement with credits
7. THE system SHALL display gift leaderboards (top gifters, top creators)

### Requirement 15: Livestream & Reels Monetization

**User Story:** As a creator, I want to receive gifts during my livestreams and on my reels, so that I can earn money from my content.

#### Acceptance Criteria

1. WHEN viewing a livestream THEN the system SHALL display a gift button
2. WHEN a gift is sent during livestream THEN the system SHALL show the animation to all viewers
3. THE system SHALL display a live gift counter during streams
4. WHEN viewing a reel THEN the system SHALL allow sending gifts
5. THE system SHALL show total gifts received on each reel

### Requirement 16: Geospatial Content Map

**User Story:** As a user, I want to explore content on a map, so that I can discover posts, reels, routes, and opportunities by location.

#### Acceptance Criteria

1. THE system SHALL display all georeferenced content on the Aurora Map
2. THE system SHALL use clustering to prevent crowded/overlapping points
3. WHEN zooming in THEN the system SHALL progressively reveal individual points
4. WHEN tapping a map point THEN the system SHALL show a content preview popup
5. THE system SHALL use distinct markers for each content type (posts, reels, routes, opportunities, livestreams)
6. WHEN viewing a route on map THEN the system SHALL draw the actual path
7. THE system SHALL allow filtering map content by type, time range, and rating
8. THE system SHALL load content progressively based on visible map area

### Requirement 17: Map Design & Performance

**User Story:** As a user, I want a beautiful, fast map experience, so that I can explore content without lag or visual clutter.

#### Acceptance Criteria

1. THE map SHALL use the Aurora App custom Mapbox style
2. THE map SHALL cluster points at zoom levels 0-14 to prevent crowding
3. THE map SHALL show individual points only at zoom level 15+
4. THE map SHALL load content within 2 seconds of panning/zooming
5. THE map SHALL display live content (livestreams) with pulsing markers
6. THE map SHALL show safety heatmap as an optional layer

