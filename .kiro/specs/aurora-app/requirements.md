# Requirements Document

## Introduction

Aurora App is a Global Safety Intelligence Platform designed to be "the front page of the internet for women to advance and enjoy life." The platform enables women to share intelligence across multiple life dimensions (professional, social, daily life, travel, financial) and earn credits that unlock real opportunities including jobs, mentorship, resources, and community benefits. 

By combining Reddit-style community engagement with a credit-based incentive system, AI-powered personalization, and systematic data collection, Aurora App creates a flywheel where participation directly benefits each woman's life trajectory while building collective safety and opportunity intelligence. The platform's backend systematically collects, structures, and analyzes mobility patterns, workplace safety scores, and urban risk data to create sustainable business models through B2B/B2G data intelligence and direct monetization.

## Glossary

- **Aurora App**: The complete platform system including web application, database, AI services, and data intelligence infrastructure
- **User**: A woman who has created an account on Aurora App
- **Post**: User-generated content including workplace ratings, safety reports, opportunity listings, or community stories
- **Credit**: Virtual currency earned through platform contributions (creating posts, verifying reports, helping others)
- **Trust Score**: Reputation metric (0-1000) indicating reliability based on verification accuracy and community engagement
- **Contribution**: Any action that adds value to the platform (posting, verifying, commenting, upvoting)
- **Opportunity**: Jobs, mentorship, resources, events, or funding accessible through credit redemption
- **Life Dimension**: Category of content (Professional, Social, Daily Life, Travel, Financial)
- **Verification**: Process where users confirm accuracy of another user's post to build trust
- **Feed**: Personalized stream of posts displayed on the home page
- **AI Assistant**: Conversational interface powered by Google Gemini API for personalized guidance
- **Safety Intelligence**: Aggregated data about safety ratings for locations, workplaces, and spaces
- **Safety Map**: Interactive Mapbox visualization displaying Posts with location data as color-coded markers
- **Heat Map**: Visual overlay showing density of safety reports in geographic areas
- **Safe Route**: Navigation path between two locations optimized for safety based on community Post ratings
- **Marker**: Geographic point on the Safety Map representing a Post with location data
- **Data Intelligence Lake**: Anonymized, structured repository of platform data for B2B/B2G analytics and insights
- **Engagement Event**: Granular user interaction tracked with timestamp, location, duration, and context for analytics
- **Reel**: Short-form video content (15-90 seconds) with metadata extraction for safety categorization
- **Live Stream**: Real-time video broadcast with interactive features including tipping and emergency termination
- **Corporate Safety Index**: Aggregated workplace safety scores derived from user posts and ratings
- **Urban Safety Index**: Geographic safety intelligence derived from route data and location-based posts
- **Aurora Premium**: Subscription tier offering enhanced features and ad-free experience
- **Marketplace**: Platform for women to offer and purchase services with commission-based revenue model
- **Content Moderation Engine**: AI-powered system for automated text, image, and video content review

## Requirements

### Requirement 1

**User Story:** As a new user, I want to quickly create an account and understand the platform's value, so that I can start contributing and accessing opportunities.

#### Acceptance Criteria

1. WHEN a User visits the landing page, THE Aurora App SHALL display the tagline "The front page of the internet for women to advance and enjoy life" with live anonymized activity feed
2. WHEN a User clicks authentication, THE Aurora App SHALL initiate WorkOS SSO flow supporting Google and Microsoft providers
3. WHEN authentication completes successfully, THE Aurora App SHALL create a User profile with zero Credits and zero Trust Score
4. WHEN a new User completes onboarding, THE Aurora App SHALL award 25 bonus Credits
5. WHEN a new User creates their first Contribution, THE Aurora App SHALL award 10 Credits and display success confirmation

### Requirement 2

**User Story:** As a user, I want to view a personalized feed of relevant posts, so that I can discover opportunities and safety information that matters to my life.

#### Acceptance Criteria

1. WHEN a User accesses the home page, THE Aurora App SHALL display a Feed containing Posts ordered by relevance and recency
2. WHEN new Posts are created by other Users, THE Aurora App SHALL update the Feed in real-time without page refresh
3. WHEN a User has profile information (industry, location, career goals), THE Aurora App SHALL personalize the Feed using AI-based ranking
4. WHEN a User filters by Life Dimension, THE Aurora App SHALL display only Posts matching the selected category
5. THE Aurora App SHALL display Post metadata including author Trust Score, creation time, verification count, and Credit unlock cost where applicable

