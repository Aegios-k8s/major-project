# Aegios Control Center - Full Stack Setup

Complete setup guide for the Aegios Security Dashboard with Go microservices backend.

## 🏗️ Architecture Overview

```
Frontend (React :8080) ←→ API Gateway (:8000) ←→ Microservices
                                                    ├── Security Service (:8081)
                                                    └── Activity Service (:8082)
```

## 🚀 Quick Start

### 1. Start Backend Services

**Windows:**
```cmd
cd backend
start-services.bat
```

**Linux/Mac:**
```bash
cd backend
chmod +x start-services.sh
./start-services.sh
```

### 2. Start Frontend

```bash
# In a new terminal
npm run dev
```

### 3. Access Application

- **Frontend**: http://localhost:8080
- **API Gateway**: http://localhost:8000
- **Backend Health**: http://localhost:8000/health

## 📊 Available Routes & APIs

### Frontend Routes
1. `/` - Main Dashboard
2. `/security/k8s-score` - Security Score Page
3. `/security/k8s-posture` - Security Posture Page
4. `/security/k8s-actions` - Actions Page
5. `/security/k8s-actions/:serviceId` - Actions with Service
6. `/*` - 404 Not Found

### Backend APIs
```bash
# Security APIs
GET  /api/security/services           # List all K8s services
GET  /api/security/services/:id       # Get specific service
GET  /api/security/score              # Get security score
POST /api/security/actions/:id/apply  # Apply security action
WS   /api/security/stream             # Real-time updates

# Activity APIs  
GET  /api/activity/                   # Get recent activities
POST /api/activity/                   # Add new activity

# Health Checks
GET  /health                          # Overall system health
```

## 🔧 Development Setup

### Prerequisites
- **Node.js** 18+ (for frontend)
- **Go** 1.21+ (for backend)
- **Git**

### Backend Setup
```bash
cd backend
go mod tidy                    # Install Go dependencies
go run services/security-service/main.go  # Start security service
go run services/activity-service/main.go  # Start activity service  
go run api-gateway/main.go               # Start API gateway
```

### Frontend Setup
```bash
npm install                    # Install dependencies
npm run dev                   # Start development server
```

## 🧪 Testing

### Test Backend APIs
```bash
cd backend
test-api.bat                  # Windows
# or
curl http://localhost:8000/health  # Manual test
```

### Test Frontend
1. Open http://localhost:8080
2. Navigate through security pages
3. Check browser console for WebSocket connection
4. Test "View Actions" and command execution

## 🐳 Docker Deployment

```bash
cd backend
docker-compose up --build
```

## 🔄 Real-time Features

### WebSocket Connection
- **URL**: `ws://localhost:8000/api/security/stream`
- **Events**: `service.created`, `service.updated`, `score.updated`
- **Fallback**: Polling every 8 seconds if WebSocket fails

### Live Updates
- Service status changes every 15 seconds
- New activities generated every 30 seconds
- Security scores recalculated automatically

## 📱 Frontend Features

### Global Layout
- **Fixed Right Sidebar**: Recent Activity (always visible)
- **Mobile Responsive**: Drawer on small screens
- **Consistent Header/Footer**: Across all pages

### Security Pages
- **K8s Score**: Interactive charts with hover tooltips
- **K8s Posture**: Service cards with 3-box layout
- **K8s Actions**: Vertical layout with namespace grouping

### UI/UX
- **Cyber Theme**: Neon green with dark background
- **Loading States**: Skeletons and proper error handling
- **Accessibility**: ARIA labels and keyboard navigation

## 🛠️ Customization

### Adding New Routes
1. **Frontend**: Add route in `App.tsx`
2. **Backend**: Add endpoint in appropriate service
3. **Gateway**: Update routing in `api-gateway/main.go`

### Modifying Data
- **Services**: Edit `mockServices` in `security-service/main.go`
- **Activities**: Edit `activities` in `activity-service/main.go`
- **Scoring**: Modify `calculateScore()` function

## 🚨 Troubleshooting

### Common Issues

**Frontend not connecting to backend:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check CORS settings in api-gateway/main.go
# Ensure frontend URL is in AllowOrigins
```

**WebSocket connection failed:**
```bash
# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" \
  http://localhost:8000/api/security/stream
```

**Services not starting:**
```bash
# Check if ports are available
netstat -an | findstr :8000
netstat -an | findstr :8081
netstat -an | findstr :8082

# Kill existing processes
taskkill /f /im security-service.exe
taskkill /f /im activity-service.exe
taskkill /f /im api-gateway.exe
```

## 📈 Production Deployment

### Environment Variables
```bash
# API Gateway
export PORT=8000
export SECURITY_SERVICE_URL=http://security-service:8081
export ACTIVITY_SERVICE_URL=http://activity-service:8082

# Frontend
export REACT_APP_API_URL=http://your-api-gateway:8000
```

### Security Considerations
- Add authentication/authorization
- Use HTTPS/WSS in production
- Implement rate limiting
- Validate all inputs
- Add request logging

### Monitoring
- Health check endpoints available
- Add structured logging
- Implement metrics collection
- Set up alerting

## 🎯 Next Steps

1. **Authentication**: Add JWT-based auth
2. **Database**: Replace mock data with real database
3. **Kubernetes Integration**: Connect to real K8s clusters
4. **Monitoring**: Add Prometheus metrics
5. **Testing**: Add unit and integration tests
6. **CI/CD**: Set up automated deployment

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Check backend service logs
4. Verify API endpoints with curl/Postman