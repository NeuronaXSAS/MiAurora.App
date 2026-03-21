# Aurora Environment Matrix

Aurora now follows one canonical environment model:

- `local`
- `staging`
- `production`

## Core Rules

- `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` must always point to the same backend environment.
- `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, and `NEXT_PUBLIC_WORKOS_REDIRECT_URI` must belong to the same environment.
- Destructive resets are blocked in production unless `ALLOW_PRODUCTION_RESET=true` is explicitly enabled for a controlled operation.
- `ADMIN_API_KEY` is required for admin-triggered automation routes such as daily debate generation.

## Runtime Variables

### Core

- `NODE_ENV`
- `AURORA_ENV` or `APP_ENV`
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`

### Auth

- `AUTH_SESSION_SECRET` or `CONVEX_AUTH_PROOF_SECRET` (required dedicated signing secret)
- `WORKOS_API_KEY`
- `WORKOS_CLIENT_ID`
- `WORKOS_WEBHOOK_SECRET`
- `NEXT_PUBLIC_WORKOS_REDIRECT_URI`

### AI / Search / Content

- `GOOGLE_AI_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `BRAVE_SEARCH_API_KEY`
- `ADMIN_API_KEY`

### Media / Maps / Live

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_MAPBOX_STYLE`
- `NEXT_PUBLIC_AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`

### Analytics / Monetization / Safety

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID`
- `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `STRIPE_SECRET_KEY`

## Canonical Workflows

- Destructive reset path: `api.cleanup.getProductionResetAudit` -> `api.cleanup.executeProductionReset` -> `api.cleanup.verifyProductionResetState`
- Non-production debate pipeline: `/api/debates/generate` with `ADMIN_API_KEY`
- Diagnostics surface: `/admin/system` and `/api/admin/system-diagnostics`

## Current Production Policy

- English-only runtime.
- One Convex pipeline per environment.
- No demo or seeded content in production.
- Fallback AI behavior is acceptable only as a graceful failure mode, not as the primary path.
