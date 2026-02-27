# Real Backend Integration Plan

## Overview
Integrating Aegios Control Center frontend with the actual `github-pat-backend` microservices.

---

## Backend Architecture (github-pat-backend)

### Services & Ports
- **Monolith Mode**: Port 8080 (all endpoints)
- **Microservices Mode**:
  - API Gateway: 8080
  - Auth Service: 8081
  - GitHub Service: 8082
  - K8s Service: 8083
  - Findings Service: 8084
  - Organization Service: 8085

### Database
- PostgreSQL on port 5433
- Database: `github_pat_db`

---

## API Endpoints Mapping

### Frontend Pages → Backend Endpoints

#### 1. Authentication Pages
**Frontend**: `/login`, `/signup`, `/forgot-password`
**Backend Endpoints**:
- `POST /signup` or `POST /auth/signup`
- `POST /login` or `POST /auth/login`
- `POST /logout` or `POST /auth/logout`
- `POST /dashboard` or `POST /auth/dashboard`

#### 2. Dashboard Page (`/`)
**Backend Endpoints**:
- `POST /auth/dashboard` - Get user info, repos, stats

#### 3. K8s Score Page (`/security/k8s-score`)
**Backend Endpoints**:
- `POST /k8s/score` or `POST /k8s-score` - Get security score with breakdown

**Response Structure**:
```json
{
  "total_resources": 10,
  "overall_score": 750,
  "max_possible_score": 1000,
  "overall_percentage": 75.0,
  "overall_grade": "C",
  "category_scores": {
    "Deployment": {
      "score": 400,
      "max_score": 500,
      "percentage": 80.0,
      "grade": "B"
    }
  },
  "resource_scores": [...],
  "compliance_status": "Fair - Needs improvement",
  "recommendations": [...]
}
```

#### 4. K8s Posture Page (`/security/k8s-posture`)
**Backend Endpoints**:
- `POST /k8s/posture` - Get security posture analysis

**Response Structure**:
```json
{
  "total_resources": 10,
  "total_issues": 5,
  "critical": 1,
  "high": 2,
  "medium": 1,
  "low": 1,
  "resources": [
    {
      "id": 1,
      "resource_id": "123456",
      "kind": "Deployment",
      "name": "backend-api",
      "namespace": "production",
      "file_path": "k8s/deployment.yaml",
      "repo_name": "infrastructure",
      "issues": [
        "Container may run as root user",
        "No resource limits defined"
      ],
      "severity": "high"
    }
  ]
}
```

#### 5. K8s Actions Page (`/security/k8s-actions`)
**Backend Endpoints**:
- `POST /k8s/actions` - Get remediation actions
- `POST /k8s/apply-action` - Apply security fix

**Get Actions Response**:
```json
{
  "total_actions": 5,
  "actions": [
    {
      "resource_id": "123456",
      "kind": "Deployment",
      "name": "backend-api",
      "namespace": "production",
      "issue": "Container may run as root user",
      "severity": "high",
      "action": "Add securityContext with runAsNonRoot: true",
      "command": "kubectl patch deployment backend-api -n production --type=json -p='[{\"op\":\"add\",\"path\":\"/spec/template/spec/securityContext\",\"value\":{\"runAsNonRoot\":true}}]'"
    }
  ]
}
```

---

## Data Structure Mapping

### Frontend Types → Backend Models

#### Service (Frontend)
```typescript
interface Service {
  id: string;              // Maps to resource_id
  namespace: string;       // Direct mapping
  name: string;           // Direct mapping
  labels: Record<string, string>;  // Extract from yaml_content
  status: "Good" | "Low" | "Critical";  // Calculate from severity
  ports: number[];        // Extract from yaml_content
  recommendations: string[];  // Maps to issues array
  created_at: string;     // Direct mapping
  metadata: Record<string, any>;  // Additional data
}
```