### Requirement 3

**User Story:** As a user, I want to create posts about workplaces, venues, and experiences with photos and videos, so that I can provide rich evidence and help other women make informed decisions.

#### Acceptance Criteria

1. WHEN a User initiates Post creation, THE Aurora App SHALL display a form with fields for Life Dimension, title, description, location, rating, and media upload
2. WHEN a User uploads an image file, THE Aurora App SHALL validate the file is under 10MB and in JPEG, PNG, or WebP format
3. WHEN a User uploads a video file, THE Aurora App SHALL validate the file is under 50MB and in MP4 or MOV format
4. WHEN a User submits a valid Post with media, THE Aurora App SHALL upload files to Convex storage and save the Post with media URLs
5. WHEN a User submits a valid Post, THE Aurora App SHALL save the Post to the database and award 10 Credits to the User
6. WHEN a Post is created, THE Aurora App SHALL broadcast the update to all connected Users' Feeds in real-time
7. THE Aurora App SHALL validate that Post title contains 10 to 200 characters and description contains 20 to 2000 characters
8. WHEN a Post includes location data, THE Aurora App SHALL geocode the location for map visualization
9. THE Aurora App SHALL limit media attachments to 5 files per Post

### Requirement 4

**User Story:** As a user, I want to verify other users' posts, so that I can build my trust score and help maintain platform quality.

#### Acceptance Criteria

1. WHEN a User views a Post, THE Aurora App SHALL display a verification button if the User has not previously verified that Post
2. WHEN a User verifies a Post, THE Aurora App SHALL increment the Post verification count and award 5 Credits to the verifying User
3. WHEN a User verifies a Post, THE Aurora App SHALL increase the User's Trust Score by 1 point
4. THE Aurora App SHALL prevent a User from verifying their own Posts
5. WHEN a Post reaches 5 verifications, THE Aurora App SHALL mark the Post as "Community Verified" with a badge

### Requirement 5

**User Story:** As a user, I want to view and unlock opportunities using my credits, so that I can access jobs, mentorship, and resources that advance my life.

#### Acceptance Criteria

1. WHEN a User accesses the Opportunities page, THE Aurora App SHALL display available Opportunities with Credit costs and descriptions
2. WHEN a User has sufficient Credits, THE Aurora App SHALL enable the unlock button for an Opportunity
3. WHEN a User unlocks an Opportunity, THE Aurora App SHALL deduct the Credit cost and reveal full Opportunity details
4. THE Aurora App SHALL prevent Users from unlocking the same Opportunity multiple times
5. WHEN a User unlocks an Opportunity, THE Aurora App SHALL record the transaction in the User's activity history

### Requirement 6

**User Story:** As a user, I want to interact with an AI assistant, so that I can get personalized career advice and safety recommendations.

#### Acceptance Criteria

1. WHEN a User accesses the AI Assistant, THE Aurora App SHALL display a chat interface with conversation history
2. WHEN a User sends a message, THE Aurora App SHALL transmit the message to Google Gemini API with User context
3. WHEN the AI generates a response, THE Aurora App SHALL display the response in the chat interface within 3 seconds
4. THE Aurora App SHALL include User profile data (industry, location, career goals) and recent platform activity in AI context
5. WHEN the AI Assistant references platform data, THE Aurora App SHALL cite specific Posts or statistics from the database

### Requirement 7

**User Story:** As a user, I want to view my profile with credits, trust score, and impact metrics, so that I can track my progress and reputation.

#### Acceptance Criteria

1. WHEN a User accesses their profile page, THE Aurora App SHALL display current Credit balance, Trust Score, and total Contributions
2. THE Aurora App SHALL display earned badges based on User achievements (First Contributor, Top Verifier, Community Helper)
3. THE Aurora App SHALL calculate and display impact metric showing number of women helped by User's Contributions
4. WHEN a User views their profile, THE Aurora App SHALL list recent activity including Posts created, verifications made, and Opportunities unlocked
5. THE Aurora App SHALL display User's rank percentile based on Trust Score compared to all Users

### Requirement 8

**User Story:** As a user, I want the platform to be secure and protect my data, so that I can safely share sensitive information about workplaces and experiences.

