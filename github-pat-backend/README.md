# GitHub PAT Backend with Kubernetes Resource Processing

A Go backend system that automatically scans GitHub repositories, extracts Kubernetes resources from YAML/Helm files, and stores them in PostgreSQL with JSONB format.

## 🎯 Features

- 🔐 **User Authentication** - GitHub PAT verification with bcrypt password hashing
- 📁 **Automatic File Scanning** - Scans all files from GitHub repositories on login
- ⚙️ **Helm Template Rendering** - Automatically renders Helm templates with default values
- 🎨 **K8s Resource Extraction** - Parses and extracts Kubernetes resources (Deployments, Services, ConfigMaps, etc.)
- 💾 **JSONB Storage** - Full K8s resources stored as JSONB in PostgreSQL for efficient querying
- 🔄 **Background Processing** - Everything happens automatically after login
- 🔒 **Session Management** - 24-hour session tokens with logout support

## 📋 Prerequisites

- Go 1.21+
- PostgreSQL 17
- GitHub Personal Access Token

## 🚀 Quick Start

### 1. Database Setup

```powershell
# Start PostgreSQL service
net start postgresql-x64-17

# Create database
$env:PGPASSWORD = "12345"
psql -U alivevivek -p 5433 -c "CREATE DATABASE github_pat_db;"
```

### 2. Configuration

Edit `.env` file:
```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=alivevivek
DB_PASSWORD=12345
DB_NAME=github_pat_db
```

### 3. Run Server

```powershell
go run main.go
```

Server starts on `http://localhost:8080`

## 📡 API Endpoints

### Authentication

#### POST /signup
Create a new user account.

**Request:**
```powershell
$signupBody = @{
    organization_name = "MyOrganization"
    github_username = "your_username"
    pat = "github_pat_xxxxx"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/signup" -Method POST -ContentType "application/json" -Body $signupBody
```

**Response:**
```json
{
  "id": 1,
  "org_id": "ABC1234567",
  "github_username": "your_username",
  "created_at": "2026-02-04T10:00:00Z",
  "message": "user created successfully"
}
```

#### POST /login
Login and trigger automatic processing.

**Request:**
```powershell
$loginBody = @{
    github_username = "your_username"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/login" -Method POST -ContentType "application/json" -Body $loginBody
$sessionToken = $response.session_token
```

**Response:**
```json
{
  "message": "login successful",
  "redirect": "/dashboard",
  "session_token": "64-char-hex-token",
  "id": 1,
  "org_id": "ABC1234567",
  "organization_name": "MyOrganization",
  "github_username": "your_username",
  "created_at": "2026-02-04T10:00:00Z",
  "is_active": true,
  "repositories": [
    {
      "id": 1,
      "org_id": "ABC1234567",
      "repo_name": "my-repo",
      "repo_url": "https://github.com/user/my-repo"
    }
  ],
  "total_repos": 1,
  "note": "Files and K8s resources are being processed in background. They will be available shortly."
}
```

**Automatic Processing:**
After login, the system automatically:
1. Fetches all GitHub repositories
2. Scans all files from each repository
3. Stores file metadata in `github_files` table
4. Identifies Kubernetes YAML/Helm files
5. Renders Helm templates with default values
6. Parses YAML to extract K8s resources
7. Stores resources in `kubernetes_resource` table with JSONB

**Wait 30-40 seconds for processing to complete.**

#### POST /logout
Logout and invalidate current session.

**Request:**
```powershell
$logoutBody = @{
    session_token = $sessionToken
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/logout" -Method POST -ContentType "application/json" -Body $logoutBody
```

**Response:**
```json
{
  "message": "logout successful"
}
```

#### POST /logout-all
Logout from all sessions.

**Request:**
```powershell
$logoutAllBody = @{
    session_token = $sessionToken
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/logout-all" -Method POST -ContentType "application/json" -Body $logoutAllBody
```

### Kubernetes Resources

#### POST /k8s-resources
Retrieve all processed Kubernetes resources.

**Request:**
```powershell
$k8sBody = @{
    session_token = $sessionToken
} | ConvertTo-Json

$resources = Invoke-RestMethod -Uri "http://localhost:8080/k8s-resources" -Method POST -ContentType "application/json" -Body $k8sBody
```

