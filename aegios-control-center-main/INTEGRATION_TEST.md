# Frontend-Backend Integration Test Guide

## ✅ Backend Status
- **URL**: http://localhost:8080
- **Status**: Running with CORS enabled
- **Database**: Connected to PostgreSQL (port 5433)

## ✅ Frontend Status
- **URL**: http://localhost:8081
- **Status**: Running with Vite
- **API Base URL**: http://localhost:8080 (configured in .env)

## 🔐 Test Credentials

### Existing User (from database)
- **GitHub Username**: `aayush270304`
- **Password**: `2143253`
- **Organization**: MyCompany
- **Org ID**: 7989893212

### For New Signup
- **Organization Name**: Any name you want
- **GitHub Username**: Your real GitHub username
- **PAT**: Your GitHub Personal Access Token
- **Password**: Max 12 characters

## 🧪 Testing Steps

### 1. Test Login
1. Open browser: http://localhost:8081
2. Click "Sign in" (or navigate to /login)
3. Enter credentials:
   - Username: `aayush270304`
   - Password: `2143253`
4. Click "Sign In"
5. ✅ Should redirect to /dashboard with success toast

### 2. Test Signup
1. Navigate to /signup
2. Fill in the form:
   - Organization Name: TestOrg
   - GitHub Username: (your real GitHub username)
   - GitHub PAT: (your real GitHub token)
   - Password: (max 12 chars)
3. Click "Sign Up"
4. ✅ Should show success message and redirect to /login

### 3. Test Security Dashboard
1. After logging in, you should see:
   - Security score (calculated from K8s resources)
   - List of K8s resources with security status
   - Recommendations for each resource
2. Data refreshes every 10 seconds automatically

### 4. Test Logout
1. Click logout button
2. ✅ Should clear session and redirect to login

## 🔍 What's Integrated

### ✅ Authentication
- [x] Signup with GitHub PAT validation
- [x] Login with session token
- [x] Logout (single device)
- [x] Session persistence in localStorage

### ✅ Security Features
- [x] Fetch K8s security posture from backend
- [x] Fetch security score from backend
- [x] Transform backend data to frontend types
- [x] Auto-refresh every 10 seconds (polling)
- [x] Display resources by namespace
- [x] Show security recommendations

### ✅ Data Flow
1. User logs in → Backend validates → Returns session_token
2. Frontend stores session_token in localStorage
3. Frontend calls /k8s/posture with session_token
4. Backend returns K8s resources with security analysis
5. Frontend transforms data and displays
6. Frontend polls every 10 seconds for updates

## 🐛 Troubleshooting

### Login Not Working
- Check browser console for errors
- Verify backend is running: `curl http://localhost:8080/login -Method POST`
- Check CORS headers are present
- Verify credentials are correct

### No Data Showing
- Check if user has K8s resources in database
- Open browser DevTools → Network tab
- Look for /k8s/posture and /k8s/score requests
- Check response data

### CORS Errors
- Backend now has CORS middleware enabled
- Allows all origins (*)
- Allows POST, GET, PUT, DELETE, OPTIONS methods

## 📊 Current Database State

### Resources in Database
- **Organizations**: 1 (MyCompany)
- **Users**: 1 (aayush270304)
- **Repositories**: 1 (tenant-helm)
- **Files**: 19 scanned files
- **K8s Resources**: 7 resources
  - 3 Services
  - 2 Deployments
  - 2 ConfigMaps
- **Namespaces**: default, frontend-ns, dummy-tenant

## 🎯 Next Steps

1. Test login with existing credentials
2. Verify security dashboard shows K8s resources
3. Test signup with new account (optional)
4. Check that data refreshes automatically
5. Test logout functionality

## 📝 Notes

- Backend validates GitHub PAT in real-time during signup
- Session tokens expire after 24 hours
- K8s resources are analyzed for security issues
- Severity levels: none, low, medium, high, critical
- Frontend maps severity to status: Good, Low, Critical
