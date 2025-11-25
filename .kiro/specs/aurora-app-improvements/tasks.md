# Implementation Plan - Aurora App UI/UX & Functionality Improvements

## Phase 1: Critical Backend Fixes

- [ ] 1. Fix Convex Query Errors
  - [ ] 1.1 Add error handling to cycleTracker.getCycleHistory query
    - Wrap query in try-catch, return empty array on error
    - _Requirements: 1.1_
  - [ ] 1.2 Add error handling to health.getTodayHydration query
    - Return default values on error
    - _Requirements: 1.2_
  - [ ] 1.3 Fix assistant chat message sending
    - Debug and fix the mutation error
    - _Requirements: 1.3_
  - [ ] 1.4 Add graceful Agora token error handling
    - Show "Coming Soon" message when Agora not configured
    - _Requirements: 1.4_
  - [ ] 1.5 Fix reels upload credentials generation
    - Debug and fix the query error
    - _Requirements: 1.5_

- [ ] 2. Checkpoint - Ensure all pages load without errors
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Brand Identity & Theme System

- [ ] 3. Update Global Theme System
  - [ ] 3.1 Update globals.css with Aurora theme variables
    - Add proper light/dark mode backgrounds
    - Aurora Cream for light, Aurora Violet for dark
    - _Requirements: 2.3, 2.4_
  - [ ] 3.2 Fix text contrast ratios across all pages
    - Ensure WCAG AA compliance (4.5:1 ratio)
    - _Requirements: 2.5_
  - [ ] 3.3 Update theme toggle with sun/moon icons
    - Add Sun icon for light mode, Moon icon for dark mode
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 4. Update Sidebar with Aurora Branding
  - [ ] 4.1 Add Aurora App logo to sidebar header
    - Use /public/Au_Logo_1.png
    - Display "Aurora App" text next to logo
    - _Requirements: 2.2_
  - [ ] 4.2 Apply Aurora colors to sidebar
    - Use Aurora Violet background in dark mode
    - Use Aurora Cream background in light mode
    - _Requirements: 2.1_
  - [ ] 4.3 Ensure sidebar consistency across all authenticated pages
    - _Requirements: 3.4_

- [ ] 5. Checkpoint - Verify brand consistency
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Navigation Improvements

- [x] 6. Fix Mobile Navigation
  - [x] 6.1 Move hamburger menu to LEFT side of screen
    - Update mobile-sidebar.tsx trigger position
    - _Requirements: 3.1_
  - [x] 6.2 Redesigned navigation - removed bottom nav, using slide-out sidebar
    - More like Reddit/YouTube navigation pattern
    - _Requirements: 3.2_
  - [x] 6.3 Fix /routes/track mobile responsiveness
    - Prevent overlap with bottom navigation
    - Add proper padding for safe areas
    - _Requirements: 6.9_

- [x] 7. Update Desktop Sidebar
  - [x] 7.1 Ensure fixed sidebar on desktop
    - Redesigned with collapsible sections
    - Aurora App logo and branding
    - User profile card with credits
    - _Requirements: 3.3_

## Phase 4: Mapbox Integration

- [ ] 8. Create RouteMapPreview Component
  - [ ] 8.1 Create reusable RouteMapPreview component
    - Display Mapbox map with drawn route
    - Show start/end markers
    - Display distance (km) and duration (min)
    - _Requirements: 4.1, 4.4_
  - [ ] 8.2 Write unit tests for RouteMapPreview
    - Test distance/duration formatting
    - Test coordinate rendering
    - _Requirements: 4.4_

- [ ] 9. Integrate Mapbox in Feed
  - [ ] 9.1 Add RouteMapPreview to route posts in feed
    - _Requirements: 4.1_
  - [ ] 9.2 Ensure consistent Mapbox style across app
    - _Requirements: 4.5_

- [ ] 10. Integrate Mapbox in Routes Pages
  - [ ] 10.1 Add RouteMapPreview to /routes/discover
    - _Requirements: 4.2_
  - [ ] 10.2 Add full route view to /routes/[routeId]
    - _Requirements: 4.3_

