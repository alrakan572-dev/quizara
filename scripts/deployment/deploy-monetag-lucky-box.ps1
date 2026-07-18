$ErrorActionPreference = "Stop"
supabase functions deploy claim-ad-reward --no-verify-jwt
supabase functions deploy get-ad-reward-status --no-verify-jwt
supabase functions deploy monetag-postback --no-verify-jwt
supabase functions deploy open-lucky-box --no-verify-jwt
supabase functions deploy get-home-data --no-verify-jwt
Write-Host "Quizara Monetag Lucky Box deployed successfully." -ForegroundColor Green
