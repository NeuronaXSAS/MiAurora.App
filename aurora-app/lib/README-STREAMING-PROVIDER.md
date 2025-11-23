# Aurora Live - Streaming Provider Architecture

## Overview

Aurora Live uses a **provider-agnostic architecture** for livestreaming, similar to our video upload system. This allows easy migration between streaming services (Agora, Twilio, AWS IVS, etc.) without changing application code.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 React Components                     │
│         (LivestreamHost, LivestreamViewer)          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│            StreamingProvider Interface               │
│  (start, stop, join, leave, toggleCamera, etc.)    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              AgoraProvider Implementation            │
│         (Wraps agora-rtc-sdk-ng)                    │
└─────────────────────────────────────────────────────┘
```

## Components

### 1. StreamingProvider Interface (`lib/streaming-provider.ts`)

Defines the contract that all streaming providers must implement:

```typescript
interface StreamingProvider {
  initialize(config: StreamConfig): Promise<void>;
  startBroadcast(options?: BroadcastOptions): Promise<void>;
  stopBroadcast(): Promise<void>;
  joinAsViewer(): Promise<void>;
  leave(): Promise<void>;
  toggleCamera(enabled: boolean): Promise<void>;
  toggleMicrophone(enabled: boolean): Promise<void>;
  switchCamera(): Promise<void>;
  getDevices(): Promise<Devices>;
  getStats(): Promise<StreamStats>;
  setVideoQuality(quality: Quality): Promise<void>;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  destroy(): Promise<void>;
}
```

### 2. AgoraProvider (`lib/agora-provider.ts`)

Concrete implementation using Agora RTC SDK:

- Wraps `agora-rtc-sdk-ng` (vanilla JS SDK)
- Handles connection, publishing, subscribing
- Manages local and remote tracks
- Provides event system for UI updates

### 3. Backend (`convex/livestreams.ts`)

Manages livestream metadata and state:

- `createLivestream` - Start a new stream
- `endLivestream` - End a stream
- `getLivestreams` - Get active streams
- `joinLivestream` - Track viewer joins
- `leaveLivestream` - Track viewer leaves
- `likeLivestream` - Like/unlike streams

### 4. Token Generation (`convex/actions/agora.ts`)

Generates Agora RTC tokens:

- **Test Mode**: Returns App ID with null token (for demo)
- **Production Mode**: Generates signed tokens with App Certificate

## Database Schema

### `livestreams` Table

```typescript
{
  hostId: Id<"users">,
  channelName: string,        // Agora channel name
  title: string,
  description?: string,
  status: "live" | "ended" | "scheduled",
  viewerCount: number,        // Current viewers
  peakViewerCount: number,    // Max concurrent
  totalViews: number,         // Total unique
  likes: number,
  safetyMode: boolean,        // AI moderation
  isEmergency: boolean,       // Emergency broadcast
  location?: { name, coordinates },
  scheduledFor?: number,
  startedAt?: number,
  endedAt?: number,
  isPrivate: boolean,
  allowedViewers?: Id<"users">[]
}
```

### `livestreamViewers` Table

Tracks who's watching:

```typescript
{
  livestreamId: Id<"livestreams">,
  userId: Id<"users">,
  joinedAt: number,
  leftAt?: number,
  isActive: boolean
}
```

### `livestreamLikes` Table

Tracks likes:

```typescript
{
  livestreamId: Id<"livestreams">,
  userId: Id<"users">
}
```

## Usage Example

### Starting a Broadcast (Host)

```typescript
import { AgoraProvider } from '@/lib/agora-provider';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// 1. Create livestream record
const createLivestream = useMutation(api.livestreams.createLivestream);
const result = await createLivestream({
  hostId: userId,
  title: "Safety Walk in Downtown",
  safetyMode: true,
});

// 2. Get Agora token
const generateToken = useAction(api.actions.agora.generateAgoraToken);
const tokenData = await generateToken({
  channelName: result.channelName,
  userId: userId,
  role: 'host',
});

// 3. Initialize provider
const provider = new AgoraProvider();
await provider.initialize({
  channelName: result.channelName,
  token: tokenData.token,
  appId: tokenData.appId,
  uid: userId,
});

// 4. Start broadcasting
await provider.startBroadcast({
  video: true,
  audio: true,
});

// 5. Play local video
provider.playLocalVideo('local-video-container');
```

### Joining as Viewer

```typescript
// 1. Get livestream info
const livestream = useQuery(api.livestreams.getLivestream, {
  livestreamId: livestreamId,
});