#### Acceptance Criteria

1. THE Aurora App SHALL store all API keys and secrets in environment variables not committed to version control
2. THE Aurora App SHALL encrypt User authentication tokens using WorkOS security standards
3. WHEN a User creates a Post, THE Aurora App SHALL allow anonymous posting while maintaining internal User association for Credit attribution
4. THE Aurora App SHALL implement rate limiting of 100 requests per minute per User to prevent abuse
5. THE Aurora App SHALL validate and sanitize all User input to prevent XSS and injection attacks

### Requirement 9

**User Story:** As a user, I want the platform to be fast and responsive, so that I can efficiently browse content and interact with features.

#### Acceptance Criteria

1. WHEN a User navigates between pages, THE Aurora App SHALL complete page transitions within 200 milliseconds
2. WHEN the Feed loads, THE Aurora App SHALL display initial Posts within 1 second on a standard broadband connection
3. THE Aurora App SHALL implement optimistic UI updates showing User actions immediately before server confirmation
4. WHEN images are displayed, THE Aurora App SHALL lazy-load images outside the viewport to improve performance
5. THE Aurora App SHALL achieve a Lighthouse performance score of 90 or higher on desktop and mobile

### Requirement 10

**User Story:** As a user, I want to view safety information on an interactive map, so that I can navigate different dimensions of life safely and make informed decisions about locations.

#### Acceptance Criteria

1. WHEN a User accesses the Safety Map page, THE Aurora App SHALL display an interactive Mapbox map using the custom style mapbox://styles/malunao/cm84u5ecf000x01qled5j8bvl
2. WHEN Posts with location data exist, THE Aurora App SHALL display markers on the map color-coded by safety rating (green for safe, yellow for caution, red for unsafe)
3. WHEN a User clicks a map marker, THE Aurora App SHALL display a popup with Post summary, rating, verification count, and link to full Post
4. WHEN a User filters by Life Dimension, THE Aurora App SHALL update map markers to show only Posts from the selected category
5. WHEN a User searches for a location, THE Aurora App SHALL center the map on the searched location and display relevant nearby Posts
6. THE Aurora App SHALL display heat map overlay showing safety density when zoomed out beyond city level
7. WHEN a User creates a Post with location, THE Aurora App SHALL add the marker to the map in real-time for all connected Users

### Requirement 11

**User Story:** As a user, I want to plan safe routes between locations, so that I can navigate cities confidently using community intelligence.

#### Acceptance Criteria

1. WHEN a User enters origin and destination on the Safety Map, THE Aurora App SHALL display route options with safety scores
2. THE Aurora App SHALL calculate route safety scores based on aggregated Post ratings along the route path
3. WHEN multiple route options exist, THE Aurora App SHALL highlight the safest route in green and less safe alternatives in yellow
4. THE Aurora App SHALL display safety warnings for route segments with negative Post ratings
5. WHEN a User selects a route, THE Aurora App SHALL show estimated travel time and list nearby safe spaces (verified cafes, public spaces) along the route

### Requirement 12

**User Story:** As a platform administrator, I want to track user behavior and platform health with granular detail, so that I can make data-driven decisions, demonstrate impact, and build robust intelligence products.

#### Acceptance Criteria

1. WHEN a User performs key actions (signup, post creation, verification, opportunity unlock), THE Aurora App SHALL send Engagement Events to PostHog analytics with timestamp, user ID, action type, and contextual metadata
2. WHEN a User interacts with any map element, THE Aurora App SHALL log the interaction with geographic coordinates, zoom level, duration of view, and element type
3. WHEN a User views content, THE Aurora App SHALL track dwell time, scroll depth, and engagement indicators (clicks, shares, saves)
4. THE Aurora App SHALL track daily active users, weekly active users, and monthly active users metrics with cohort analysis
5. THE Aurora App SHALL track Credit economy metrics including Credits earned, Credits spent, Credit velocity, and transaction categories
6. THE Aurora App SHALL track content metrics including Posts created per day, verification rate, average Trust Score, and content type distribution
7. WHEN the platform reaches usage milestones (100 users, 1000 posts), THE Aurora App SHALL log milestone events for celebration and marketing
8. THE Aurora App SHALL aggregate all Engagement Events into structured datasets for Data Intelligence Lake processing


### Requirement 13

