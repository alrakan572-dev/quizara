$ErrorActionPreference = "Stop"

$functions = @(
  "activate-vip",
  "claim-ad-reward",
  "claim-challenge-reward",
  "get-active-challenges",
  "get-home-data",
  "get-leaderboard",
  "get-next-game",
  "get-vip-status",
  "open-lucky-box",
  "submit-answer",
  "update-challenge-progress"
)

foreach ($functionName in $functions) {
  Write-Host "Deploying $functionName..." -ForegroundColor Cyan
  supabase functions deploy $functionName --no-verify-jwt
  if ($LASTEXITCODE -ne 0) {
    throw "Deployment failed for $functionName"
  }
}

Write-Host "All session-protected functions deployed successfully." -ForegroundColor Green
