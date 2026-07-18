# Quizara — Home Dashboard & Smart Refresh

This is part 1 of package 3.

It does not replace the Figma layout. It connects the existing Home UI to real production data.

## 1. Copy files

Copy these folders into the project root:

- `src`
- `supabase`
- `deploy-home-dashboard.ps1`

Approve merge and replacement.

## 2. Wrap the authenticated app

In `App.tsx`, import:

```tsx
import { HomeDataProvider } from "./home/HomeDataProvider";
```

Wrap the authenticated application content:

```tsx
<HomeDataProvider enabled={auth.status === "authenticated"}>
  {/* existing Quizora application */}
</HomeDataProvider>
```

Keep `AuthProvider` outside `HomeDataProvider`.

Recommended structure:

```tsx
<AuthProvider>
  <AppContent />
</AuthProvider>
```

Inside `AppContent`:

```tsx
const auth = useAuth();

return (
  <HomeDataProvider enabled={auth.status === "authenticated"}>
    {/* existing routes and pages */}
  </HomeDataProvider>
);
```

## 3. Connect the current HomePage without changing its design

Import:

```tsx
import { useHomeDashboard } from "../../hooks/useHomeDashboard";
import { HomeDataBoundary } from "./HomeDataBoundary";
import { HomeRefreshIndicator } from "./HomeRefreshIndicator";
```

At the beginning of `HomePage`:

```tsx
const {
  dashboard,
  refresh,
} = useHomeDashboard();
```

Wrap the existing JSX:

```tsx
return (
  <HomeDataBoundary>
    <HomeRefreshIndicator />

    {/* keep the existing Figma HomePage JSX */}
  </HomeDataBoundary>
);
```

Replace old fixed values with:

```tsx
dashboard?.points
dashboard?.level
dashboard?.streak
dashboard?.lives
dashboard?.vipActive
dashboard?.leaderboardRank
dashboard?.totalPlayers
dashboard?.luckyBoxAvailable
dashboard?.daily.items
dashboard?.weekly.items
dashboard?.user.username
dashboard?.user.first_name
dashboard?.user.photo_url
```

Do not insert fallback sample values. During loading, `HomeDataBoundary` handles the screen.

## 4. Smart refresh after successful actions

Import:

```ts
import { requestHomeRefresh } from "../home/homeRefresh";
```

Call it only after a backend operation succeeds.

### Answer submitted

```ts
requestHomeRefresh("answer-submitted", "submit-answer");
```

### Challenge progress updated

```ts
requestHomeRefresh("challenge-updated", "update-challenge-progress");
```

### Challenge reward claimed

```ts
requestHomeRefresh("challenge-reward-claimed", "claim-challenge-reward");
```

### Lucky Box opened

```ts
requestHomeRefresh("lucky-box-opened", "open-lucky-box");
```

### Ad reward claimed

```ts
requestHomeRefresh("ad-reward-claimed", "claim-ad-reward");
```

### Profile saved

```ts
requestHomeRefresh("profile-updated", "update-profile");
```

### Settings saved

```ts
requestHomeRefresh("settings-updated", "update-settings");
```

### Referral claimed

```ts
requestHomeRefresh("referral-claimed", "claim-referral");
```

### VIP changed

```ts
requestHomeRefresh("vip-updated", "activate-vip");
```

The provider prevents rapid duplicate requests and refreshes again when Telegram returns to the foreground.

## 5. Deploy backend

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\deploy-home-dashboard.ps1
```

## 6. Build

```powershell
npm run build
```

## Production rules implemented

- Telegram session only
- no frontend `user_id`
- no frontend `telegram_id`
- no mock data
- no hard-coded player information
- one aggregated Home request
- duplicate request prevention
- request cancellation
- refresh after successful mutations
- refresh when Telegram returns to foreground
- existing Figma design remains under your control
