/**
 * API Configuration
 * Centralized configuration for API endpoints (Real Backend: github-pat-backend)
 */

// Get environment variables with fallback defaults
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const ENABLE_MOCK_DATA = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

// API Endpoints (Monolith Backend)
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENABLE_MOCK_DATA: ENABLE_MOCK_DATA,
  
  ENDPOINTS: {
    // Authentication Service
    AUTH: {
      SIGNUP: `${API_BASE_URL}/authentication/signup`,
      LOGIN: `${API_BASE_URL}/authentication/login`,
      SIGNOUT: `${API_BASE_URL}/authentication/signout`,
    },
    
    // Fetching Service
    FETCHING: {
      DASHBOARD: `${API_BASE_URL}/fetching-service/dashboard`,
      FETCH_DATA: `${API_BASE_URL}/fetching-service/fetch-data`,
      VALIDATION: `${API_BASE_URL}/fetching-service/validation`,
    },
    
    // Security Service
    SECURITY: {
      POSTURE: `${API_BASE_URL}/security-service/k8s-posture`,
      SCORE: `${API_BASE_URL}/security-service/k8s-score`,
      ACTIONS: `${API_BASE_URL}/security-service/k8s-action`,
      AGENTIC: `${API_BASE_URL}/security-service/k8s-agentic`,
    },
  },
};

// Standard API Response Format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// HTTP Client Configuration
export const HTTP_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

export default API_CONFIG;