**User Story:** As a woman who moves through the world daily, I want to track and share my walking, running, cycling, or commuting routes with safety evaluations, so that I can contribute to collective safety intelligence while documenting my personal journey.

#### Acceptance Criteria

1. WHEN a User starts a route, THE Aurora App SHALL track GPS coordinates in real-time and display the route path on an interactive map
2. WHEN a User completes a route, THE Aurora App SHALL allow the User to add tags from predefined options including "safe", "inspiring", "challenging", "healing", "accessible", "beautiful"
3. WHEN a User evaluates a completed route, THE Aurora App SHALL provide a rating system using 1-5 stars or emoji reactions for personal experience
4. WHEN a User saves a route, THE Aurora App SHALL allow optional journal entry text or voice note attachment with maximum 2000 characters
5. WHEN a User chooses sharing preferences, THE Aurora App SHALL provide options to share anonymously, with profile name, or keep private
6. WHEN a User views their route history, THE Aurora App SHALL display all saved routes with date, distance, duration, tags, and ratings
7. WHEN a User browses community routes, THE Aurora App SHALL display shared routes filtered by location, tags, and safety ratings
8. WHEN a User selects a community route, THE Aurora App SHALL show the complete route path, creator information (if not anonymous), tags, rating, and journal entries
9. THE Aurora App SHALL encrypt all route data and provide anonymous mode where no identifying information is stored or shared
10. THE Aurora App SHALL support offline route tracking with automatic sync when connection is restored

### Requirement 14

**User Story:** As a user exploring new areas, I want to discover routes that other women have rated as safe and inspiring, so that I can move confidently through unfamiliar spaces.

#### Acceptance Criteria

1. WHEN a User searches for routes in a specific area, THE Aurora App SHALL display community-shared routes within a 10km radius sorted by safety rating
2. WHEN a User filters routes, THE Aurora App SHALL provide filter options for distance range, route type (walking/running/cycling), tags, and minimum safety rating
3. WHEN a User views route details, THE Aurora App SHALL display aggregate statistics including total users who completed the route, average safety rating, and most common tags
4. WHEN a User starts a community route, THE Aurora App SHALL provide turn-by-turn navigation with real-time GPS tracking
5. WHEN a User completes a community route, THE Aurora App SHALL prompt for their own evaluation to contribute to collective intelligence

### Requirement 15

**User Story:** As a user concerned about privacy, I want full control over my route data and sharing preferences, so that I can participate safely without compromising my security.

#### Acceptance Criteria

1. WHEN a User creates a route, THE Aurora App SHALL default to private mode with explicit opt-in required for sharing
2. WHEN a User shares a route anonymously, THE Aurora App SHALL remove all identifying metadata including username, profile picture, and exact start/end points
3. WHEN a User changes sharing preferences, THE Aurora App SHALL apply changes immediately and allow retroactive privacy updates to previously shared routes
4. WHEN a User deletes a route, THE Aurora App SHALL permanently remove all associated data including GPS coordinates, journal entries, and voice notes within 24 hours
5. THE Aurora App SHALL encrypt route data at rest and in transit using industry-standard encryption protocols

### Requirement 16

**User Story:** As a user who wants to earn credits, I want to be rewarded for sharing valuable route intelligence, so that I can unlock opportunities while helping other women.

#### Acceptance Criteria

1. WHEN a User shares a route publicly, THE Aurora App SHALL award 15 Credits upon publication
2. WHEN another User completes and verifies a shared route, THE Aurora App SHALL award the original creator 5 Credits
3. WHEN a User's shared route receives 10 or more positive ratings, THE Aurora App SHALL award a bonus 25 Credits
4. WHEN a User contributes voice notes or detailed journal entries, THE Aurora App SHALL award an additional 5 Credits for high-quality content
5. THE Aurora App SHALL display route contribution statistics on the User profile including total routes shared, total verifications received, and Credits earned from routes


## Community Engagement Requirements

### Requirement 17: Reddit-Style Commenting System

**User Story:** As a user, I want to comment on posts and reply to other comments, so that I can engage in discussions with the community.

#### Acceptance Criteria

1. WHEN a user views a post THEN the system SHALL display a comment count and option to view comments
2. WHEN a user clicks to view comments THEN the system SHALL display all comments with author information and timestamps
3. WHEN a user writes a comment THEN the system SHALL save it and update the post's comment count
4. WHEN a user replies to a comment THEN the system SHALL support nested comment threads
5. WHEN a user deletes their comment THEN the system SHALL soft-delete it and update counts

