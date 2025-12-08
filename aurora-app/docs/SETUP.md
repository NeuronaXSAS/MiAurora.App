# Aurora App - Setup Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Convex account (free)
- WorkOS account (free)
- Google AI Studio API key (free)
- Mapbox account (free)

## Environment Variables

### Required Variables

```env
# Convex
CONVEX_DEPLOYMENT=your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# WorkOS Authentication
WORKOS_API_KEY=sk_live_...
WORKOS_CLIENT_ID=client_...
WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google AI Studio (FREE - 200 requests/day)
GOOGLE_AI_API_KEY=AIza...

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

### Optional Variables (Graceful Degradation)

```env
# AWS Bedrock (Content Seeding) - $100 credit
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Brave Search API
BRAVE_SEARCH_API_KEY=BSA...

# Twilio SMS (shows simulation mode if missing)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Cloudinary (video uploads disabled if missing)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Monetization
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-...
```

## AWS Setup (Optional - For Content Seeding)

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com/
2. Create account with email
3. Add payment method (won't charge with free tier + credits)

### Step 2: Apply Credits
1. Go to https://console.aws.amazon.com/billing/home#/credits
2. Click "Redeem credit"
3. Enter your credit code

### Step 3: Create IAM User
1. Go to https://console.aws.amazon.com/iam/
2. Users → Create user
3. Name: `aurora-app-bedrock`
4. Attach policy: `AmazonBedrockFullAccess`
5. Create user

### Step 4: Get API Keys
1. Click on user → Security credentials
2. Create access key → "Application running outside AWS"
3. Copy both values (shown only once)

### Step 5: Add to Environment
```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

## Vercel Deployment

### Environment Variables to Add
Add these in Vercel Dashboard → Settings → Environment Variables:

**Required:**
- `NEXT_PUBLIC_CONVEX_URL`
- `WORKOS_API_KEY`
- `WORKOS_CLIENT_ID`
- `WORKOS_REDIRECT_URI` (use production URL)
- `NEXT_PUBLIC_APP_URL` (use production URL)
- `GOOGLE_AI_API_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

**Optional (add if using):**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `BRAVE_SEARCH_API_KEY`

### Deploy Commands
```bash
# Sync Convex schema first
npx convex deploy

# Then deploy to Vercel
vercel --prod
```

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Convex (terminal 1)
npx convex dev

# 3. Start Next.js (terminal 2)
npm run dev

# 4. Open browser
open http://localhost:3000
```

## Testing

```bash
# Type check
npm run type-check

# E2E tests
npm run test:e2e

# Build verification
npm run build
```

## Troubleshooting

### "Convex schema out of sync"
```bash
npx convex dev --once
```

### "WorkOS redirect error"
- Check `WORKOS_REDIRECT_URI` matches your URL exactly
- Ensure URL is added in WorkOS dashboard

### "Gemini API error"
- Check `GOOGLE_AI_API_KEY` is valid
- Verify you haven't exceeded 200 requests/day

### "AWS Bedrock access denied"
- Ensure IAM user has `AmazonBedrockFullAccess` policy
- Check region is `us-east-1` (Bedrock availability)
