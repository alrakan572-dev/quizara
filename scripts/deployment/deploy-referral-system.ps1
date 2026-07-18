$ErrorActionPreference = "Stop"

supabase functions deploy create-referral-link --no-verify-jwt
supabase functions deploy get-referral --no-verify-jwt
supabase functions deploy claim-referral --no-verify-jwt

Write-Host "Quizara referral functions deployed successfully." -ForegroundColor Green