### Requirement 18: Upvote/Downvote System

**User Story:** As a user, I want to upvote or downvote posts and comments, so that I can express my opinion on content quality.

#### Acceptance Criteria

1. WHEN a user clicks upvote on a post THEN the system SHALL increment the upvote count and record the vote
2. WHEN a user clicks downvote on a post THEN the system SHALL increment the downvote count
3. WHEN a user changes their vote THEN the system SHALL update the vote type and adjust counts
4. WHEN a user votes on a comment THEN the system SHALL apply the same voting logic as posts
5. WHEN displaying content THEN the system SHALL show net vote scores prominently

### Requirement 19: User-Created Opportunities

**User Story:** As a user, I want to post job opportunities and resources, so that I can share valuable information with the community.

#### Acceptance Criteria

1. WHEN a user creates an opportunity THEN the system SHALL require title, description, category, and credit cost
2. WHEN setting credit cost THEN the system SHALL allow values between 5-100 credits
3. WHEN an opportunity is created THEN the system SHALL show preview info (title, thumbnail, creator) publicly
4. WHEN a user unlocks an opportunity THEN the system SHALL deduct credits and reveal full details
5. WHEN a user owns an opportunity THEN the system SHALL allow editing and deletion

### Requirement 20: Enhanced User Profiles

**User Story:** As a user, I want a comprehensive profile with my activity history, so that I can track my contributions and engagement.

#### Acceptance Criteria

1. WHEN viewing a profile THEN the system SHALL display bio, location, interests, and stats
2. WHEN a user performs actions THEN the system SHALL log them in recent activity
3. WHEN displaying activity THEN the system SHALL show posts, comments, votes, routes, and opportunities
4. WHEN a month ends THEN the system SHALL reset monthly credit earnings counter
5. WHEN a user requests account deletion THEN the system SHALL require multiple confirmations

### Requirement 21: Unified Activity Feed

**User Story:** As a user, I want to see all types of content in one feed, so that I can stay updated on community activity.

#### Acceptance Criteria

1. WHEN viewing the feed THEN the system SHALL show posts, routes, opportunities, and AI chats
2. WHEN content is shared THEN the system SHALL display appropriate preview for each type
3. WHEN a user clicks content THEN the system SHALL navigate to the full view
4. WHEN new content is posted THEN the system SHALL update the feed in real-time
5. WHEN filtering feed THEN the system SHALL allow filtering by content type

### Requirement 22: Poll Creation and Voting

**User Story:** As a user, I want to create polls and vote on them, so that I can gather community opinions.

#### Acceptance Criteria

1. WHEN creating a post THEN the system SHALL offer poll as a post type option
2. WHEN creating a poll THEN the system SHALL require 2-6 answer options
3. WHEN a user votes on a poll THEN the system SHALL record the vote and prevent duplicates
4. WHEN displaying poll results THEN the system SHALL show vote counts and percentages
5. WHEN a poll is active THEN the system SHALL update results in real-time

### Requirement 23: Direct Messaging

**User Story:** As a user, I want to send private messages to other users, so that I can have one-on-one conversations.

#### Acceptance Criteria

1. WHEN a user sends a DM THEN the system SHALL deliver it to the recipient in real-time
2. WHEN viewing messages THEN the system SHALL display conversation history
3. WHEN a message is read THEN the system SHALL mark it as read
4. WHEN sending a DM THEN the system SHALL support text and media attachments
5. WHEN a user is online THEN the system SHALL show their online status

### Requirement 24: Monthly Credit Limits

**User Story:** As a user, I want fair credit earning limits, so that the economy remains balanced.

#### Acceptance Criteria

1. WHEN a month begins THEN the system SHALL reset monthly credit earnings to zero
2. WHEN a user earns credits THEN the system SHALL track monthly total separately
3. WHEN monthly limit is reached THEN the system SHALL notify the user
4. WHEN viewing profile THEN the system SHALL display monthly earnings and limit
5. WHEN limit is reached THEN the system SHALL still allow credit spending

### Requirement 25: Live Activity on Landing Page

**User Story:** As a visitor, I want to see real community activity on the landing page, so that I can see the platform is active.