// 2. Join as viewer
const joinLivestream = useMutation(api.livestreams.joinLivestream);
await joinLivestream({
  livestreamId: livestreamId,
  userId: userId,
});

// 3. Get Agora token
const tokenData = await generateToken({
  channelName: livestream.channelName,
  userId: userId,
  role: 'audience',
});

// 4. Initialize provider
const provider = new AgoraProvider();
await provider.initialize({
  channelName: livestream.channelName,
  token: tokenData.token,
  appId: tokenData.appId,
  uid: userId,
});

// 5. Join as viewer
await provider.joinAsViewer();

// 6. Listen for remote streams
provider.on('user-published', (user, mediaType, track) => {
  if (mediaType === 'video') {
    provider.playRemoteVideo(track, 'remote-video-container');
  }
});
```

## Events

The provider emits events for UI updates:

```typescript
provider.on('connected', () => {
  console.log('Connected to stream');
});

provider.on('user-joined', (user) => {
  console.log('User joined:', user);
});

provider.on('user-published', (user, mediaType, track) => {
  console.log('User published:', mediaType);
});

provider.on('network-quality', (stats) => {
  console.log('Network quality:', stats);
});

provider.on('stream-error', (error) => {
  console.error('Stream error:', error);
});
```

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Agora Configuration
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here  # Optional for test mode
```

### Test Mode vs Production

**Test Mode** (No App Certificate):
- Suitable for development and demos
- No token required (null token)
- Less secure
- Easy to set up

**Production Mode** (With App Certificate):
- Required for production
- Generates signed tokens
- Secure authentication
- Prevents unauthorized access

## Video Quality Presets

```typescript
const VideoQualityPresets = {
  low: { width: 320, height: 240, frameRate: 15, bitrate: 200 },
  medium: { width: 640, height: 480, frameRate: 24, bitrate: 500 },
  high: { width: 1280, height: 720, frameRate: 30, bitrate: 1000 },
  hd: { width: 1920, height: 1080, frameRate: 30, bitrate: 2000 },
};
```

## Credits System

### Host Rewards

- **Start Stream**: 25 credits
- **10+ Peak Viewers**: +15 credits
- **50+ Peak Viewers**: +30 credits
- **100+ Peak Viewers**: +50 credits
- **20+ Likes**: +10 credits
- **50+ Likes**: +20 credits

### Viewer Actions

- **Watch Stream**: Free
- **Like Stream**: Free
- **Send Super Like**: 5 credits (future feature)

## Safety Features

### Safety Mode

When enabled:
- AI monitors stream content
- Detects potential safety issues
- Flags inappropriate content
- Alerts moderators

### Emergency Broadcasts

Special livestream type for emergencies:
- Prioritized in feed
- Notifies nearby users
- Alerts emergency contacts
- Records for evidence

## Future Enhancements

1. **Screen Sharing**: Share screen during stream
2. **Chat**: Real-time text chat
3. **Reactions**: Emoji reactions
4. **Recording**: Save streams for replay
5. **Co-hosting**: Multiple hosts
6. **Virtual Backgrounds**: Privacy protection
7. **Beauty Filters**: Video enhancement
8. **Analytics**: Detailed stream metrics

## Migration to Other Providers

To switch from Agora to another provider:

1. Create new provider class (e.g., `TwilioProvider`)
2. Implement `StreamingProvider` interface
3. Update initialization code
4. No changes to UI components needed!

Example:

```typescript
// Before
const provider = new AgoraProvider();

// After
const provider = new TwilioProvider();

// Everything else stays the same!
```

## Troubleshooting

### Common Issues

1. **"Client not initialized"**
   - Call `initialize()` before other methods

2. **"Permission denied"**
   - User must grant camera/microphone permissions

3. **"Network error"**
   - Check internet connection
   - Verify Agora App ID

4. **"Token expired"**
   - Regenerate token (1 hour expiry)

### Debug Mode

Enable Agora SDK logging:

```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';
AgoraRTC.setLogLevel(0); // DEBUG level
```

## Resources

- [Agora RTC SDK Documentation](https://docs.agora.io/en/video-calling/overview/product-overview)
- [Agora Token Builder](https://docs.agora.io/en/video-calling/develop/authentication-workflow)
- [Best Practices](https://docs.agora.io/en/video-calling/develop/best-practices)

---

This architecture provides a solid foundation for Aurora Live while maintaining flexibility for future enhancements and provider migrations.
