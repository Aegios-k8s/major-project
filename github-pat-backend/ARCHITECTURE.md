# GitHub PAT Backend - System Architecture

## Overview
A microservices-based backend system for managing GitHub repositories, scanning files, and extracting Kubernetes resources with security posture analysis.

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Microservices](#microservices)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Data Flow](#data-flow)
6. [Security Features](#security-features)
7. [Deployment](#deployment)

---

## System Architecture

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway (8080)                       │
│                    Routes requests to services                   │
└────────┬────────┬────────┬────────┬────────┬─────────────────────┘
         │        │        │        │        │
    ┌────▼───┐ ┌─▼────┐ ┌─▼────┐ ┌─▼──────┐ ┌▼──────────┐
    │ Auth   │ │GitHub│ │ K8s  │ │Findings│ │Organization│
    │Service │ │Service│ │Service│ │Service │ │  Service   │
    │ 8081   │ │ 8082 │ │ 8083 │ │  8084  │ │   8085     │
    └────┬───┘ └──┬───┘ └──┬───┘ └───┬────┘ └─────┬──────┘
         │        │        │         │            │
         └────────┴────────┴─────────┴────────────┘
                          │
                    ┌─────▼──────┐
                    │ PostgreSQL │
                    │   :5433    │
                    └────────────┘
```

### Technology Stack
- **Language:** Go 1.21+
- **Database:** PostgreSQL 15+
- **HTTP Framework:** net/http (standard library)
- **Authentication:** bcrypt + session tokens
- **External APIs:** GitHub REST API v3

---

## Microservices

### 1. API Gateway (Port 8080)
**Purpose:** Central entry point for all client requests

**Responsibilities:**
- Route requests to appropriate microservices
- Request/response proxying
- CORS handling
- Request logging

**Routes:**
- `/auth/*` → Auth Service
- `/github/*` → GitHub Service
- `/k8s/*` → K8s Service
- `/findings/*` → Findings Service
- `/org/*` → Organization Service

**File:** `cmd/api-gateway/main.go`

---

### 2. Auth Service (Port 8081)
**Purpose:** User authentication and session management

**Endpoints:**
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - User login with credentials
- `POST /auth/logout` - Logout single session
- `POST /auth/logout-all` - Logout all sessions
- `POST /auth/dashboard` - Get user dashboard data
- `POST /auth/validate-session` - Validate session token

**Features:**
- Password hashing with bcrypt
- GitHub PAT verification
- Session token generation (SHA-256)
- Multi-organization support
- Automatic repository syncing on first login

**File:** `services/auth/handler.go`

---

### 3. GitHub Service (Port 8082)
**Purpose:** GitHub integration and file scanning

**Endpoints:**
- `POST /github/scan-files` - Scan all repository files
- `POST /github/get-files` - Retrieve stored files

**Features:**
- Repository discovery
- File tree traversal
- Commit tracking
- File deduplication (commit_sha + content_hash)
- Branch detection
- Background processing

**File:** `services/github/handler.go`

**GitHub API Integration:**
- User verification
- Repository listing
- File content fetching
- Commit history
- Branch information

---

### 4. K8s Service (Port 8083)
**Purpose:** Kubernetes resource extraction and analysis

**Endpoints:**
- `POST /k8s/get-resources` - Get all K8s resources
- `POST /k8s/posture` - Security posture analysis
- `POST /k8s/actions` - Get remediation actions
- `POST /k8s/apply-action` - Apply security fix
- `POST /k8s/score` - Get security score

**Features:**
- YAML parsing
- Helm template rendering
- Resource validation
- Security posture analysis
- Compliance scoring
- Automated remediation suggestions

**Supported Resources:**
- Deployments
- Services
- ConfigMaps
- Secrets
- Ingress
- StatefulSets
- DaemonSets
- Jobs
- CronJobs

**File:** `services/k8s/handler.go`

---

### 5. Findings Service (Port 8084)
**Purpose:** Security findings and vulnerability management

**Endpoints:**
- `POST /findings/list` - List all findings

**Features:**
- Finding categorization
- Severity levels
- Status tracking
- Remediation tracking

**File:** `services/findings/handler.go`

---

### 6. Organization Service (Port 8085)
**Purpose:** Organization management

**Endpoints:**
- `POST /org/info` - Get organization information

**Features:**
- Organization details
- Member management
- Settings management

**File:** `services/organization/handler.go`

---

## Database Schema

### Tables Overview

#### 1. **organization**
Stores organization information
```sql
- id (PK, serial)
- org_id (UNIQUE, VARCHAR(10)) - 10-digit business key
- org_code (UNIQUE, VARCHAR(6)) - 6-digit code
- name (VARCHAR(255))
- created_at (TIMESTAMP)
```

#### 2. **github_credentials**
User credentials and GitHub PAT
```sql
- id (PK, serial)
- cred_id (UNIQUE, VARCHAR(6)) - 6-digit business key
- org_id (FK → organization.org_id, CASCADE)
- github_username (UNIQUE, VARCHAR(255))
- encrypted_pat (TEXT)
- password (TEXT) - bcrypt hashed
- created_at (TIMESTAMP)
- is_active (BOOLEAN)
```

#### 3. **github_repository**
GitHub repositories
```sql
- id (PK, serial)
- repo_id (UNIQUE, VARCHAR(6)) - 6-digit business key
- org_id (FK → organization.org_id, CASCADE)
- cred_id (FK → github_credentials.cred_id, CASCADE)
- repo_name (VARCHAR(255))
- repo_url (TEXT)
- created_at (TIMESTAMP)
```

#### 4. **github_files**
Scanned files from repositories
```sql
- id (PK, serial)
- org_id (FK → organization.org_id, CASCADE)
- repo_id (FK → github_repository.repo_id, CASCADE)
- branch (VARCHAR(255))
- file_path (TEXT)
- commit_sha (VARCHAR(40))
- content_hash (VARCHAR(64))
- commit_time (TIMESTAMP)
- is_deleted (BOOLEAN)
- created_at (TIMESTAMP)
- UNIQUE(commit_sha, content_hash) - Deduplication
```

#### 5. **kubernetes_resource**
Extracted Kubernetes resources
```sql
- id (PK, serial)
- resource_id (UNIQUE, VARCHAR(6)) - 6-digit business key
- org_id (FK → organization.org_id, CASCADE)
- repo_file_id (FK → github_files.id, CASCADE)
- cluster_id (VARCHAR(255))
- kind (VARCHAR(50)) - Deployment, Service, etc.
- name (VARCHAR(255))
- namespace (VARCHAR(255))
- yaml_content (JSONB)
- created_at (TIMESTAMP)
```

#### 6. **findings**
Security findings
```sql
- id (PK, serial)
- finding_id (UNIQUE, VARCHAR(6)) - 6-digit business key
- org_id (FK → organization.org_id, CASCADE)
- resource_id (FK → kubernetes_resource.resource_id, CASCADE)
- severity (VARCHAR(20))
- category (VARCHAR(100))
- description (TEXT)
- remediation (TEXT)
- status (VARCHAR(20))
- created_at (TIMESTAMP)
```

#### 7. **user_sessions**
Active user sessions
```sql
- id (PK, serial)
- user_id (FK → github_credentials.id, CASCADE)
- org_id (FK → organization.org_id, CASCADE)
- session_token (UNIQUE, VARCHAR(64))
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP)
```

### Key Design Decisions

1. **Business Keys (6-digit IDs)**
   - All major entities have 6-digit random IDs (100000-999999)
   - Used for external references and API responses
   - Prevents sequential ID enumeration attacks

2. **Cascade Deletes**
   - Deleting organization removes all related data
   - Maintains referential integrity
   - Simplifies cleanup operations

3. **File Deduplication**
   - UNIQUE constraint on (commit_sha, content_hash)
   - Prevents duplicate file storage
   - Reduces database size

4. **JSONB for K8s Resources**
   - Flexible schema for different resource types
   - Enables JSON queries
   - Preserves original YAML structure

---

## API Endpoints

### Authentication Flow

#### 1. Signup
```http
POST /auth/signup
Content-Type: application/json

{
  "organization_name": "MyCompany",
  "github_username": "username",
  "pat": "github_pat_xxx",
  "password": "password123"
}

Response:
{
  "message": "user created successfully",
  "id": 1,
  "cred_id": "123456",
  "org_id": "1234567890",
  "org_code": "654321",
  "github_username": "username",
  "created_at": "2026-02-07T20:45:38Z"
}
```

#### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "github_username": "username",
  "password": "password123"
}

Response:
{
  "message": "login successful",
  "session_token": "abc123...",
  "org_id": "1234567890",
  "repositories": [...],
  "note": "Files and K8s resources are being processed in background"
}
```

#### 3. Dashboard
```http
POST /auth/dashboard
Content-Type: application/json

{
  "session_token": "abc123..."
}

Response:
{
  "user": {...},
  "organization": {...},
  "repositories": [...],
  "stats": {
    "total_repos": 5,
    "total_files": 150,
    "k8s_resources": 12
  }
}
```

### GitHub Operations

#### Scan Files
```http
POST /github/scan-files
Content-Type: application/json

{
  "session_token": "abc123..."
}

Response:
{
  "message": "repository scan completed",
  "scanned_repos": 5,
  "total_files": 150,
  "errors": []
}
```

#### Get Files
```http
POST /github/get-files
Content-Type: application/json

{
  "session_token": "abc123..."
}

Response:
{
  "total_files": 150,
  "files": [
    {
      "id": 1,
      "repo_id": "123456",
      "file_path": "deployment.yaml",
      "commit_sha": "abc123...",
      "commit_time": "2026-02-07T20:00:00Z"
    }
  ]
}
```

### Kubernetes Operations

#### Get Resources
```http
POST /k8s/get-resources
Content-Type: application/json

{
  "session_token": "abc123..."
}

Response:
{
  "total_resources": 12,
  "resources": [
    {
      "resource_id": "789012",
      "kind": "Deployment",
      "name": "backend-api",
      "namespace": "production",
      "file_path": "k8s/deployment.yaml",
      "repo_name": "infrastructure"
    }
  ]
}
```

---

## Data Flow

### 1. User Registration & Login Flow
```
User → API Gateway → Auth Service
                         ↓
                   Verify GitHub PAT
                         ↓
                   Create Organization
                         ↓
                   Store Credentials
                         ↓
                   Create Session
                         ↓
                   Return Token
```

### 2. Repository Scanning Flow
```
Login → Auth Service
           ↓
    Fetch GitHub Repos
           ↓
    Store in Database
           ↓
    Background Process:
           ↓
    For each repo:
      - Fetch file tree
      - Get commit info
      - Store files (deduplicated)
      - Extract K8s resources
      - Analyze security posture
```

### 3. K8s Resource Extraction Flow
```
File Scan → Identify YAML files
               ↓
         Parse YAML content
               ↓
         Render Helm templates (if needed)
               ↓
         Validate K8s schema
               ↓
         Store as JSONB
               ↓
         Generate findings
```

---

## Security Features

### 1. Authentication
- **Password Hashing:** bcrypt with default cost (10)
- **Session Tokens:** SHA-256 hashed random strings
- **Token Expiry:** 24 hours default
- **GitHub PAT Verification:** Real-time validation

### 2. Authorization
- **Org-based Isolation:** All queries filtered by org_id
- **Session Validation:** Every request validates session token
- **Cascade Permissions:** User can only access their org's data

### 3. Data Protection
- **SQL Injection Prevention:** Parameterized queries
- **CORS:** Configurable CORS middleware
- **Password Constraints:** Max 12 characters
- **Business Key IDs:** Non-sequential 6-digit IDs

### 4. GitHub Integration
- **PAT Validation:** Verify token before storage
- **Rate Limiting:** Respect GitHub API limits
- **Error Handling:** Graceful degradation

---

## Deployment

### Prerequisites
- Go 1.21+
- PostgreSQL 15+
- GitHub Personal Access Token

### Environment Variables
```bash
DB_HOST=localhost
DB_PORT=5433
DB_USER=alivevivek
DB_PASSWORD=12345
DB_NAME=github_pat_db
SERVICE_PORT=8080  # Varies per service
```

### Build All Services
```bash
make build-all
```

### Start Microservices
```powershell
.\scripts\run-all-services.ps1
```

### Stop All Services
```powershell
.\scripts\stop-all-services.ps1
```

### Service Ports
- API Gateway: 8080
- Auth Service: 8081
- GitHub Service: 8082
- K8s Service: 8083
- Findings Service: 8084
- Organization Service: 8085

---

## Folder Structure

```
github-pat-backend/
├── api/
│   └── openapi/              # API specifications
├── authentication/           # Auth handlers (signup, login, logout)
│   ├── login.go
│   ├── logout.go
│   └── signup.go
├── bin/                      # Compiled binaries
│   ├── api-gateway.exe
│   ├── auth-service.exe
│   ├── github-service.exe
│   ├── k8s-service.exe
│   ├── findings-service.exe
│   └── organization-service.exe
├── cmd/                      # Service entry points
│   ├── api-gateway/
│   ├── auth-service/
│   ├── github-service/
│   ├── k8s-service/
│   ├── findings-service/
│   └── organization-service/
├── docker/                   # Docker configurations
├── github/                   # GitHub integration
│   ├── client.go
│   ├── user.go
│   ├── repository.go
│   ├── files.go
│   ├── content.go
│   ├── commits.go
│   ├── branches.go
│   ├── webhooks.go
│   └── handlers.go
├── handlers/                 # HTTP handlers
│   └── process_k8s.go
├── kubernetes/               # K8s resource handling
│   ├── parser.go
│   ├── helm.go
│   ├── posture.go
│   ├── action.go
│   └── score.go
├── pkg/                      # Shared packages
│   ├── config/
│   │   └── config.go
│   ├── database/
│   │   ├── db.go
│   │   ├── session.go
│   │   ├── organization.go
│   │   ├── credentials.go
│   │   ├── repository.go
│   │   ├── files.go
│   │   ├── kubernetes.go
│   │   └── findings.go
│   ├── errors/
│   │   └── errors.go
│   ├── httpclient/
│   │   └── client.go
│   ├── logger/
│   │   └── logger.go
│   ├── middleware/
│   │   ├── auth.go
│   │   ├── cors.go
│   │   └── logging.go
│   └── models/
│       ├── models.go
│       ├── user.go
│       ├── organization.go
│       └── kubernetes.go
├── scripts/                  # Automation scripts
│   ├── run-all-services.ps1
│   ├── stop-all-services.ps1
│   └── test-microservices.ps1
├── services/                 # Microservice handlers
│   ├── auth/
│   ├── github/
│   ├── k8s/
│   ├── findings/
│   └── organization/
├── .env                      # Environment variables
├── go.mod                    # Go dependencies
├── go.sum
├── main.go                   # Monolith entry point
├── Makefile                  # Build automation
├── ARCHITECTURE.md           # This file
├── API_GUIDE.md              # API documentation
└── README.md                 # Project overview
```

---

## Performance Considerations

### 1. Background Processing
- File scanning runs asynchronously after login
- K8s resource extraction happens in background
- Prevents blocking user login

### 2. Database Optimization
- Indexes on foreign keys
- UNIQUE constraints for deduplication
- JSONB for flexible K8s storage

### 3. Caching Strategy
- Session tokens cached in memory (future)
- GitHub API responses cached (future)
- K8s resource analysis cached (future)

---

## Future Enhancements

### 1. Scalability
- [ ] Redis for session storage
- [ ] Message queue for background jobs
- [ ] Database read replicas
- [ ] Service discovery (Consul/etcd)

### 2. Features
- [ ] Webhook support for real-time updates
- [ ] Multi-cluster K8s support
- [ ] Advanced security scanning
- [ ] Compliance reporting
- [ ] Role-based access control (RBAC)

### 3. Monitoring
- [ ] Prometheus metrics
- [ ] Distributed tracing (Jaeger)
- [ ] Centralized logging (ELK)
- [ ] Health check endpoints

---

## Testing

### Manual Testing
```bash
# Test signup
curl -X POST http://localhost:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"organization_name":"Test","github_username":"user","pat":"token","password":"pass"}'

# Test login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"github_username":"user","password":"pass"}'
```

### Automated Testing
```bash
# Run test script
.\scripts\test-microservices.ps1
```

---

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running on port 5433
   - Verify credentials in .env file
   - Check firewall settings

2. **GitHub API Rate Limit**
   - Use authenticated requests
   - Implement exponential backoff
   - Cache responses

3. **Service Not Starting**
   - Check port availability
   - Verify environment variables
   - Check logs for errors

4. **K8s Resources Not Extracted**
   - Verify YAML syntax
   - Check file extensions (.yaml, .yml)
   - Review parser logs

---

## Contributing

### Code Style
- Follow Go conventions
- Use gofmt for formatting
- Add comments for exported functions
- Write meaningful commit messages

### Pull Request Process
1. Create feature branch
2. Write tests
3. Update documentation
4. Submit PR with description

---

## License

MIT License - See LICENSE file for details

---

## Contact

For questions or support, please open an issue on GitHub.

---

**Last Updated:** February 7, 2026
**Version:** 1.0.0
