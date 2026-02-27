import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { Service, K8sScore, K8sResourceActions, SecurityContextType } from '@/types/security';
import { toast } from 'sonner';
import { API_CONFIG } from '@/config/api';
import { getSessionToken, transformPostureToServices, transformScoreToK8sScore } from '@/lib/data-transformers';

interface SecurityState {
  services: Service[];
  score: K8sScore | null;
  actions: K8sResourceActions[];
  isConnected: boolean;
  isLoading: boolean;
}

type SecurityAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SERVICES'; payload: Service[] }
  | { type: 'SET_SCORE'; payload: K8sScore }
  | { type: 'SET_ACTIONS'; payload: K8sResourceActions[] }
  | { type: 'ADD_SERVICE'; payload: Service }
  | { type: 'UPDATE_SERVICE'; payload: Service }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean };

const initialState: SecurityState = {
  services: [],
  score: null,
  actions: [],
  isConnected: false,
  isLoading: true,
};

const securityReducer = (state: SecurityState, action: SecurityAction): SecurityState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SERVICES':
      return { ...state, services: action.payload };
    case 'SET_SCORE':
      return { ...state, score: action.payload };
    case 'SET_ACTIONS':
      return { ...state, actions: action.payload };
    case 'ADD_SERVICE':
      return { ...state, services: [...state.services, action.payload] };
    case 'UPDATE_SERVICE':
      return {
        ...state,
        services: state.services.map(service =>
          service.id === action.payload.id ? action.payload : service
        ),
      };
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.payload };
    default:
      return state;
  }
};

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(securityReducer, initialState);
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchServices = useCallback(async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      console.log('⚠️ No session token found, skipping fetch');
      return;
    }

    console.log('🔄 Fetching security posture...');
    console.log('📍 API URL:', API_CONFIG.ENDPOINTS.SECURITY.POSTURE);
    console.log('🔑 Session Token:', sessionToken.substring(0, 20) + '...');

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.SECURITY.POSTURE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken }),
      });

      console.log('📥 Response status:', response.status);

      const result = await response.json();
      console.log('📦 Posture response:', result);

      if (!result.success) {
        console.error('❌ Posture fetch failed:', result.message || result.error);
        throw new Error(result.message || result.error || 'Failed to fetch posture');
      }

      console.log('✅ Posture data received:', result.data);
      
      const services = transformPostureToServices(result.data);
      console.log('✅ Transformed services:', services.length);
      
      dispatch({ type: 'SET_SERVICES', payload: services });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });
    } catch (error) {
      console.error('❌ Failed to fetch services:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: false });
      
      // Only show error toast if user is authenticated (has session token)
      // Don't show errors on login page
      if (getSessionToken() && !API_CONFIG.ENABLE_MOCK_DATA) {
        toast.error('Failed to fetch security posture');
      }
    }
  }, []);

  const fetchScore = useCallback(async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      console.log('⚠️ No session token, skipping fetch');
      return;
    }

    console.log('🔄 Fetching security score...');

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.SECURITY.SCORE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken }),
      });

      console.log('📥 Score response status:', response.status);

      const result = await response.json();
      console.log('📦 Score response:', result);

      if (!result.success) {
        console.error('❌ Score fetch failed:', result.message || result.error);
        throw new Error(result.message || result.error || 'Failed to fetch score');
      }

      console.log('✅ Score data received:', result.data);
      
      const score = transformScoreToK8sScore(result.data);
      console.log('✅ Transformed score:', score);
      
      dispatch({ type: 'SET_SCORE', payload: score });
    } catch (error) {
      console.error('❌ Failed to fetch score:', error);
      
      // Only show error toast if user is authenticated
      if (getSessionToken() && !API_CONFIG.ENABLE_MOCK_DATA) {
        toast.error('Failed to fetch security score');
      }
    }
  }, []);

  const fetchActions = useCallback(async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      console.log('⚠️ No session token, skipping actions fetch');
      return;
    }

    console.log('🔄 Fetching K8s actions...');

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.SECURITY.ACTIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken }),
      });

      console.log('📥 Actions response status:', response.status);

      const result = await response.json();
      console.log('📦 Actions response:', result);

      if (!result.success) {
        console.error('❌ Actions fetch failed:', result.message || result.error);
        throw new Error(result.message || result.error || 'Failed to fetch actions');
      }

      console.log('✅ Actions data received:', result.data);
      
      dispatch({ type: 'SET_ACTIONS', payload: result.data.actions || [] });
    } catch (error) {
      console.error('❌ Failed to fetch actions:', error);
      
      // Only show error toast if user is authenticated
      if (getSessionToken() && !API_CONFIG.ENABLE_MOCK_DATA) {
        toast.error('Failed to fetch K8s actions');
      }
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    
    // Poll every 10 seconds
    pollingRef.current = setInterval(() => {
      fetchServices();
      fetchScore();
      fetchActions();
    }, 10000);
  }, [fetchServices, fetchScore, fetchActions]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const updateService = useCallback((service: Service) => {
    dispatch({ type: 'UPDATE_SERVICE', payload: service });
  }, []);

  const addService = useCallback((service: Service) => {
    dispatch({ type: 'ADD_SERVICE', payload: service });
  }, []);

  const updateScore = useCallback((score: K8sScore) => {
    dispatch({ type: 'SET_SCORE', payload: score });
  }, []);

  const refreshData = useCallback(async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      console.log('⚠️ No session token, cannot refresh data');
      return;
    }

    console.log('🔄 Refreshing all security data...');
    dispatch({ type: 'SET_LOADING', payload: true });
    await Promise.all([fetchServices(), fetchScore(), fetchActions()]);
    dispatch({ type: 'SET_LOADING', payload: false });
  }, [fetchServices, fetchScore, fetchActions]);

  const applyAction = useCallback(async (resourceId: string, actionType: string) => {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      toast.error('Not authenticated');
      return { success: false, message: 'Not authenticated' };
    }

    console.log('🔄 Applying action:', actionType, 'to resource:', resourceId);

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.SECURITY.AGENTIC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          resource_id: resourceId,
          action_type: actionType,
        }),
      });

      const result = await response.json();
      console.log('📦 Apply action response:', result);

      if (!result.success) {
        console.error('❌ Apply action failed:', result.message || result.error);
        throw new Error(result.message || result.error || 'Failed to apply action');
      }

      console.log('✅ Action applied:', result.data);
      
      toast.success(result.message || 'Action applied successfully');
      
      // Refresh data after action
      await fetchServices();
      await fetchScore();
      await fetchActions();
      
      return { 
        success: true, 
        message: result.message, 
        output: result.data?.note || result.data?.output || 'Action completed'
      };
    } catch (error) {
      console.error('❌ Failed to apply action:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply action';
      toast.error(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        output: `Error: ${errorMessage}`
      };
    }
  }, [fetchServices, fetchScore, fetchActions]);

  useEffect(() => {
    const sessionToken = getSessionToken();
    
    // Don't automatically fetch data on mount
    // Data will only be fetched when user clicks "Fetch Data" button
    // or when explicitly navigating to security pages
    if (!sessionToken) {
      console.log('⚠️ No session token, skipping data initialization');
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    // Set loading to false - data will be fetched on demand
    dispatch({ type: 'SET_LOADING', payload: false });

    // Listen for login events and fetch-data completion
    const handleLogin = async () => {
      console.log('🔔 Data fetch completed, refreshing security data...');
      dispatch({ type: 'SET_LOADING', payload: true });
      await Promise.all([fetchServices(), fetchScore(), fetchActions()]);
      dispatch({ type: 'SET_LOADING', payload: false });
    };
    
    window.addEventListener('aegios:login', handleLogin);

    return () => {
      stopPolling();
      window.removeEventListener('aegios:login', handleLogin);
    };
  }, [fetchServices, fetchScore, fetchActions, stopPolling]);

  const contextValue: SecurityContextType = {
    services: state.services,
    score: state.score,
    actions: state.actions,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    updateService,
    addService,
    updateScore,
    applyAction,
    fetchActions,
    refreshData,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};