# Quizora — Phase 1 / Step 3: Production Foundation

## Completed in this revision

- Removed the obsolete Home data stack that was not reachable from `src/main.tsx`.
- Kept the active Home flow:
  - `src/app/components/HomePage.tsx`
  - `src/hooks/useHomeData.ts`
  - `src/api/GameAPI.ts`
  - `supabase/functions/get-home-data/index.ts`
- Removed only these legacy files:
  - `src/hooks/useHomeDashboard.ts`
  - `src/home/HomeDataProvider.tsx`
  - `src/app/components/HomeDataBoundary.tsx`
  - `src/app/components/HomeRefreshIndicator.tsx`

## Verification

Executed successfully:

```bash
npm run verify
```

This includes:

- TypeScript check
- Production secret/test-ID audit
- Vite production build

## Active production data path

```text
Telegram Mini App
→ AuthProvider
→ App / Figma pages
→ active hooks and API clients
→ Supabase Edge Functions
→ Supabase Database
```

## Not changed in this revision

- Edge Functions
- Database migrations
- Telegram authentication
- Monetag
- Referral
- Lucky Box
- VIP logic
- Rewards page
- Find Difference import logic

## Next foundation work

- Trace active API and hook dependencies.
- Verify no reachable frontend module imports the direct Supabase client.
- Standardize API error and response contracts without changing production behavior.
- Review Admin route exposure and server-side authorization boundaries.
