# PowerShell Script to Test Validation Endpoints
$BACKEND_URL = "http://localhost:8080"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Validation Endpoints" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# First, let's get a valid session token by querying the database
Write-Host "Fetching active session token from database..." -ForegroundColor Yellow

$query = "SELECT session_token FROM user_sessions WHERE is_active = true ORDER BY created_at DESC LIMIT 1;"
$env:PGPASSWORD = "12345"
$sessionToken = & psql -h localhost -p 5433 -U alivevivek -d github_pat_db -t -c $query 2>$null

if ($sessionToken) {
    $sessionToken = $sessionToken.Trim()
    Write-Host "✅ Found session token: $sessionToken" -ForegroundColor Green
} else {
    Write-Host "❌ No active session found. Please login first." -ForegroundColor Red
    Write-Host "Run: ./test_api.ps1 to create a session" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method Get
    Write-Host "✅ Health check passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Fetching Service Validation (Helm Rendering)
Write-Host "Test 2: Fetching Service Validation (Helm Rendering)..." -ForegroundColor Yellow
$validationBody = @{
    session_token = $sessionToken
    release_name = "test-release"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/fetching-service/rendering" -Method Post -Body $validationBody -ContentType "application/json" -TimeoutSec 120
    Write-Host "✅ Helm validation passed" -ForegroundColor Green
    Write-Host "Resources stored: $($response.data.resources)" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ Helm validation failed: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Security Service Namespace Validation
Write-Host "Test 3: Security Service Namespace Validation..." -ForegroundColor Yellow
$namespaceValidationBody = @{
    session_token = $sessionToken
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/security-service/validate-namespaces" -Method Post -Body $namespaceValidationBody -ContentType "application/json"
    Write-Host "✅ Namespace validation passed" -ForegroundColor Green
    Write-Host "Total namespaces: $($response.data.total_namespaces)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Validation Results:" -ForegroundColor Cyan
    foreach ($result in $response.data.validation_results) {
        Write-Host "  Namespace: $($result.namespace)" -ForegroundColor White
        if ($result.missing_kinds.Count -eq 0) {
            Write-Host "    ✅ All required kinds present" -ForegroundColor Green
        } else {
            Write-Host "    ⚠️  Missing kinds: $($result.missing_kinds -join ', ')" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    Write-Host "Full Response:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ Namespace validation failed: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Validation Tests Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
