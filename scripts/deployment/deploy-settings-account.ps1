$ErrorActionPreference = "Stop"

supabase functions deploy get-settings --no-verify-jwt
supabase functions deploy update-settings --no-verify-jwt
supabase functions deploy delete-account --no-verify-jwt
supabase functions deploy cancel-delete-account --no-verify-jwt

Write-Host "Quizara settings and account functions deployed." -ForegroundColor Green
