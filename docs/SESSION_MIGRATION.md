# Quizara Session Backend — Corrected Production Package

This package uses the real game-engine layout:

- `core/`
- `repositories/`
- `services/`

The root `_shared/game-engine/index.ts` exports those three real module indexes.

## Installation

Copy the `supabase` folder into the project root and allow replacement/merge.

## Deployment

PowerShell temporary execution-policy option:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\deploy-session-functions.ps1
```

Or deploy each function manually with `--no-verify-jwt`.

## Security behavior

User-facing functions authenticate with `requireTelegramSession(request)` and derive the user from the Quizara session token. They must not trust `user_id` or `telegram_id` from the frontend.