- [ ] 11. Checkpoint - Verify Mapbox integration
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Page Redesigns

- [x] 12. Fix Legal Pages Contrast
  - [x] 12.1 Update /legal/privacy with proper contrast
    - Use Aurora colors, ensure readable text
    - _Requirements: 6.1_
  - [x] 12.2 Update /legal/terms with proper contrast
    - _Requirements: 6.2_

- [x] 13. Redesign Credits Page
  - [x] 13.1 Apply Aurora branding to /credits
    - Use Aurora Yellow for credit displays
    - Proper contrast in both themes
    - _Requirements: 6.3_

- [x] 14. Fix Settings Page Contrast
  - [x] 14.1 Fix light mode contrast in /settings
    - _Requirements: 6.4_

- [x] 15. Redesign Feature Pages
  - [x] 15.1 Redesign /intelligence page
    - Apply Aurora branding
    - _Requirements: 6.5_
  - [x] 15.2 Redesign /messages page
    - Apply Aurora branding
    - _Requirements: 6.6_
  - [x] 15.3 Redesign /opportunities page
    - Apply Aurora branding
    - _Requirements: 6.7_
  - [x] 15.4 Redesign /routes page
    - Add route previews with maps
    - _Requirements: 6.8_

## Phase 6: Avatar & Onboarding

- [x] 16. Update Avatar System
  - [x] 16.1 Update avatar configuration for feminine adults
    - Use adult hairstyles, remove childlike features
    - Add earrings, accessories options
    - _Requirements: 5.1, 5.2_

- [x] 17. Update Onboarding
  - [x] 17.1 Add Aurora App logo to onboarding
    - _Requirements: 5.3_
  - [x] 17.2 Apply Aurora colors to onboarding form
    - _Requirements: 5.4_

- [ ] 18. Checkpoint - Verify avatar and onboarding
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Performance Optimization

- [x] 19. Implement Skeleton Screens
  - [x] 19.1 Create skeleton components for all pages
    - Feed skeleton, profile skeleton, etc.
    - Use Aurora colors for shimmer effect
    - _Requirements: 11.2_

- [x] 20. Implement Connection-Aware Loading
  - [x] 20.1 Create useConnection hook
    - Detect 2G/3G/4G connection
    - Adjust image quality based on connection
    - _Requirements: 11.5_

- [x] 21. Optimize Bundle Size
  - [x] 21.1 Configure code splitting in next.config.ts
    - Split by route
    - Optimize package imports
    - _Requirements: 11.7_

- [ ] 22. Implement List Virtualization
  - [ ] 22.1 Add virtualization to feed
    - Use @tanstack/react-virtual
    - _Requirements: 11.6_
  - [ ] 22.2 Add virtualization to messages list
    - _Requirements: 11.6_

- [x] 23. Enhance Service Worker
  - [x] 23.1 Implement cache strategies
    - Cache-first for static, network-first for API
    - _Requirements: 11.4_

- [ ] 24. Checkpoint - Verify performance targets
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Non-Disruptive Ads

- [ ] 25. Create Native Ad Component
  - [ ] 25.1 Create NativeAdCard component
    - Match feed card design
    - Clearly labeled as "Sponsored"
    - _Requirements: 12.1_

- [ ] 26. Implement Ad Placement
  - [ ] 26.1 Add ads every 5th post in feed
    - _Requirements: 12.2_
  - [ ] 26.2 Ensure no ads in safety/emergency features
    - _Requirements: 12.3_
  - [ ] 26.3 Ensure no ads during onboarding
    - _Requirements: 12.4_
  - [ ] 26.4 Hide ads for premium users
    - _Requirements: 12.5_

- [ ] 27. Implement Rewarded Ads
  - [ ] 27.1 Add optional rewarded ad for credits
    - _Requirements: 12.7_

## Phase 9: Virtual Gifts & Donations (Stripe)

- [ ] 28. Set Up Stripe Integration
  - [ ] 28.1 Configure Stripe in Convex
    - Add Stripe API keys to environment
    - Create Stripe webhook handler
    - _Requirements: 13.1_

