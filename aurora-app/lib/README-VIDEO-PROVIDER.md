# Video Provider Infrastructure

## Overview

Aurora App uses a **provider-agnostic video architecture** that allows easy migration between video hosting services (Cloudinary, AWS MediaConvert, etc.) without refactoring the entire application.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Code                         │
│              (UI Components, Hooks, etc.)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              VideoProvider Interface                        │
│  - generateUploadCredentials()                              │
│  - getVideoUrl()                                            │
│  - getThumbnailUrl()                                        │
│  - deleteVideo()                                            │
│  - getMetadata()                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
    ┌───────────────────┐   ┌───────────────────┐
    │ CloudinaryProvider│   │   AWSProvider     │
    │  (Current)        │   │   (Future)        │
    └───────────────────┘   └───────────────────┘
```

## Setup

### 1. Cloudinary Configuration

1. Create a free Cloudinary account at https://cloudinary.com
2. Get your credentials from the dashboard
3. Add to `.env.local`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Create an upload preset in Cloudinary dashboard:
   - Name: `aurora_reels`
   - Signing Mode: Signed
   - Folder: `aurora/reels`
   - Max video duration: 90 seconds
   - Allowed formats: mp4, mov
   - Auto-generate thumbnails: Yes

### 2. Database Schema

The `reels` table stores provider-agnostic video metadata:

```typescript
{
  provider: 'cloudinary' | 'aws' | 'custom',
  externalId: string,  // Provider-specific ID
  videoUrl: string,
  thumbnailUrl: string,
  metadata: {
    width: number,
    height: number,
    duration: number,
    format: string,
    sizeBytes: number
  }
}
```

## Usage

### Backend (Convex)

```typescript
import { api } from './_generated/api';

// Generate upload credentials
const credentials = await ctx.runAction(
  api.reels.generateUploadCredentials,
  { userId: user._id }
);

// Create reel after upload
await ctx.runMutation(api.reels.createReel, {
  authorId: user._id,
  provider: 'cloudinary',
  externalId: 'video_public_id',
  videoUrl: 'https://...',
  thumbnailUrl: 'https://...',
  duration: 45,
  metadata: { ... }
});
```

### Frontend (React)

```typescript
// Will be implemented in Task 44.2
import { useVideoUpload } from '@/hooks/useVideoUpload';

const { upload, progress, error } = useVideoUpload();
```

## Migration Guide

To migrate from Cloudinary to AWS:

1. Create `lib/aws-provider.ts` implementing `VideoProvider`
2. Update environment variables
3. Change provider in `convex/reels.ts`:
   ```typescript
   const { awsProvider } = await import('../lib/aws-provider');
   ```
4. No changes needed in UI components!

## Benefits

✅ **Zero Refactoring**: Swap providers without touching UI code
✅ **Type Safety**: TypeScript interfaces enforce consistency
✅ **Testability**: Easy to mock providers for testing
✅ **Flexibility**: Support multiple providers simultaneously
✅ **Future-Proof**: Add new providers without breaking changes

## Next Steps

- [ ] Task 44.2: Build upload UI and hooks
- [ ] Task 44.3: Implement AI metadata extraction
- [ ] Task 44.4: Create vertical feed viewer
- [ ] Task 44.5: Add discovery and analytics
