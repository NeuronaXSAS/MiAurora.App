# Aurora Reels - Safety Intelligence Video Feed

## Overview

Aurora Reels is a TikTok-style vertical video feed that showcases **AI-powered safety intelligence**. Each reel is automatically analyzed by Google Gemini to extract safety metadata, which is prominently displayed to users.

## Key Features

### 🎥 Vertical Feed Experience
- **Full-screen vertical scrolling** with CSS Scroll Snap
- **Smart autoplay**: Only the active video plays (using IntersectionObserver)
- **Smooth transitions** between reels
- **Infinite scroll** with pagination support

### 🛡️ AI Safety Overlays (The Differentiator)
- **Safety Score (0-100)**: Color-coded shield icon
  - 🟢 Green (70-100): Safe
  - 🟡 Yellow (40-69): Caution
  - 🔴 Red (0-39): Warning
- **AI Tags**: Pill badges showing detected safety categories
  - ⚠️ Harassment Risk
  - 💡 Lighting Issue
  - 🚧 Infrastructure Problem
  - ✨ Safe Space
  - 😊 Positive Vibe
- **Visual Tags**: AI-detected objects and scene descriptions

### 💬 Social Interactions
- **Like**: Toggle heart button (tracked per user)
- **Comment**: Opens comment sheet (TODO)
- **Share**: Share reel (TODO)
- **Mute/Unmute**: Audio control

### 👤 Creator Attribution
- Author profile picture and name
- Trust score display
- Anonymous posting support

## Architecture

### Components

#### `ReelPlayer` (`components/reels/reel-player.tsx`)
The core video player component that renders a single reel.

**Props:**
- `reel`: Reel data including video URL, AI metadata, engagement metrics
- `isActive`: Boolean indicating if this reel is currently in view
- `onLike`, `onComment`, `onShare`: Interaction callbacks

**Features:**
- Auto-play/pause based on `isActive` prop
- View count increment on first play
- Safety score calculation from AI sentiment
- Dynamic safety icon and color based on category

#### `ReelsFeed` (`components/reels/reels-feed.tsx`)
Container component that manages the vertical scrolling feed.

**Features:**
- Scroll snap for native app feel
- IntersectionObserver for active video detection
- Pagination support for infinite scroll
- Loading and empty states

#### `ReelsPage` (`app/(authenticated)/reels/page.tsx`)
Main page component with authentication and navigation.

**Features:**
- User authentication check
- Floating "Create" button
- Top navigation bar (For You / Trending)

### Backend

#### `convex/reels.ts`
Backend queries and mutations for reels.

**Key Functions:**
- `getReelsFeed`: Returns paginated feed with AI metadata and `isLiked` status
- `likeReel`: Toggle like with individual tracking
- `incrementViews`: Track view count
- `updateAIMetadata`: Called by AI analysis action
- `updateModerationStatus`: Moderation workflow

#### `convex/schema.ts`
Database schema definitions.

**Tables:**
- `reels`: Video metadata, AI analysis, engagement metrics
- `reelLikes`: Individual user likes for accurate tracking

## AI Metadata Structure

```typescript
aiMetadata: {
  safetyCategory?: "Harassment" | "Joy" | "Lighting Issue" | 
                   "Infrastructure Problem" | "Positive Experience" | "Warning",
  sentiment?: number,        // -1 to 1 (converted to 0-100 safety score)
  detectedObjects?: string[], // ["person", "street", "car"]
  visualTags?: string[],     // ["dark street", "crowded area"]
  transcription?: string     // Voice-to-text (future)
}
```

## Usage

### Viewing Reels
Navigate to `/reels` to view the vertical feed.

### Creating Reels
1. Click the floating camera button
2. Record or upload video (15-90 seconds)
3. Add caption and hashtags
4. Submit for AI analysis
5. Reel appears in feed after approval

### Liking Reels
Click the heart button. The like is tracked per user and persists across sessions.

## Future Enhancements

- [ ] Comments system
- [ ] Share functionality
- [ ] Video preloading for smoother scrolling
- [ ] Trending algorithm
- [ ] Hashtag discovery
- [ ] Sound/audio discovery
- [ ] "Use This Sound" feature
- [ ] Advanced filters and effects

## Technical Notes

### Performance
- Videos use Cloudinary's adaptive streaming
- Only active video plays (others are paused)
- Intersection Observer for efficient active detection
- Pagination prevents loading all reels at once

### Accessibility
- Mute/unmute control for audio
- Color-coded safety indicators
- Text-based AI tags for screen readers

### Mobile-First
- Designed for mobile portrait orientation
- Touch-friendly interaction buttons
- Scroll snap for native app feel
- Full-screen immersive experience

## Value Proposition

Aurora Reels differentiates from TikTok/Instagram by:
1. **Safety Intelligence**: Every video is analyzed for safety insights
2. **Trust Scores**: Creator credibility is visible
3. **Community Safety**: AI flags potential risks before they spread
4. **Empowerment**: Users make informed decisions about content