**Response:**
```json
{
  "message": "kubernetes resources retrieved",
  "org_id": "ABC1234567",
  "total_resources": 4,
  "resources": [
    {
      "id": "1",
      "kind": "Deployment",
      "name": "frontend-deployment",
      "namespace": "default",
      "cluster_id": "",
      "created_at": "2026-02-04T10:05:00Z",
      "file_path": "k8s/deployment.yaml",
      "repo_name": "my-app"
    },
    {
      "id": "2",
      "kind": "Service",
      "name": "frontend-service",
      "namespace": "default",
      "cluster_id": "",
      "created_at": "2026-02-04T10:05:01Z",
      "file_path": "k8s/service.yaml",
      "repo_name": "my-app"
    }
  ]
}
```

### Optional Manual Triggers

#### POST /scan-files
Manually trigger file scanning (normally automatic on login).

**Request:**
```powershell
$scanBody = @{
    session_token = $sessionToken
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/scan-files" -Method POST -ContentType "application/json" -Body $scanBody
```

#### POST /process-k8s
Manually trigger K8s resource processing (normally automatic on login).

**Request:**
```powershell
$processBody = @{
    session_token = $sessionToken
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/process-k8s" -Method POST -ContentType "application/json" -Body $processBody
```

## 🗄️ Database Schema

### Tables Overview

| Table | Description | Records (Example) |
|-------|-------------|-------------------|
| organization | Organization information | 1 |
| github_credentials | User credentials with encrypted PAT | 1 |
| user_sessions | Active sessions (24h expiry) | 1 |
| github_repository | GitHub repositories | 1 |
| github_files | File metadata from repos | 19 |
| kubernetes_resource | Parsed K8s resources (JSONB) | 4 |
| findings | Security/compliance findings | 0 (future use) |

### 1. organization
Stores organization information with unique `org_id`.

```sql
CREATE TABLE organization (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(10) UNIQUE NOT NULL,  -- 10-char alphanumeric
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Check data:**
```powershell
$env:PGPASSWORD = "12345"
psql -U alivevivek -d github_pat_db -p 5433 -c "SELECT * FROM organization;"
```

### 2. github_credentials
User credentials linked to organization.

```sql
CREATE TABLE github_credentials (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(10) NOT NULL,
    github_username VARCHAR(255) UNIQUE NOT NULL,
    encrypted_pat TEXT NOT NULL,
    password TEXT NOT NULL,  -- bcrypt hashed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (org_id) REFERENCES organization(org_id) ON DELETE CASCADE
);
```

**Check data:**
```powershell
psql -U alivevivek -d github_pat_db -p 5433 -c "SELECT id, org_id, github_username, is_active FROM github_credentials;"
```

### 3. user_sessions
Active user sessions with 24-hour expiration.

```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(64) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    org_id VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES github_credentials(id) ON DELETE CASCADE,
    FOREIGN KEY (org_id) REFERENCES organization(org_id) ON DELETE CASCADE
);
```

**Check data:**
```powershell
psql -U alivevivek -d github_pat_db -p 5433 -c "SELECT id, user_id, org_id, is_active, expires_at FROM user_sessions;"
```

### 4. github_repository
User's GitHub repositories.

```sql
CREATE TABLE github_repository (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(10) NOT NULL,
    cred_id INTEGER NOT NULL,
    repo_name VARCHAR(255) NOT NULL,
    repo_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organization(org_id) ON DELETE CASCADE,
    FOREIGN KEY (cred_id) REFERENCES github_credentials(id) ON DELETE CASCADE
);
```

**Check data:**
```powershell
psql -U alivevivek -d github_pat_db -p 5433 -c "SELECT * FROM github_repository;"
```

### 5. github_files
File metadata from repositories.

```sql
CREATE TABLE github_files (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(10) NOT NULL,
    repo_id INTEGER NOT NULL,
    branch VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    commit_sha VARCHAR(255),
    content_hash VARCHAR(255),
    commit_time TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organization(org_id) ON DELETE CASCADE,
    FOREIGN KEY (repo_id) REFERENCES github_repository(id) ON DELETE CASCADE
);
```

**Check data:**
```powershell
psql -U alivevivek -d github_pat_db -p 5433 -c "SELECT id, file_path, branch FROM github_files LIMIT 10;"
```

### 6. kubernetes_resource
Parsed Kubernetes resources with JSONB storage.

```sql
CREATE TABLE kubernetes_resource (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(10) NOT NULL,
    repo_file_id INTEGER NOT NULL,
    cluster_id VARCHAR(50),
    kind VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    namespace VARCHAR(255),
    yaml_content JSONB,  -- Full K8s resource as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organization(org_id) ON DELETE CASCADE,
    FOREIGN KEY (repo_file_id) REFERENCES github_files(id) ON DELETE CASCADE
);
```

**Check data:**
```powershell
psql -U alivevivek -d github_pat_db -p 5433 -c "SELECT id, kind, name, namespace FROM kubernetes_resource;"
```

**Query JSONB content:**
```powershell
# Get specific fields from JSONB
psql -U alivevivek -d github_pat_db -p 5433 -c "
SELECT 
    kind,
    name,
    yaml_content->'spec'->>'replicas' as replicas,
    yaml_content->'spec'->'template'->'spec'->'containers'->0->>'image' as image
