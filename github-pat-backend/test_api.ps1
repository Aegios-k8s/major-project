# PowerShell Script to Test Aegios Backend API
# Run this after starting the backend with: go run main.go

$BACKEND_URL = "http://localhost:8080"
$EMAIL = "test@example.com"
$PASSWORD = "Test123!"
$GITHUB_USERNAME = "YOUR_GITHUB_USERNAME"  # Replace with your GitHub username
$GITHUB_PAT = "YOUR_GITHUB_PAT"  # Replace with your GitHub PAT

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Aegios Backend API Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method Get
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Signup
Write-Host "Test 2: Signup..." -ForegroundColor Yellow
$signupBody = @{
    username = "testuser"
    email = $EMAIL
    password = $PASSWORD
    github_username = $GITHUB_USERNAME
    github_pat = $GITHUB_PAT
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/authentication/signup" -Method Post -Body $signupBody -ContentType "application/json"
    Write-Host "✅ Signup passed" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "⚠️  Signup may have failed (user might already exist): $_" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Login
Write-Host "Test 3: Login..." -ForegroundColor Yellow
$loginBody = @{
    email = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/authentication/login" -Method Post -Body $loginBody -ContentType "application/json"
    $SESSION_TOKEN = $response.data.session_token
    Write-Host "✅ Login passed" -ForegroundColor Green
    Write-Host "Session Token: $SESSION_TOKEN"
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Fetch Data
Write-Host "Test 4: Fetch Data (this may take 30-60 seconds)..." -ForegroundColor Yellow
$fetchBody = @{
    session_token = $SESSION_TOKEN
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/fetching-service/fetch-data" -Method Post -Body $fetchBody -ContentType "application/json" -TimeoutSec 120
    Write-Host "✅ Fetch data passed" -ForegroundColor Green
    Write-Host "K8s Resources Found: $($response.data.k8s_resources)"
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ Fetch data failed: $_" -ForegroundColor Red
    Write-Host "This might be due to:"
    Write-Host "  - Invalid GitHub PAT"
    Write-Host "  - No repositories found"
    Write-Host "  - No YAML files in repositories"
    exit 1
}
Write-Host ""

# Test 5: Get Posture
Write-Host "Test 5: Get Security Posture..." -ForegroundColor Yellow
$postureBody = @{
    session_token = $SESSION_TOKEN
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/security-service/k8s-posture" -Method Post -Body $postureBody -ContentType "application/json"
    Write-Host "✅ Posture endpoint passed" -ForegroundColor Green
    Write-Host "Total Resources: $($response.data.total_resources)"
    Write-Host "Total Issues: $($response.data.total_issues)"
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ Posture endpoint failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 6: Get Score
Write-Host "Test 6: Get Security Score..." -ForegroundColor Yellow
$scoreBody = @{
    session_token = $SESSION_TOKEN
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/security-service/k8s-score" -Method Post -Body $scoreBody -ContentType "application/json"
    Write-Host "✅ Score endpoint passed" -ForegroundColor Green
    Write-Host "Total Resources: $($response.data.total_resources)"
    Write-Host "Overall Score: $($response.data.overall_score)/$($response.data.max_possible_score)"
    Write-Host "Overall Percentage: $($response.data.overall_percentage)%"
    Write-Host "Overall Grade: $($response.data.overall_grade)"
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ Score endpoint failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Tests Passed! ✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start frontend: cd aegios-control-center-main && npm run dev"
Write-Host "2. Open browser: http://localhost:5173"
Write-Host "3. Login with: $EMAIL / $PASSWORD"
Write-Host "4. Click 'Fetch Data' button (if needed)"
Write-Host "5. Navigate to Security > Posture"
Write-Host ""
Write-Host "If frontend shows 'No Services Found':" -ForegroundColor Yellow
Write-Host "- Open browser DevTools (F12)"
Write-Host "- Check Console tab for errors"
Write-Host "- Check Network tab for API responses"
Write-Host "- Verify session token is being sent"
Write-Host ""
