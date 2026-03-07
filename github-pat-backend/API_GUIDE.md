# GitHub PAT Backend - Complete API Guide

## 🚀 Quick Start

### Server URLs

**Monolith (Single Server):**
- URL: `http://localhost:8080`
- All endpoints available directly

**Microservices Architecture:**
- **API Gateway:** `http://localhost:8080` (Routes to all services)
- **Auth Service:** `http://localhost:8081`
- **GitHub Service:** `http://localhost:8082`
- **K8s Service:** `http://localhost:8083`
- **Findings Service:** `http://localhost:8084`
- **Organization Service:** `http://localhost:8085`

### Test Credentials
- **User 1:**
  - GitHub Username: `aayush270304`
  - PAT: `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`
  - Password: `2143253`
  - Organization: `MyCompany`

- **User 2:**
  - GitHub Username: `ajeebsagar`
  - PAT: `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`
  - Password: `123456456`
  - Organization: `hello`

---

## 📋 Table of Contents

### Authentication & User Management
1. [Signup](#1-signup)
2. [Login](#2-login)
3. [Logout](#3-logout)
4. [Logout All Devices](#4-logout-all-devices)
5. [Dashboard](#5-dashboard)
6. [Validate Session](#6-validate-session)

### GitHub Operations
7. [Scan Repository Files](#7-scan-repository-files)
8. [Get Files](#8-get-files)

### Kubernetes Operations
9. [Get K8s Resources](#9-get-k8s-resources)
10. [Process K8s Resources](#10-process-k8s-resources)
11. [Get Security Posture](#11-get-security-posture)
12. [Get Remediation Actions](#12-get-remediation-actions)
13. [Apply Action](#13-apply-action)
14. [Get Security Score](#14-get-security-score)

### Findings & Organization
15. [List Findings](#15-list-findings)
16. [Get Organization Info](#16-get-organization-info)

---

## Authentication & User Management

### 1. Signup

**Endpoint:** `POST /auth/signup` (Microservices) or `POST /signup` (Monolith)

**Service:** Auth Service (Port 8081)

**Description:** Create a new user account with organization. Validates GitHub username and PAT in real-time.

**Request Body:**
```json
{
  "organization_name": "MyCompany",
  "github_username": "aayush270304",
  "pat": "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",
  "password": "2143253"
}
```

**Field Requirements:**
- `organization_name` - Required, any string
- `github_username` - Required, must be valid GitHub username
- `pat` - Required, must be valid GitHub Personal Access Token
- `password` - Required, max 12 characters

**Success Response (201):**
```json
{
  "message": "user created successfully",
  "id": 1,
  "cred_id": "674157",
  "org_id": "8745657385",
  "org_code": "907437",
  "github_username": "aayush270304",
  "created_at": "2026-02-07T20:45:38.061779Z"
}
```

**Error Responses:**
- `400` - "all fields are required"
- `400` - "password must be 12 characters or less"
- `401` - "invalid GitHub username or PAT"
- `409` - "github username already exists"
- `500` - "database error"

**What Happens:**
1. ✅ Validates all required fields
2. ✅ Checks password length (max 12 chars)
3. ✅ Verifies GitHub username and PAT with GitHub API
4. ✅ Generates unique 10-digit org_id
5. ✅ Generates unique 6-digit org_code
6. ✅ Creates organization record
7. ✅ Generates unique 6-digit cred_id
8. ✅ Hashes password with bcrypt
9. ✅ Stores credentials with encrypted PAT
10. ✅ Returns user details

**cURL Example:**
```bash
curl -X POST http://localhost:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "MyCompany",
    "github_username": "aayush270304",
    "pat": "github_pat_xxx",
    "password": "2143253"
  }'
```

---

### 2. Login

**Endpoint:** `POST /auth/login` (Microservices) or `POST /login` (Monolith)

**Service:** Auth Service (Port 8081)

**Description:** Authenticate user and create session. Automatically syncs repositories and scans files in background on first login.

**Request Body:**
```json
{
  "github_username": "aayush270304",
  "password": "2143253"
}
```

**Success Response (200):**
```json
{
  "message": "login successful",
  "redirect": "/dashboard",
  "session_token": "b4a78cb59cef68c1f07da9b1174c314f4005f049e4f37b517d903e4e20cd0c5c",
  "id": 2,
  "cred_id": "170710",
  "org_id": "7820009270",
  "org_code": "615639",
  "organization_name": "MyCompany",
  "github_username": "aayush270304",
  "created_at": "2026-02-07T21:02:10.135966Z",
  "is_active": true,
  "repositories": [
    {
      "id": 29,
      "repo_id": "886915",
      "org_id": "7820009270",
      "repo_name": "tenant-helm",
      "repo_url": "https://github.com/Aegios-k8s/tenant-helm"
    }
  ],
  "total_repos": 1,
  "note": "Files and K8s resources are being processed in background. They will be available shortly."
}
```

**Error Responses:**
- `400` - "github_username and password are required"
- `400` - "password must be 12 characters or less"
- `401` - "invalid credentials"
- `401` - "github token verification failed"
- `403` - "account is inactive"
- `500` - "database error"

**What Happens:**
1. ✅ Validates credentials
2. ✅ Verifies password with bcrypt
3. ✅ Verifies PAT with GitHub API
4. ✅ Fetches repositories from GitHub
5. ✅ **First Login Only:** Syncs all repositories to database
6. ✅ **Subsequent Logins:** Skips sync to preserve data
7. ✅ Creates session token (SHA-256, 24-hour expiry)
8. ✅ **Background Process:** Scans all files from repositories
9. ✅ **Background Process:** Extracts K8s resources from YAML files
10. ✅ Returns session token and repository list

**Background Processing (First Login Only):**
- Runs asynchronously (doesn't block login)
- Scans all files from each repository
- Stores file metadata: path, branch, commit SHA, content hash
- Parses YAML files for K8s resources
- Extracts Deployments, Services, ConfigMaps, etc.
- Files available within 5-10 seconds
- K8s resources available within 10-15 seconds

**Session Token:**
- 64-character hexadecimal string
- Valid for 24 hours
- Required for all authenticated endpoints
- Stored in `user_sessions` table

**cURL Example:**
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "github_username": "aayush270304",
    "password": "2143253"
  }'
```

---

### 3. Logout

**Endpoint:** `POST /auth/logout` (Microservices) or `POST /logout` (Monolith)

**Service:** Auth Service (Port 8081)

**Description:** Logout from current device only. Invalidates the current session token.

**Request Body:**
```json
{
  "session_token": "b4a78cb59cef68c1f07da9b1174c314f4005f049e4f37b517d903e4e20cd0c5c"
}
```

**Success Response (200):**
```json
{
  "message": "logout successful",
  "status": "success"
}
```

**Error Responses:**
- `400` - "session_token is required"
- `401` - "invalid or expired session"
- `500` - "database error"

**What Happens:**
1. ✅ Validates session token
2. ✅ Deletes session from database
3. ✅ User remains logged in on other devices
4. ✅ Session token becomes invalid

**cURL Example:**
```bash
curl -X POST http://localhost:8080/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "your_session_token_here"
  }'
```

---

### 4. Logout All Devices

**Endpoint:** `POST /auth/logout-all` (Microservices) or `POST /logout-all` (Monolith)

**Service:** Auth Service (Port 8081)

**Description:** Logout from all devices. Invalidates all session tokens for the user.

**Request Body:**
```json
{
  "session_token": "b4a78cb59cef68c1f07da9b1174c314f4005f049e4f37b517d903e4e20cd0c5c"
}
```

**Success Response (200):**
```json
{
  "message": "logged out from all devices successfully",
  "status": "success"
}
```

**Error Responses:**
- `400` - "session_token is required"
- `401` - "invalid or expired session"
- `500` - "database error"

**What Happens:**
1. ✅ Validates session token
2. ✅ Finds user ID from session
3. ✅ Deletes ALL sessions for the user
4. ✅ User logged out from all devices
5. ✅ All session tokens become invalid

**cURL Example:**
```bash
curl -X POST http://localhost:8080/auth/logout-all \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "your_session_token_here"
  }'
```

---

### 5. Dashboard

**Endpoint:** `POST /auth/dashboard` (Microservices) or `POST /dashboard` (Monolith)

**Service:** Auth Service (Port 8081)

**Description:** Get user dashboard with organization and repository information.

**Request Body:**
```json
{
  "session_token": "b4a78cb59cef68c1f07da9b1174c314f4005f049e4f37b517d903e4e20cd0c5c"
}
```

**Success Response (200):**
```json
{
  "message": "dashboard data retrieved successfully",
  "user": {
    "id": 2,
    "cred_id": "170710",
    "github_username": "aayush270304",
    "created_at": "2026-02-07T21:02:10.135966Z",
    "is_active": true
  },
  "organization": {
    "org_id": "7820009270",
    "org_code": "615639",
    "name": "MyCompany"
  },
  "repositories": [
    {
      "id": 29,
      "repo_id": "886915",
      "repo_name": "tenant-helm",
      "repo_url": "https://github.com/Aegios-k8s/tenant-helm"
    }
  ],
  "stats": {
    "total_repos": 1,
    "total_files": 19,
    "k8s_resources": 3
  }
}
```

**Error Responses:**
- `400` - "session_token is required"
- `401` - "invalid or expired session"
- `500` - "database error"

**cURL Example:**
```bash
curl -X POST http://localhost:8080/auth/dashboard \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "your_session_token_here"
  }'
```

---

### 6. Validate Session

**Endpoint:** `POST /auth/validate-session` (Microservices only)

**Service:** Auth Service (Port 8081)

**Description:** Validate if a session token is still valid. Used by other microservices.

**Request Body:**
```json
{
  "session_token": "b4a78cb59cef68c1f07da9b1174c314f4005f049e4f37b517d903e4e20cd0c5c"
}
```

**Success Response (200):**
```json
{
  "valid": true,
  "user_id": 2,
  "org_id": "7820009270"
}
```

**Error Response (401):**
```json
{
  "valid": false,
  "error": "invalid or expired session"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8081/auth/validate-session \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "your_session_token_here"
  }'
```

---

## GitHub Operations

### 7. Scan Repository Files

**Endpoint:** `POST /github/scan-files` (Microservices) or `POST /scan-files` (Monolith)

**Service:** GitHub Service (Port 8082)

**Description:** Manually trigger file scanning for all repositories. Useful if background scan failed or to refresh files.

**Request Body:**
```json
{
  "session_token": "b4a78cb59cef68c1f07da9b1174c314f4005f049e4f37b517d903e4e20cd0c5c"
}
```

**Success Response (200):**
```json
{
  "message": "repository scan completed",
  "scanned_repos": 1,
  "total_files": 19,
  "errors": []
}
```

**With Errors:**
```json
{
  "message": "repository scan completed",
  "scanned_repos": 3,
  "total_files": 45,
  "errors": [
    "Failed to fetch files from repo-name: rate limit exceeded"
  ]
}
```

**Error Responses:**
- `400` - "invalid request body"
- `401` - "invalid or expired session"
- `500` - "failed to get credentials"
- `500` - "failed to fetch repositories"

**What Happens:**
1. ✅ Validates session token
2. ✅ Gets user's GitHub PAT
3. ✅ Fetches all repositories for organization
4. ✅ For each repository:
   - Gets default branch
   - Fetches complete file tree
   - Gets commit info for each file
   - Generates content hash
   - Checks for duplicates (commit_sha + content_hash)
   - Stores new files only
5. ✅ Returns scan statistics

**File Deduplication:**
- Files are deduplicated using UNIQUE(commit_sha, content_hash)
- Same file won't be stored twice
- Reduces database size
- Preserves file history

**cURL Example:**
```bash
curl -X POST http://localhost:8080/github/scan-files \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "your_session_token_here"
  }'
```

---

### 8. Get Files

**Endpoint:** `POST /github/get-files` (Microservices) or `POST /github/files` (Monolith)

**Service:** GitHub Service (Port 8082)

**Description:** Retrieve all scanned files for the organization.

**Request Body:**
```json
{
  "session_token": "b4a78cb59cef68c1f07da9b1174c314f4005f049e4f37b517d903e4e20cd0c5c"
}
```

**Success Response (200):**
```json
{
  "total_files": 19,
  "files": [
    {
      "id": 1,
      "repo_id": "886915",
      "branch": "main",
      "file_path": "Helm/charts/backend-common/Chart.yaml",
      "commit_sha": "7a57626e1d14c5a5331ccdec9b271b31145b1bd6",
      "content_hash": "abc123def456...",
      "commit_time": "2026-02-07T20:00:00Z",
      "is_deleted": false
    }
  ]
}
```

**Error Responses:**
- `400` - "invalid request body"
- `401` - "invalid or expired session"
- `500` - "failed to fetch files"

**cURL Example:**
```bash
curl -X POST http://localhost:8080/github/get-files \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "your_session_token_here"
  }'
```

---

## Kubernetes Operations

### 9. Get K8s Resources

**Endpoint:** `POST /k8s/get-resources` (Microservices) or `POST /k8s-resources` (Monolith)

**Service:** K8s Service (Port 8083)

**Description:** Get all extracted Kubernetes resources from YAML files.

**Request Body:**
```json
{
  "session_token": "b4a78cb59cef68c1f07da9b1174c314f4005f049e4f37b517d903e4e20cd0c5c"
}
```

**Success Response (200):**
```json
{
  "total_resources": 3,
  "resources": [
    {
      "id": 1,
      "resource_id": "123456",
      "kind": "Service",
      "name": "backend-service",
      "namespace": "default",
      "cluster_id": "production",
      "file_path": "Helm/charts/backend-common/templates/service.yaml",
      "repo_name": "tenant-helm",
      "created_at": "2026-02-07T21:05:00Z"
    }
  ]
}
```

**Supported Resource Types:**
- Deployment, Service, ConfigMap, Secret, Ingress
- StatefulSet, DaemonSet, Job, CronJob
- PersistentVolumeClaim, ServiceAccount
- Role, RoleBinding, ClusterRole, ClusterRoleBinding

**cURL Example:**
```bash
curl -X POST http://localhost:8080/k8s/get-resources \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "your_session_token_here"
  }'
```

---

### 10. Process K8s Resources

**Endpoint:** `POST /k8s/process` (Microservices) or `POST /process-k8s` (Monolith)

**Service:** K8s Service (Port 8083)

**Description:** Manually trigger K8s resource extraction from YAML files.

**Request Body:**
```json
{
  "session_token": "b4a78cb59cef68c1f07da9b1174c314f4005f049e4f37b517d903e4e20cd0c5c"
}
```

**Success Response (200):**
```json
{
  "message": "kubernetes resources processed successfully",
  "total_files": 19,
  "processed_files": 8,
  "k8s_resources_found": 3
}
```

---

### 11-14. K8s Security Features

Additional K8s endpoints for security posture, remediation actions, and scoring are available. See ARCHITECTURE.md for full details.

---

## 🗄️ Database Schema

### Tables (7 total):
1. **organization** - Organization details
2. **github_credentials** - User credentials with encrypted PAT
3. **user_sessions** - Active user sessions
4. **github_repository** - User's GitHub repositories
5. **github_files** - All files from repositories
6. **kubernetes_resource** - Parsed Kubernetes resources
7. **findings** - Security/compliance findings

---

## ✅ Features

- ✅ User authentication with GitHub PAT validation
- ✅ Session management (24-hour expiry)
- ✅ Automatic repository discovery
- ✅ Automatic file scanning on first login
- ✅ K8s resource extraction
- ✅ Security posture analysis
- ✅ Multi-organization support
- ✅ File deduplication
- ✅ Background processing

---

## 🔐 Security Features

- ✅ Passwords hashed with bcrypt
- ✅ PAT encrypted in database
- ✅ Session tokens (64-char hex)
- ✅ Session expiration (24 hours)
- ✅ GitHub API validation
- ✅ SQL injection protection
- ✅ Business key IDs (6-digit)

---

**Last Updated:** February 7, 2026
**Version:** 2.0.0
