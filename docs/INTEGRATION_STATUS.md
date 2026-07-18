# Quizora integration status

## Connected to Supabase Edge Functions

- Home: `get-home-data`
- General Knowledge: `get-next-game` + `submit-answer`
- Riddles: `get-next-game` + `submit-answer`
- Fastest: `get-next-game` + `submit-answer` with server-measured `answer_time_ms`
- Leaderboard: `get-leaderboard`
- Daily and weekly challenges: `get-active-challenges` + `claim-challenge-reward`
- Lucky Box: `open-lucky-box`
- VIP status: `get-vip-status`

## Preserved but not yet connected to a production API

- Find Difference UI (requires final coordinate/image interaction contract)
- Profile editing
- Invite/referral workflow
- Rewards history
- Telegram Stars checkout
- Telegram `initData` authentication

The application temporarily uses `userId = 1` in `src/app/App.tsx`. Replace this only after server-side Telegram `initData` verification is ready.

## Local setup

Copy `.env.example` to `.env.local` and fill in the public Supabase URL and publishable/anon key. Never place `SUPABASE_SERVICE_ROLE_KEY` in a Vite environment file.
