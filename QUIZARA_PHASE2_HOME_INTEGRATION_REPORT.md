# Quizara Phase 2 — Home Integration Audit

## Completed

- Added `lives` and `streak` to the canonical `HomeUser` contract.
- Updated `get-home-data` to select and return real `users.lives` and `users.streak` values.
- Preserved authenticated Telegram session filtering by both internal user id and Telegram id.
- Added Home status summaries for daily challenges, weekly challenges, and remaining Lucky Box openings.
- Added manual refresh UI and a non-blocking stale-data retry state.
- Preserved first-load Loading and Error states.
- Kept the active production path: `HomePage -> useHomeData -> GameAPI -> get-home-data -> Supabase`.
- Included the corrected Find Difference migration signature (`bigint`) to avoid regression.
- Included `vite-env.d.ts` in `tsconfig.json` so VS Code and CLI use the same Vite type contract.

## Verification

- `npm run typecheck`: passed
- `npm run audit:production`: passed
- `npm run build`: passed
- 2041 modules transformed

## Deployment

Deploy the updated Home function:

```powershell
supabase functions deploy get-home-data
```

No new database migration was added in this Home step. The existing users table must already contain the production columns `lives` and `streak`, as established in the project schema.

Then verify locally:

```powershell
npm ci
npm run verify
```

Finally deploy the frontend to Vercel and test Home inside the real Telegram Mini App.
