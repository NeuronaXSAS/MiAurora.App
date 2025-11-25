# Google AdSense Integration

## Setup

1. **Get AdSense Account**: Sign up at https://www.google.com/adsense
2. **Add Site**: Add your domain to AdSense
3. **Get Client ID**: Find your client ID (format: `ca-pub-XXXXXXXXXXXXXXXX`)
4. **Update .env.local**:
   ```
   NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
   ```

## Components

### `NativeAdBanner`
Base ad component that:
- Loads AdSense script
- Hides ads for premium users
- Supports different ad formats (auto, fluid, rectangle)

### `FeedAd`
Feed-specific ad wrapper with Aurora branding

## Usage

Ads are automatically injected every 5th item in the feed. Premium users don't see ads.

## Testing

AdSense requires:
- Approved domain
- Real traffic (test ads won't show in development)
- 24-48 hours for approval

Use AdSense test mode during development.
