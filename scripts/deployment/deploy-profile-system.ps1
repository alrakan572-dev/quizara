$ErrorActionPreference = "Stop"
supabase functions deploy get-profile --no-verify-jwt
supabase functions deploy update-profile --no-verify-jwt
Write-Host "Quizara profile functions deployed successfully." -ForegroundColor Green