- [ ] 29. Create Gem Purchase System
  - [ ] 29.1 Create gem packages in Stripe
    - $0.99 = 100 Gems, $4.99 = 550 Gems, etc.
    - _Requirements: 13.1, 13.2_
  - [ ] 29.2 Create gem purchase UI
    - Beautiful modal with package options
    - _Requirements: 13.1_

- [ ] 30. Create Virtual Gifts
  - [ ] 30.1 Define virtual gift catalog
    - Purple Heart, Cherry Blossom, Diamond, Crown, etc.
    - _Requirements: 13.3_
  - [ ] 30.2 Create gift animations
    - Beautiful feminine animations for each gift
    - _Requirements: 13.4_
  - [ ] 30.3 Create gift sending UI
    - Gift picker modal
    - _Requirements: 13.3_

- [ ] 31. Implement Gift Revenue Split
  - [ ] 31.1 Create gift transaction system
    - 80% to creator, 20% to Aurora App
    - _Requirements: 13.5_
  - [ ] 31.2 Create real-time gift notifications
    - _Requirements: 13.6_

- [ ] 32. Implement Creator Payouts
  - [ ] 32.1 Set up Stripe Connect for creators
    - _Requirements: 13.7_
  - [ ] 32.2 Create payout request system
    - Minimum $10 withdrawal
    - _Requirements: 13.8_

- [ ] 33. Checkpoint - Verify gift system
  - Ensure all tests pass, ask the user if questions arise.

## Phase 10: Feed Engagement System

- [ ] 34. Enhance Feed Performance
  - [ ] 34.1 Implement infinite scroll with virtualization
    - _Requirements: 14.1_
  - [ ] 34.2 Add real-time feed updates
    - _Requirements: 14.5_

- [ ] 35. Enhance Feed Interactions
  - [ ] 35.1 Add swipe gestures for quick actions
    - _Requirements: 14.4_
  - [ ] 35.2 Display engagement metrics (upvotes, comments, gifts)
    - _Requirements: 14.2_
  - [ ] 35.3 Implement threaded comments (Reddit-style)
    - _Requirements: 14.3_

- [ ] 36. Add Gift Leaderboards
  - [ ] 36.1 Create top gifters leaderboard
    - _Requirements: 14.7_
  - [ ] 36.2 Create top creators leaderboard
    - _Requirements: 14.7_

## Phase 11: Livestream & Reels Monetization

- [ ] 37. Add Gifts to Livestreams
  - [ ] 37.1 Add gift button to livestream viewer
    - _Requirements: 15.1_
  - [ ] 37.2 Show gift animations to all viewers
    - _Requirements: 15.2_
  - [ ] 37.3 Add live gift counter
    - _Requirements: 15.3_

- [ ] 38. Add Gifts to Reels
  - [ ] 38.1 Add gift button to reel viewer
    - _Requirements: 15.4_
  - [ ] 38.2 Show total gifts on reel
    - _Requirements: 15.5_

## Phase 12: Geospatial Content Map

- [ ] 39. Implement Map Clustering
  - [ ] 39.1 Set up Supercluster for point clustering
    - Progressive reveal based on zoom
    - _Requirements: 16.2, 16.3_
  - [ ] 39.2 Create custom markers for each content type
    - Posts, reels, routes, opportunities, livestreams
    - _Requirements: 16.5_

- [ ] 40. Implement Map Content Loading
  - [ ] 40.1 Load content based on visible map area
    - _Requirements: 16.8_
  - [ ] 40.2 Create content preview popup
    - _Requirements: 16.4_

- [ ] 41. Implement Route Visualization
  - [ ] 41.1 Draw route paths on map
    - _Requirements: 16.6_

- [ ] 42. Add Map Filters
  - [ ] 42.1 Create filter UI for content types, time, rating
    - _Requirements: 16.7_

- [ ] 43. Optimize Map Performance
  - [ ] 43.1 Ensure map loads within 2 seconds
    - _Requirements: 17.4_
  - [ ] 43.2 Add pulsing markers for live content
    - _Requirements: 17.5_
  - [ ] 43.3 Add optional safety heatmap layer
    - _Requirements: 17.6_

- [ ] 44. Final Checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

