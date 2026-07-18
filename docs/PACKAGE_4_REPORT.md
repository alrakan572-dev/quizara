# Quizora Package 4 — Production Audit & Final Testing

## Completed

- Removed unused `react-router` dependency and its security advisories.
- Updated Vite from 6.3.5 to 6.4.3 to resolve known development-server vulnerabilities.
- Added route-level lazy loading for all major application pages.
- Added a shared page loading state while lazy chunks are downloaded.
- Added `npm run typecheck`.
- Added `npm run audit:production` to detect frontend service-role secrets, private keys, and hard-coded Telegram test IDs.
- Added `npm run verify` to run type checking, the production audit, and the production build in one command.
- Added safe Vercel security headers and immutable caching for fingerprinted assets.
- Preserved Telegram embedding compatibility by not adding `X-Frame-Options` or a restrictive `frame-ancestors` policy.
- Preserved all existing pages, Edge Functions, session authentication, referral, profile, settings, delete scheduling, ads, rewards, challenges, and VIP functionality.
- Remote Quiz/PvP remains postponed until approximately 200 users.

## Verification command

```powershell
npm install
npm run verify
npm audit
```

Expected result:

- TypeScript passes.
- Production audit passes.
- Vite production build passes.
- npm audit reports 0 vulnerabilities.

## Deployment

Deploy normally through the connected GitHub/Vercel project. No new database migration or Edge Function deployment is required for Package 4.

## Admin Dashboard readiness

The player application is now ready to remain separate from the Admin Dashboard. The Admin Dashboard should use its own admin authorization layer and server-side Edge Functions; it must never expose the Supabase service-role key in the browser.