#### Acceptance Criteria

1. WHEN viewing landing page THEN the system SHALL display last 3 public posts
2. WHEN new content is shared THEN the system SHALL update the activity feed
3. WHEN displaying activity THEN the system SHALL show routes and opportunities too
4. WHEN activity updates THEN the system SHALL animate new items
5. WHEN clicking activity THEN the system SHALL require login to view full content

### Requirement 26: Calendar View for Routes

**User Story:** As a user, I want to view my routes on a calendar, so that I can track my activity over time.

#### Acceptance Criteria

1. WHEN viewing routes page THEN the system SHALL offer calendar view option
2. WHEN in calendar view THEN the system SHALL display routes on their completion dates
3. WHEN clicking a date THEN the system SHALL show all routes from that day
4. WHEN viewing calendar THEN the system SHALL highlight days with routes
5. WHEN switching months THEN the system SHALL load routes for that period

### Requirement 27: Improved Safety Map UX

**User Story:** As a user, I want the safety map to maintain my location when adding posts, so that the experience is seamless.

#### Acceptance Criteria

1. WHEN selecting location THEN the system SHALL maintain map center position
2. WHEN opening post dialog THEN the system SHALL preserve zoom level
3. WHEN submitting post THEN the system SHALL return to same map view
4. WHEN using GPS THEN the system SHALL keep user marker visible
5. WHEN interacting with map THEN the system SHALL provide smooth transitions
6. WHEN a User interacts with the Safety Map, THE Aurora App SHALL log Engagement Events including map center coordinates, zoom level, interaction duration, and markers viewed

## Data Intelligence & Monetization Requirements

### Requirement 28: Aurora Reels (Short-Form Video Engagement Engine)

**User Story:** As a user, I want to create and share short-form video content about my experiences, so that I can provide rich, authentic safety intelligence and engage with the community in a modern format.

#### Acceptance Criteria

1. WHEN a User creates a Reel, THE Aurora App SHALL accept video files between 15 and 90 seconds in MP4 or MOV format with maximum size of 100MB
2. WHEN a User uploads a Reel, THE Aurora App SHALL process the video through Cloudinary for optimization, transcoding, and CDN delivery
3. WHEN a Reel is uploaded, THE Aurora App SHALL extract metadata including caption text, hashtags, location tags, and visual content for categorization
4. THE Aurora App SHALL automatically categorize Reels using AI analysis into safety-relevant categories including "Harassment", "Joy", "Lighting Issue", "Infrastructure Problem", "Positive Experience", and "Warning"
5. WHEN a User views Reels, THE Aurora App SHALL display them in a vertical, swipeable feed with autoplay functionality
6. WHEN a User interacts with a Reel, THE Aurora App SHALL track engagement metrics including view duration, completion rate, likes, shares, and comments
7. WHEN a Reel contains location data, THE Aurora App SHALL display the video on the Safety Map as a video marker with preview thumbnail
8. THE Aurora App SHALL award 20 Credits when a User publishes a Reel with location and safety tags
9. WHEN a Reel receives 100 views, THE Aurora App SHALL award the creator a bonus 15 Credits
10. THE Aurora App SHALL aggregate Reel metadata and engagement data into the Data Intelligence Lake for safety pattern analysis
11. WHEN displaying Reels, THE Aurora App SHALL implement infinite scroll with lazy loading to optimize performance
12. THE Aurora App SHALL allow Users to add voice-over narration, text overlays, and safety rating (1-5 stars) to Reels

### Requirement 29: Aurora Live (Real-Time Streaming & Safety Broadcasting)

**User Story:** As a user, I want to livestream my experiences in real-time, so that I can share immediate safety information, build community connections, and receive support when needed.

#### Acceptance Criteria

