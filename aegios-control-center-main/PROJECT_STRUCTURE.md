# Aegios Control Center - Project Structure

## 📁 Root Directory Structure

```
D:\MAJOR-PROJECT\
├── aegios-control-center-main/          # Frontend React Application
│   ├── .vscode/                         # VS Code settings
│   ├── dist/                            # Production build output
│   ├── node_modules/                    # Frontend dependencies
│   ├── public/                          # Static assets
│   │   ├── favicon.ico
│   │   ├── placeholder.svg
│   │   └── robots.txt
│   ├── src/                             # Source code
│   │   ├── components/                  # React components
│   │   │   ├── security/               # Security-specific components
│   │   │   │   ├── ActionsDetailBox.tsx
│   │   │   │   ├── CommandInputArea.tsx
│   │   │   │   ├── LeftSidebar.tsx
│   │   │   │   ├── NamespaceGroupList.tsx
│   │   │   │   ├── RightSidebar.tsx
│   │   │   │   ├── Scoreboard.tsx
│   │   │   │   ├── ScoreVisuals.tsx
│   │   │   │   ├── SecurityLayout.tsx
│   │   │   │   ├── SecurityOverview.tsx
│   │   │   │   ├── ServiceCard.tsx
│   │   │   │   └── ServiceMetaBox.tsx
│   │   │   ├── ui/                     # Shadcn UI components
│   │   │   │   ├── accordion.tsx
│   │   │   │   ├── alert-dialog.tsx
│   │   │   │   ├── alert.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── toaster.tsx
│   │   │   │   └── ... (50+ UI components)
│   │   │   ├── ActivitySidebar.tsx
│   │   │   ├── DashboardFooter.tsx
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── GlobalLayout.tsx
│   │   │   ├── MainDashboard.tsx
│   │   │   ├── NavLink.tsx
│   │   │   ├── ProfileSidebar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── config/                     # Configuration files
│   │   │   └── api.ts                  # API endpoints configuration
│   │   ├── contexts/                   # React Context providers
│   │   │   ├── AuthContext.tsx         # Authentication state
│   │   │   └── SecurityContext.tsx     # Security data state
│   │   ├── hooks/                      # Custom React hooks
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib/                        # Utility libraries
│   │   │   ├── api-client.ts           # HTTP client with error handling
│   │   │   ├── data-transformers.ts    # Backend to frontend data transformation
│   │   │   └── utils.ts                # General utilities
│   │   ├── pages/                      # Page components
│   │   │   ├── auth/                   # Authentication pages
│   │   │   │   ├── ForgotPasswordPage.tsx
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── SignupPage.tsx
│   │   │   ├── security/               # Security pages
│   │   │   │   ├── K8sActionsPage.tsx
│   │   │   │   ├── K8sPosturePage.tsx
│   │   │   │   └── K8sScorePage.tsx
│   │   │   ├── Index.tsx               # Dashboard home
│   │   │   └── NotFound.tsx            # 404 page
│   │   ├── types/                      # TypeScript type definitions
│   │   │   └── security.ts             # Security-related types
│   │   ├── App.css                     # Global styles
│   │   ├── App.tsx                     # Main app component
│   │   ├── index.css                   # Tailwind CSS imports
│   │   └── main.tsx                    # App entry point
│   ├── .env                            # Environment variables (local)
│   ├── .env.example                    # Environment template
│   ├── .gitignore                      # Git ignore rules
│   ├── components.json                 # Shadcn UI config
│   ├── debug-session.html              # Session debugging tool
│   ├── eslint.config.js                # ESLint configuration
│   ├── index.html                      # HTML entry point
│   ├── INTEGRATION_COMPLETE.md         # Integration documentation
│   ├── INTEGRATION_GUIDE.md            # Integration guide
│   ├── INTEGRATION_STATUS.md           # Integration status
│   ├── INTEGRATION_TEST.md             # Testing guide
│   ├── package.json                    # Frontend dependencies
│   ├── package-lock.json               # Dependency lock file
│   ├── postcss.config.js               # PostCSS configuration
│   ├── PROJECT_STRUCTURE.md            # This file
│   ├── README.md                       # Project README
│   ├── REAL_BACKEND_INTEGRATION.md     # Backend integration docs
│   ├── SECURITY_PAGES_README.md        # Security pages documentation
│   ├── SESSION_FIX.md                  # Session management fixes
│   ├── SETUP.md                        # Setup instructions
│   ├── tailwind.config.ts              # Tailwind CSS config
│   ├── test-api.html                   # API testing tool
│   ├── tsconfig.app.json               # TypeScript config (app)
│   ├── tsconfig.json                   # TypeScript config (main)
│   ├── tsconfig.node.json              # TypeScript config (node)
│   └── vite.config.ts                  # Vite configuration
│
└── github-pat-backend/                  # Backend Go Application (Service-Based Architecture)
    ├── pkg/                            # Shared packages
    │   ├── database/                   # Database package
    │   │   ├── connection.go           # DB connection
    │   │   ├── schema.go               # DB schema
    │   │   └── session.go              # Session management
    │   ├── logger/                     # Logging package
    │   │   └── logger.go               # Logger implementation
    │   └── response/                   # Standard response format
    │       └── response.go             # Response helpers
    ├── services/                       # Service-Based Architecture
    │   ├── authentication/             # Authentication Service
    │   │   ├── login.go                # Login endpoint
    │   │   ├── signup.go               # Signup endpoint
    │   │   ├── signout.go              # Signout endpoint
    │   │   └── router.go               # Route registration
    │   ├── fetching-service/           # Fetching Service
    │   │   ├── dashboard.go            # Dashboard summary
    │   │   ├── fetch_data.go           # GitHub scanning
    │   │   ├── validation.go           # Vulnerability detection
    │   │   └── router.go               # Route registration
    │   └── security-service/           # Security Service
    │       ├── k8s_score.go            # Security scoring
    │       ├── k8s_posture.go          # Posture analysis
    │       ├── k8s_action.go           # Action recommendations
    │       ├── k8s_agentic.go          # NLP-driven remediation
    │       └── router.go               # Route registration
    ├── .env                            # Backend environment variables
    ├── .env.example                    # Backend env template
    ├── .gitignore                      # Git ignore rules
    ├── API_GUIDE.md                    # Complete API documentation
    ├── ARCHITECTURE.md                 # Architecture documentation
    ├── go.mod                          # Go module definition
    ├── go.sum                          # Go dependencies checksum
    ├── main.go                         # Backend entry point (service orchestrator)
    ├── main_old_backup.go.bak          # Old monolithic backup (excluded from build)
    └── README.md                       # Backend README
```

