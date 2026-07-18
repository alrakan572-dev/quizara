$ErrorActionPreference = "Stop"

supabase functions deploy get-home-data --no-verify-jwt

Write-Host "Quizara Home Dashboard backend deployed successfully." -ForegroundColor Green