FROM kubernetes_resource
WHERE kind = 'Deployment';
"
```

### 7. findings
Security and compliance findings (future use).

```sql
CREATE TABLE findings (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(10) NOT NULL,
    resource_id INTEGER NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT,
    recommendations TEXT,
    status VARCHAR(50) DEFAULT 'open',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organization(org_id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES kubernetes_resource(id) ON DELETE CASCADE
);
```

## 🔗 Database Relationships

### Check All Relationships

```powershell
$env:PGPASSWORD = "12345"

# 1. Organization -> Credentials -> Session
psql -U alivevivek -d github_pat_db -p 5433 -c "
SELECT 
    o.org_id,
    o.name as org_name,
    gc.github_username,
    us.is_active as session_active
FROM organization o
JOIN github_credentials gc ON o.org_id = gc.org_id
JOIN user_sessions us ON gc.id = us.user_id;
"

# 2. Organization -> Repository -> Files
psql -U alivevivek -d github_pat_db -p 5433 -c "
SELECT 
    o.org_id,
    gr.repo_name,
    COUNT(gf.id) as total_files
FROM organization o
JOIN github_repository gr ON o.org_id = gr.org_id
JOIN github_files gf ON gr.id = gf.repo_id
GROUP BY o.org_id, gr.repo_name;
"

# 3. Files -> Kubernetes Resources
psql -U alivevivek -d github_pat_db -p 5433 -c "
SELECT 
    gf.file_path,
    kr.kind,
    kr.name,
    kr.namespace
FROM github_files gf
JOIN kubernetes_resource kr ON gf.id = kr.repo_file_id
ORDER BY kr.kind, kr.name;
"

# 4. Complete Summary
psql -U alivevivek -d github_pat_db -p 5433 -c "
SELECT 
    o.org_id,
    o.name as organization,
    gc.github_username as user,
    COUNT(DISTINCT gr.id) as repositories,
    COUNT(DISTINCT gf.id) as files,
    COUNT(DISTINCT kr.id) as k8s_resources
FROM organization o
LEFT JOIN github_credentials gc ON o.org_id = gc.org_id
LEFT JOIN github_repository gr ON o.org_id = gr.org_id
LEFT JOIN github_files gf ON gr.id = gf.repo_id
LEFT JOIN kubernetes_resource kr ON gf.id = kr.repo_file_id
GROUP BY o.org_id, o.name, gc.github_username;
"
```

## 📊 Example Queries

### Count Resources by Type
```powershell
psql -U alivevivek -d github_pat_db -p 5433 -c "
SELECT kind, COUNT(*) as count 
FROM kubernetes_resource 
GROUP BY kind 
ORDER BY count DESC;
"
```

### Get Organization with Branch Count
```powershell
psql -U alivevivek -d github_pat_db -p 5433 -c "
SELECT 
    o.name as organization_name,
    COUNT(DISTINCT gf.branch) as total_branches
FROM organization o
JOIN github_repository gr ON o.org_id = gr.org_id
JOIN github_files gf ON gr.id = gf.repo_id
GROUP BY o.name;
"
```

### Query JSONB for Container Images
```powershell
psql -U alivevivek -d github_pat_db -p 5433 -c "
SELECT 
    name,
    jsonb_array_elements(
        yaml_content->'spec'->'template'->'spec'->'containers'
    )->>'image' as image
FROM kubernetes_resource
WHERE kind = 'Deployment';
"
```

### Find Resources with Specific Labels
```powershell
psql -U alivevivek -d github_pat_db -p 5433 -c "
SELECT name, kind
FROM kubernetes_resource
WHERE yaml_content->'metadata'->'labels' ? 'app';
"
```

### View Pretty JSONB
```powershell
psql -U alivevivek -d github_pat_db -p 5433 -c "
SELECT 
    kind,
    name,
    jsonb_pretty(yaml_content) as yaml_json
FROM kubernetes_resource
LIMIT 1;
"
```

## 🎨 Supported Kubernetes Resources

### Namespaced Resources
- Pod, Service, Deployment, StatefulSet, DaemonSet, ReplicaSet
- Job, CronJob, ConfigMap, Secret, Ingress
- PersistentVolumeClaim, ServiceAccount
- Role, RoleBinding, NetworkPolicy, ResourceQuota, LimitRange

### Cluster-Scoped Resources
- Namespace, ClusterRole, ClusterRoleBinding
- PersistentVolume, StorageClass, CustomResourceDefinition

## 🔧 Helm Template Support

The system automatically:
- Detects Helm templates (files with `{{ }}` syntax)
- Renders templates with sensible default values
- Supports `.Values`, `.Release`, `.Chart` variables
- Handles common Helm functions and filters
- Provides defaults for common fields:
  - replicas: 3
  - image: nginx:latest
  - containerPort: 8080
  - serviceType: ClusterIP
  - And more...

## 📝 Complete Step-by-Step Testing Guide

This guide will walk you through testing the entire system from scratch. Follow each step in order.

---

### 🔧 STEP 1: Prerequisites Check

**1.1 Check PostgreSQL Service**
```powershell
# Check if PostgreSQL is running
Get-Service postgresql-x64-17

# If not running, start it
net start postgresql-x64-17
```

**Expected Output:**
```
Status   Name               DisplayName
------   ----               -----------
Running  postgresql-x64-17  PostgreSQL Server 17
```

**1.2 Test Database Connection**
```powershell
$env:PGPASSWORD = "12345"
psql -U alivevivek -d postgres -p 5433 -c "SELECT version();"
```

**Expected Output:** Should show PostgreSQL version information.

**1.3 Create Database (if not exists)**
```powershell
$env:PGPASSWORD = "12345"
psql -U alivevivek -p 5433 -c "CREATE DATABASE github_pat_db;"
```

**Note:** If database already exists, you'll see an error - that's fine!

---

### 🗑️ STEP 2: Clean Database (Fresh Start)

**2.1 Clear All Data**
```powershell
$env:PGPASSWORD = "12345"
psql -U alivevivek -d github_pat_db -p 5433 -c "TRUNCATE TABLE findings, kubernetes_resource, github_files, github_repository, user_sessions, github_credentials, organization RESTART IDENTITY CASCADE;"
```

**Expected Output:**
```
TRUNCATE TABLE
```

**2.2 Verify Tables Are Empty**
```powershell
psql -U alivevivek -d github_pat_db -p 5433 -c "
SELECT 
    'organization' as table_name, COUNT(*) as count FROM organization 
UNION ALL 
SELECT 'github_credentials', COUNT(*) FROM github_credentials
UNION ALL 
SELECT 'user_sessions', COUNT(*) FROM user_sessions
UNION ALL 
SELECT 'github_repository', COUNT(*) FROM github_repository
UNION ALL 
SELECT 'github_files', COUNT(*) FROM github_files
UNION ALL 
SELECT 'kubernetes_resource', COUNT(*) FROM kubernetes_resource;
"
```

**Expected Output:** All counts should be 0.

---

### 🚀 STEP 3: Start the Server

**3.1 Navigate to Project Directory**
```powershell
cd D:\golang-backend-project\github-pat-backend
```

**3.2 Start Server**
```powershell
go run main.go
```

**Expected Output:**
```
✅ Connected to PostgreSQL database
✅ Database tables ready
🚀 Server running on http://localhost:8080
```

**Keep this terminal open!** Open a new PowerShell window for the next steps.

---

### 👤 STEP 4: Create User Account (Signup)

**4.1 Prepare Your Credentials**

Replace these with your actual GitHub credentials:
- `organization_name`: Any name for your organization
- `github_username`: Your GitHub username
- `pat`: Your GitHub Personal Access Token
- `password`: Max 12 characters

**4.2 Signup Request**
```powershell
$signupBody = @{
    organization_name = "MyTestOrg"
    github_username = "aayush270304"
    pat = "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"
    password = "2143253"
} | ConvertTo-Json

$signupResponse = Invoke-RestMethod -Uri "http://localhost:8080/signup" -Method POST -ContentType "application/json" -Body $signupBody
$signupResponse | ConvertTo-Json
```

**Expected Output:**
```json
{
  "message": "user created successfully",
  "id": 1,
  "org_id": "ABC1234567",
  "github_username": "aayush270304",
  "created_at": "2026-02-04T10:00:00Z"
}
```

**4.3 Verify Organization Created**
```powershell
$env:PGPASSWORD = "12345"
psql -U alivevivek -d github_pat_db -p 5433 -c "SELECT * FROM organization;"
```

**Expected Output:**
```
 id |   org_id   |    name     |         created_at
----+------------+-------------+----------------------------
  1 | ABC1234567 | MyTestOrg   | 2026-02-04 10:00:00.123456
```

**4.4 Verify Credentials Created**
```powershell
psql -U alivevivek -d github_pat_db -p 5433 -c "SELECT id, org_id, github_username, is_active FROM github_credentials;"
```

**Expected Output:**
```
 id |   org_id   | github_username | is_active
----+------------+-----------------+-----------
  1 | ABC1234567 | aayush270304    | t
```

---

### 🔐 STEP 5: Login (Triggers Automatic Processing)

**5.1 Login Request**
```powershell
$loginBody = @{
    github_username = "aayush270304"
    password = "2143253"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/login" -Method POST -ContentType "application/json" -Body $loginBody
$loginResponse | ConvertTo-Json -Depth 5
```

**Expected Output:**
```json
{
  "message": "login successful",
  "redirect": "/dashboard",
  "session_token": "a1b2c3d4e5f6...64-char-hex-token",
  "id": 1,
  "org_id": "ABC1234567",
  "organization_name": "MyTestOrg",
  "github_username": "aayush270304",
  "created_at": "2026-02-04T10:00:00Z",
  "is_active": true,
  "repositories": [
    {
      "id": 1,
      "org_id": "ABC1234567",
      "repo_name": "tenant-helm",
      "repo_url": "https://github.com/aayush270304/ten

## 🎯 Expected Results

After complete flow:

| Table | Expected Count |
|-------|----------------|
| organization | 1 |
| github_credentials | 1 |
| user_sessions | 1 |
| github_repository | 1+ |
| github_files | 10-50+ |
| kubernetes_resource | 1-10+ |

**K8s Resources Example:**
- Deployments: 3
- Services: 2
- ConfigMaps: 1
- Total: 6

## 🔒 Security Notes

- Passwords are hashed with bcrypt
- GitHub PAT is stored encrypted
- Sessions expire after 24 hours
- PAT scope validation (temporarily disabled for testing)
- All database operations use parameterized queries

## 📂 Project Structure

```
github-pat-backend/
├── .env                    # Configuration
├── go.mod                  # Dependencies
├── main.go                 # Entry point
├── README.md               # This file
├── database/
│   ├── db.go              # Database schema & connection
│   └── session.go         # Session management
├── github/
│   ├── client.go          # GitHub API client
│   ├── content.go         # File content fetching
│   └── files.go           # File scanning
├── handlers/
│   ├── signup.go          # User registration
│   ├── login.go           # Authentication + auto-processing
│   ├── logout.go          # Session termination
│   ├── dashboard.go       # Dashboard endpoint
│   ├── scan_files.go      # Manual file scanning
│   ├── process_k8s.go     # Manual K8s processing
│   ├── token.go           # Token management
│   └── username.go        # Username management
├── kubernetes/
│   ├── parser.go          # YAML parsing
│   └── helm.go            # Helm template rendering
├── models/
│   ├── models.go          # Data models
│   ├── user.go            # User model
│   ├── organization.go    # Organization model
│   └── kubernetes.go      # K8s model
└── store/
    └── session.go         # Session store
```

## 🚨 Troubleshooting

### Server won't start
```powershell
# Check if port 8080 is in use
netstat -ano | findstr :8080

# Kill process if needed
taskkill /PID <pid> /F
```

### Database connection failed
```powershell
# Check PostgreSQL service
net start postgresql-x64-17

# Test connection
$env:PGPASSWORD = "12345"
psql -U alivevivek -d github_pat_db -p 5433 -c "SELECT 1;"
```

### No K8s resources found
- Wait longer (40-50 seconds after login)
- Check server logs for errors
- Verify files were scanned: `SELECT COUNT(*) FROM github_files;`
- Check if files are K8s-related (YAML with K8s resources)

## 📄 License

MIT