1. WHEN a User initiates a Live Stream, THE Aurora App SHALL establish a real-time video connection using Agora SDK with latency under 500 milliseconds
2. WHEN a Live Stream starts, THE Aurora App SHALL display the stream location on the Safety Map with a pulsing "LIVE" indicator visible to all Users
3. WHEN a User views a Live Stream, THE Aurora App SHALL display real-time viewer count, chat messages, and streamer location
4. THE Aurora App SHALL implement a tipping system where viewers can send Credits to streamers during broadcasts
5. WHEN a viewer sends a tip, THE Aurora App SHALL deduct Credits from the viewer, award 80% to the streamer, and retain 20% as platform commission
6. THE Aurora App SHALL provide a "Safety Shield" button on the streaming interface that immediately terminates the stream, sends emergency location to trusted contacts, and logs the incident
7. WHEN a User activates Safety Shield, THE Aurora App SHALL capture the final 30 seconds of stream footage and store it securely with encrypted access
8. THE Aurora App SHALL allow streamers to set stream privacy (Public, Followers Only, Private) before going live
9. WHEN a Live Stream ends, THE Aurora App SHALL save the recording and allow the streamer to publish it as a Post or Reel
10. THE Aurora App SHALL track Live Stream engagement metrics including peak viewers, total watch time, tips received, and chat activity
11. THE Aurora App SHALL implement AI-powered content moderation to detect and flag inappropriate content in real-time streams
12. WHEN a Live Stream contains safety-relevant content, THE Aurora App SHALL extract and categorize the data for the Data Intelligence Lake
13. THE Aurora App SHALL award 30 Credits when a User completes a Live Stream longer than 5 minutes with location enabled

### Requirement 30: Data Intelligence Lake (Business Intelligence Core)

**User Story:** As a platform stakeholder, I want to systematically collect and structure anonymized user data, so that we can create valuable B2B/B2G intelligence products while maintaining user privacy.

#### Acceptance Criteria

1. THE Aurora App SHALL collect and store anonymized Engagement Events including user interactions, content views, map interactions, and feature usage with timestamp and context
2. THE Aurora App SHALL aggregate workplace safety ratings into a Corporate Safety Index with company-level scores, industry benchmarks, and trend analysis
3. THE Aurora App SHALL aggregate route data and location-based posts into an Urban Safety Index with neighborhood-level scores, time-of-day patterns, and risk heatmaps
4. WHEN collecting data for the Data Intelligence Lake, THE Aurora App SHALL technically dissociate all data points from personally identifiable information (PII) using cryptographic hashing and anonymization
5. THE Aurora App SHALL implement privacy-by-design principles ensuring that exported datasets cannot be reverse-engineered to identify individual Users
6. THE Aurora App SHALL structure data exports in standardized formats (JSON, CSV, Parquet) suitable for B2B analytics platforms
7. THE Aurora App SHALL create API endpoints for enterprise clients to query Corporate Safety Index and Urban Safety Index data with rate limiting and authentication
8. WHEN a User opts out of data collection, THE Aurora App SHALL exclude their data from all Data Intelligence Lake processing while maintaining core platform functionality
9. THE Aurora App SHALL generate monthly data intelligence reports including safety trends, geographic risk patterns, and workplace safety rankings
10. THE Aurora App SHALL implement data retention policies deleting raw engagement data after 24 months while preserving aggregated intelligence indefinitely
11. THE Aurora App SHALL track data quality metrics including completeness, accuracy, and freshness for all intelligence products
12. THE Aurora App SHALL provide transparency reports showing Users how their anonymized data contributes to safety intelligence without revealing individual contributions

### Requirement 31: Marketplace & Monetization Infrastructure

**User Story:** As a platform operator, I want to implement multiple revenue streams including subscriptions, marketplace commissions, and affiliate partnerships, so that Aurora App can achieve financial sustainability while serving the community.

#### Acceptance Criteria

1. THE Aurora App SHALL offer an Aurora Premium subscription tier at $9.99/month providing ad-free experience, unlimited AI assistant queries, priority support, and exclusive badges
2. WHEN a User subscribes to Aurora Premium, THE Aurora App SHALL process payment through Stripe and activate premium features immediately
3. THE Aurora App SHALL implement a Marketplace where Users can offer services (coaching, consulting, freelance work) to other Users
4. WHEN a User lists a service in the Marketplace, THE Aurora App SHALL require service description, pricing, category, and availability
5. WHEN a service transaction is completed through the Marketplace, THE Aurora App SHALL collect a 15% commission fee from the service provider
6. THE Aurora App SHALL implement an affiliate tracking system for safety products (personal alarms, pepper spray, tracking devices) with unique referral links
7. WHEN a User purchases a product through an affiliate link, THE Aurora App SHALL earn commission and award 10% of the commission to the referring User as Credits
8. THE Aurora App SHALL display non-intrusive banner advertisements to free-tier Users with frequency limited to one ad per 10 content items
9. THE Aurora App SHALL implement a "Boost Post" feature allowing Users to spend Credits to increase post visibility in the Feed
10. WHEN a User boosts a Post, THE Aurora App SHALL deduct 50 Credits and display the Post prominently for 24 hours
11. THE Aurora App SHALL track all revenue streams separately including subscription revenue, marketplace commissions, affiliate earnings, and advertising revenue
12. THE Aurora App SHALL provide Users with a transparent breakdown of how platform revenue supports safety features and community programs