---

## 🎯 Key Directories Explained

### Frontend (`aegios-control-center-main/`)

#### `/src/components/`
React components organized by feature:
- **security/**: K8s security visualization components
- **ui/**: Reusable UI components (Shadcn UI)
- **Root level**: Layout and navigation components

#### `/src/contexts/`
Global state management:
- **AuthContext.tsx**: User authentication, login/logout, session management
- **SecurityContext.tsx**: K8s security data, posture, score, actions

#### `/src/config/`
Configuration files:
- **api.ts**: API endpoints, base URLs, environment variables

#### `/src/lib/`
Utility libraries:
- **api-client.ts**: HTTP client with retry logic and error handling
- **data-transformers.ts**: Transform backend responses to frontend types
- **utils.ts**: General utility functions

#### `/src/pages/`
Page-level components:
- **auth/**: Login, signup, password reset pages
- **security/**: K8s security pages (posture, score, actions)

#### `/src/types/`
TypeScript type definitions:
- **security.ts**: Types for K8s resources, scores, actions

---

### Backend (`github-pat-backend/`)

#### `/services/authentication/`
User authentication service:
- **login.go**: Login WITHOUT GitHub fetching, returns session token
- **signup.go**: Signup WITHOUT auto-login, redirects to login
- **signout.go**: Logout functionality
- **router.go**: Route registration for /authentication/*

#### `/services/fetching-service/`
Data fetching and validation service:
- **dashboard.go**: Dashboard summary data
- **fetch_data.go**: GitHub repository scanning and K8s extraction
- **validation.go**: Vulnerability detection
- **router.go**: Route registration for /fetching-service/*

#### `/services/security-service/`
K8s security analysis service:
- **k8s_score.go**: Security scoring (0-100 scale with breakdown)
- **k8s_posture.go**: Security posture analysis (issues detection)
- **k8s_action.go**: Remediation action recommendations
- **k8s_agentic.go**: NLP-driven remediation (APPLY button)
- **router.go**: Route registration for /security-service/*

#### `/pkg/database/`
Database operations:
- PostgreSQL connection management
- Schema definitions
- Session validation
- Query helpers

#### `/pkg/response/`
Standard response format:
- Success/error response helpers
- Consistent API response structure
- HTTP status code handling

---

## 🔗 Data Flow

```
User Browser
    ↓
Frontend (React - Port 8081)
    ↓
API Calls (HTTP POST with session_token)
    ↓
Backend Service Orchestrator (Go - Port 8080)
    ├── /authentication/* → Authentication Service
    ├── /fetching-service/* → Fetching Service
    └── /security-service/* → Security Service
    ↓
PostgreSQL Database (Port 5433)
    ↓
GitHub API (for repo scanning)
```

### Service-Based Architecture

**Authentication Service** (`/authentication`)
- POST /authentication/login
- POST /authentication/signup
- POST /authentication/signout

**Fetching Service** (`/fetching-service`)
- POST /fetching-service/dashboard
- POST /fetching-service/fetch-data
- POST /fetching-service/validation

**Security Service** (`/security-service`)
- POST /security-service/k8s-score
- POST /security-service/k8s-posture
- POST /security-service/k8s-action
- POST /security-service/k8s-agentic

---

## 📊 Database Schema

### Tables (7 total)

1. **organization**
   - org_id (10-digit unique ID)
   - org_code (6-digit code)
   - name
   - created_at

2. **github_credentials**
   - id (user_id)
   - cred_id (6-digit unique ID)
   - org_id (foreign key)
   - github_username
   - encrypted_pat
   - password_hash
   - is_active
   - created_at

3. **user_sessions**
   - id
   - user_id (foreign key)
   - org_id (foreign key)
   - session_token (64-char hex)
   - created_at
   - expires_at (24 hours)

4. **github_repository**
   - id
   - repo_id (6-digit unique ID)
   - org_id (foreign key)
   - repo_name
   - repo_url
   - created_at

5. **github_files**
   - id
   - repo_id (foreign key)
   - branch
   - file_path
   - commit_sha
   - content_hash
   - commit_time
   - is_deleted

6. **kubernetes_resource**
   - id
   - resource_id (6-digit unique ID)
   - org_id (foreign key)
   - repo_file_id (foreign key)
   - kind (Deployment, Service, etc.)
   - name
   - namespace
   - cluster_id
   - yaml_content
   - created_at

7. **findings**
   - id
   - finding_id (6-digit unique ID)
   - org_id (foreign key)
   - resource_id (foreign key)
   - severity
   - category
   - title
   - description
   - remediation
   - status
   - created_at

---

## 🔧 Configuration Files

### Frontend

- **.env**: Environment variables (API URL, mock data flag)
- **vite.config.ts**: Vite build configuration
- **tailwind.config.ts**: Tailwind CSS customization
- **tsconfig.json**: TypeScript compiler options
- **components.json**: Shadcn UI component configuration

### Backend

- **.env**: Database credentials, server port
- **go.mod**: Go module dependencies
- **main.go**: Server initialization, routes, CORS

---

## 🚀 Running the Project

### Frontend
```bash
cd aegios-control-center-main
npm install
npm run dev
# Runs on http://localhost:8081
```

### Backend
```bash
cd github-pat-backend
go run main.go
# Runs on http://localhost:8080
```

### Database
```bash
# PostgreSQL running on port 5433
# Connection details in backend/.env
```

---

## 📝 Important Files

### Documentation
- `INTEGRATION_COMPLETE.md` - Integration status and features
- `API_GUIDE.md` - Complete backend API documentation
- `SESSION_FIX.md` - Session management fixes
- `INTEGRATION_TEST.md` - Testing guide

### Configuration
- `aegios-control-center-main/.env` - Frontend config
- `github-pat-backend/.env` - Backend config

### Entry Points
- `aegios-control-center-main/src/main.tsx` - Frontend entry
- `github-pat-backend/main.go` - Backend entry

### Core Logic
- `src/contexts/SecurityContext.tsx` - Security data management (updated for Phase 2)
- `src/contexts/AuthContext.tsx` - Authentication management (updated for Phase 2)
- `src/components/MainDashboard.tsx` - Dashboard with fetch/validation features
- `services/security-service/k8s_posture.go` - Security analysis
- `services/security-service/k8s_score.go` - Security scoring
- `services/security-service/k8s_action.go` - Remediation actions
- `services/security-service/k8s_agentic.go` - NLP-driven remediation

---

## 🔐 Security Features

### Frontend
- Session token storage in localStorage
- Protected routes with authentication check
- Automatic session restoration on page refresh
- Session expiry handling

### Backend
- Password hashing with bcrypt
- PAT encryption in database
- Session token validation (SHA-256)
- 24-hour session expiry
- CORS enabled for frontend
- Data isolation by org_id

---

## 📦 Dependencies

### Frontend (Key Packages)
- React 18
- TypeScript
- Vite (build tool)
- React Router (routing)
- Tailwind CSS (styling)
- Shadcn UI (components)
- Sonner (toast notifications)
- Tanstack Query (data fetching)

### Backend (Key Packages)
- Go 1.23+
- Gin (HTTP framework)
- PostgreSQL driver (lib/pq)
- Bcrypt (password hashing)
- Godotenv (environment variables)
- Crypto (session tokens)

---

## 🎨 UI Components

### Shadcn UI Components (50+)
- Forms: Input, Label, Select, Checkbox, Radio
- Feedback: Alert, Toast, Dialog, Alert Dialog
- Layout: Card, Separator, Tabs, Accordion
- Navigation: Breadcrumb, Navigation Menu, Menubar
- Data Display: Table, Badge, Avatar, Skeleton
- Overlays: Dialog, Drawer, Popover, Tooltip
- And many more...

---

## 🔄 Current Status

✅ **Phase 1 Complete**: Backend refactored to service-based architecture
✅ **Phase 2 Complete**: Frontend updated for new backend integration

**Working Features**:
- User authentication (signup, login, logout) with standard response format
- Session management with persistence
- K8s security posture analysis
- K8s security scoring with detailed breakdown
- K8s remediation actions
- Agentic NLP-driven remediation
- Dashboard with Fetch Data and Validation buttons
- Security feature selection dropdown
- Scroll navigation for direct URLs
- Real-time data updates (polling every 10s)
- CORS configured
- Data isolation by organization

⚠️ **Known Issues**:
- VS Code shows "main redeclared" error in main.go (cosmetic only - code compiles and runs fine)
  - Fix: Restart Go Language Server in VS Code
  - Impact: None - this is a gopls cache issue

---

## 📈 Future Enhancements

Potential areas for expansion:
- WebSocket support for real-time updates
- Multi-cluster support
- Advanced filtering and search
- Export reports (PDF, CSV)
- Role-based access control
- Audit logging
- Compliance frameworks (CIS, NSA)
- Integration with CI/CD pipelines

---

**Last Updated**: February 15, 2026  
**Version**: 2.0.0 (Service-Based Architecture)  
**Phase**: Phase 2 Complete - Frontend-Backend Integration
