# Migration: Remove Auto-Increment ID from github_credentials

## Summary

Removed the auto-increment `id` column from `github_credentials` table and made `cred_id` the primary key, matching the pattern used in the `organization` table.

## Changes Made

### Database Schema Changes

**Before:**
```sql
github_credentials:
  - id (INTEGER, PRIMARY KEY, AUTO_INCREMENT)  ← Removed
  - cred_id (VARCHAR(10), UNIQUE)              ← Now PRIMARY KEY
  - org_id, github_username, encrypted_pat, password, is_active, created_at

user_sessions:
  - user_id (INTEGER, FOREIGN KEY → github_credentials.id)  ← Changed to cred_id
```

**After:**
```sql
github_credentials:
  - cred_id (VARCHAR(10), PRIMARY KEY)  ← Now PRIMARY KEY
  - org_id, github_username, encrypted_pat, password, is_active, created_at

user_sessions:
  - cred_id (VARCHAR(10), FOREIGN KEY → github_credentials.cred_id)
```

### Code Changes

#### 1. Authentication Service
- **login.go**: Changed to use `cred_id` instead of `userID`
- **signup.go**: Removed `userID` from response, uses `cred_id` as primary identifier
- **LoginResponse.ID**: Changed from `int` to `string` (now contains `cred_id`)
- **SignupResponse.ID**: Changed from `int` to `string` (now contains `cred_id`)

#### 2. Database Package
- **session.go**:
  - `CreateSession()`: Changed parameter from `userID int` to `credID string`
  - `ValidateSession()`: Returns `credID string` instead of `userID int`
  - `InvalidateAllUserSessions()`: Changed parameter from `userID int` to `credID string`
  - `GetUserCredID()`: Now deprecated (credID is already the primary identifier)

#### 3. Fetching Service
- **dashboard.go**: Uses `credID` from `ValidateSession()` directly
- **fetch_data_optimized.go**: Uses `credID` from `ValidateSession()` directly
- **render.go**: Uses `credID` from `ValidateSession()` directly

#### 4. Security Service
- **k8s_score.go**: Uses `credID` from `ValidateSession()` directly
- **k8s_posture.go**: Uses `credID` from `ValidateSession()` directly
- **k8s_action.go**: Uses `credID` from `ValidateSession()` directly
- **k8s_agentic.go**: Uses `credID` from `ValidateSession()` directly

## Migration Steps

### 1. Run the Migration SQL

```powershell
psql -U alivevivek -d github_pat_db -p 5433 -f github-pat-backend\remove_id_from_github_credentials.sql
```

### 2. Restart the Backend

```powershell
cd github-pat-backend
go run main.go
```

### 3. Test

```powershell
# Test signup
Invoke-RestMethod -Uri "http://localhost:8081/authentication/signup" -Method POST -ContentType "application/json" -Body '{"organization_name":"Test Org","github_username":"YOUR_USERNAME","pat":"YOUR_PAT","password":"123"}' | ConvertTo-Json

# Test login
Invoke-RestMethod -Uri "http://localhost:8081/authentication/login" -Method POST -ContentType "application/json" -Body '{"github_username":"YOUR_USERNAME","password":"123"}' | ConvertTo-Json
```

## Benefits

✅ **Consistency**: Matches `organization` table pattern (uses string ID as primary key)  
✅ **Simplicity**: One less ID to manage (`cred_id` serves both purposes)  
✅ **Cleaner Code**: No need for `GetUserCredID()` helper function  
✅ **Better Semantics**: `cred_id` is more meaningful than auto-increment `id`  

## Breaking Changes

⚠️ **API Response Change**: `id` field in login/signup responses is now a string (cred_id) instead of integer  
⚠️ **Database Schema**: Requires migration script to update existing data  
⚠️ **Session Table**: `user_id` column replaced with `cred_id`  

## Rollback

If you need to rollback, you would need to:
1. Add back the `id` column with AUTO_INCREMENT
2. Update `user_sessions` to use `user_id` again
3. Revert all code changes

(Not recommended - better to move forward with the new structure)