### Requirement 32: Advanced Content Moderation Engine

**User Story:** As a platform administrator, I want AI-powered content moderation across all media types, so that we can maintain brand safety, protect users, and ensure quality for future partnerships.

#### Acceptance Criteria

1. WHEN a User submits text content (Post, comment, message), THE Aurora App SHALL analyze the text using Google Cloud Natural Language API for toxicity, hate speech, and inappropriate content
2. WHEN text content receives a toxicity score above 0.7, THE Aurora App SHALL flag the content for manual review and prevent immediate publication
3. WHEN a User uploads an image, THE Aurora App SHALL analyze the image using Google Cloud Vision API for explicit content, violence, and policy violations
4. WHEN an image is flagged as inappropriate, THE Aurora App SHALL blur the image and require manual moderator approval before display
5. WHEN a User uploads a video (Reel or Live Stream recording), THE Aurora App SHALL analyze video frames using AI to detect inappropriate content, violence, or policy violations
6. THE Aurora App SHALL implement a moderation queue displaying all flagged content with AI confidence scores and recommended actions
7. WHEN a moderator reviews flagged content, THE Aurora App SHALL allow approve, reject, or escalate actions with reason codes
8. THE Aurora App SHALL automatically suspend Users who receive 3 content violations within 30 days pending manual review
9. THE Aurora App SHALL implement appeal functionality allowing Users to contest moderation decisions with human review
10. THE Aurora App SHALL track moderation metrics including flag rate, false positive rate, average review time, and moderator actions
11. THE Aurora App SHALL provide Users with clear community guidelines and content policy accessible from all content creation interfaces
12. WHEN content is removed, THE Aurora App SHALL notify the User with specific policy violation details and appeal instructions
13. THE Aurora App SHALL implement keyword filtering for known problematic terms with automatic flagging and context analysis
14. THE Aurora App SHALL generate weekly moderation reports for platform administrators including violation trends, category distribution, and moderator performance

### Requirement 33: Performance & Reliability for World-Class Experience

**User Story:** As a user, I want Aurora App to be exceptionally fast, reliable, and polished, so that I can trust the platform for critical safety information and daily use.

#### Acceptance Criteria

1. WHEN a User navigates to any page, THE Aurora App SHALL achieve Time to Interactive (TTI) under 2 seconds on 4G mobile connections
2. THE Aurora App SHALL achieve a Lighthouse performance score of 95 or higher on mobile and desktop
3. WHEN the Feed loads, THE Aurora App SHALL display the first 10 posts within 800 milliseconds using optimized queries and caching
4. THE Aurora App SHALL implement progressive image loading with low-quality placeholders (LQIP) for all images
5. WHEN a User uploads media, THE Aurora App SHALL display upload progress with percentage and estimated time remaining
6. THE Aurora App SHALL implement automatic retry logic for failed network requests with exponential backoff
7. WHEN the Aurora App detects poor network conditions, THE Aurora App SHALL reduce media quality and enable offline mode
8. THE Aurora App SHALL achieve 99.9% uptime measured monthly with automated health checks and alerting
9. THE Aurora App SHALL implement comprehensive error logging with Sentry integration capturing client-side and server-side errors
10. WHEN an error occurs, THE Aurora App SHALL display user-friendly error messages with actionable recovery steps
11. THE Aurora App SHALL implement database query optimization with indexes on all frequently queried fields
12. THE Aurora App SHALL use CDN caching for all static assets with cache invalidation on deployments
13. THE Aurora App SHALL implement rate limiting on all API endpoints to prevent abuse (1000 requests per hour per User)
14. THE Aurora App SHALL monitor Core Web Vitals (LCP, FID, CLS) and alert when metrics degrade below thresholds
15. THE Aurora App SHALL implement automated performance testing in CI/CD pipeline failing builds that regress performance by more than 10%