#### K8sScore (Frontend)
```typescript
interface K8sScore {
  total: number;          // total_resources
  counts: {
    Good: number;         // Calculate from severity
    Low: number;
    Critical: number;
  };
  percentages: {
    Good: number;
    Low: number;
    Critical: number;
  };
  score: number;          // overall_percentage
  criticality_level: "Low" | "Medium" | "High";  // From compliance_status
}
```

---

## Integration Steps

### Step 1: Update API Configuration
File: `src/config/api.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  
  ENDPOINTS: {
    // Authentication
    AUTH: {
      SIGNUP: `${API_BASE_URL}/signup`,
      LOGIN: `${API_BASE_URL}/login`,
      LOGOUT: `${API_BASE_URL}/logout`,
      DASHBOARD: `${API_BASE_URL}/dashboard`,
    },
    
    // Kubernetes
    K8S: {
      SCORE: `${API_BASE_URL}/k8s/score`,
      POSTURE: `${API_BASE_URL}/k8s/posture`,
      ACTIONS: `${API_BASE_URL}/k8s/actions`,
      APPLY_ACTION: `${API_BASE_URL}/k8s/apply-action`,
      RESOURCES: `${API_BASE_URL}/k8s-resources`,
    },
    
    // GitHub
    GITHUB: {
      SCAN_FILES: `${API_BASE_URL}/scan-files`,
      GET_FILES: `${API_BASE_URL}/github/files`,
    },
  },
};
```

### Step 2: Create Data Transformation Layer
File: `src/lib/data-transformers.ts`

Transform backend responses to frontend format:
- Convert posture data to Service[]
- Convert score data to K8sScore
- Map severity levels to status

### Step 3: Update SecurityContext
File: `src/contexts/SecurityContext.tsx`

Replace mock data with real API calls:
- `fetchServices()` → Call `/k8s/posture`
- `fetchScore()` → Call `/k8s/score`
- Transform responses to match frontend types

### Step 4: Update AuthContext
File: `src/contexts/AuthContext.tsx`

Implement real authentication:
- `login()` → Call `/login` with session_token
- `signup()` → Call `/signup`
- Store session_token in localStorage
- Pass session_token in all API requests

### Step 5: Remove Mock Data
- Remove hardcoded services from SecurityContext
- Remove mock score data
- Keep mock data as fallback only if API fails

---

## Environment Variables

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_ENABLE_MOCK_DATA=false
```

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=alivevivek
DB_PASSWORD=12345
DB_NAME=github_pat_db
```

---

## Testing Plan

### 1. Start Backend
```powershell
cd github-pat-backend
go run main.go
```

### 2. Verify Backend
```powershell
# Test health
curl http://localhost:8080/dashboard -Method POST -Body '{"session_token":"test"}' -ContentType "application/json"
```

### 3. Start Frontend
```powershell
cd aegios-control-center-main
npm run dev
```

### 4. Test Flow
1. Signup → Create account
2. Login → Get session_token
3. Dashboard → View repos and stats
4. K8s Score → View security score
5. K8s Posture → View services with issues
6. K8s Actions → Apply remediation

---

## Key Differences from Test Backend

### 1. Authentication
- **Test Backend**: No real auth, mock sessions
- **Real Backend**: Session tokens required for all endpoints

### 2. Data Structure
- **Test Backend**: Simple mock services
- **Real Backend**: Real K8s resources from GitHub repos

### 3. Endpoints
- **Test Backend**: RESTful with GET/POST
- **Real Backend**: All POST with session_token in body

### 4. Real-time Updates
- **Test Backend**: WebSocket for live updates
- **Real Backend**: No WebSocket (polling required)

---

## Next Steps

1. ✅ Remove test backend folder
2. ⏳ Update API configuration
3. ⏳ Create data transformers
4. ⏳ Update SecurityContext
5. ⏳ Update AuthContext
6. ⏳ Test integration
7. ⏳ Remove mock data fallbacks

---

## Notes

- Backend uses POST for all endpoints (including reads)
- All requests require `session_token` in body
- No WebSocket support (use polling for updates)
- Backend returns different data structure than test backend
- Need transformation layer to map backend → frontend types

