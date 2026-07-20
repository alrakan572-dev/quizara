# Quizora Admin Panel — Production Deployment

The admin panel uses the verified Quizora Telegram session and then performs a second server-side authorization check against `public.admin_users`. The service-role key is never exposed to the browser.

## Apply database migrations

```powershell
supabase db push
```

## Add the first administrator

Sign into Quizora once, then use Supabase SQL Editor with your real Telegram ID:

```sql
insert into public.admin_users (user_id, role)
select id, 'super_admin'
from public.users
where telegram_id = YOUR_REAL_TELEGRAM_ID
on conflict (user_id)
do update set role = excluded.role, active = true;
```

Do not place the Telegram ID in source code or frontend environment variables.

## Deploy the admin Edge Functions

```powershell
supabase functions deploy admin-dashboard
supabase functions deploy admin-update-settings
```

## Open the panel

Open the deployed Mini App URL with `?admin=1`. An active administrator row is still required.

## Required production configuration

Vercel frontend variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Supabase Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- the existing Monetag secrets used by the project

Never add server secrets to Vercel frontend variables.

## Release verification

```powershell
npm ci
npm run verify
supabase db push --dry-run
```

Test the normal Mini App and `?admin=1` using both an authorized and unauthorized Telegram account.
