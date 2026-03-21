# Aurora Security Deployment Checklist

## Required Secrets

- Set `AUTH_SESSION_SECRET` or `CONVEX_AUTH_PROOF_SECRET` in both Next.js and Convex.
- Rotate all third-party credentials after this hardening pass:
  - `WORKOS_API_KEY`
  - `WORKOS_WEBHOOK_SECRET`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `GOOGLE_AI_API_KEY`
  - `BRAVE_SEARCH_API_KEY`
  - `TWILIO_AUTH_TOKEN`
  - `AWS_SECRET_ACCESS_KEY`
  - `CLOUDINARY_API_SECRET`
  - `AGORA_APP_CERTIFICATE`

## Vercel

- Mark production secrets as Sensitive environment variables.
- Enable deployment protection on preview deployments.
- Restrict who can view preview URLs.
- Review firewall / WAF rules for abusive traffic to:
  - `/api/search/brave`
  - `/api/analyze/argument`
  - `/api/analytics/batch`
  - `/api/ai/search-summary`

## GitHub

- Enable Secret Scanning.
- Enable Push Protection.
- Enable CodeQL default setup.
- Enable Dependabot alerts and security updates.
- Review repository Actions permissions and keep them least-privilege.

## Operations

- Monitor rate-limit data in Convex after deploy.
- Rebuild Convex generated files before type-checking or CI:
  - `npx convex dev`
  - or `npx convex deploy`
- Re-test admin diagnostics and content-generation flows with an actual admin account.
