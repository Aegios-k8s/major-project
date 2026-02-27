export interface Service {
  id: string;
  namespace: string;
  name: string;
  labels: Record<string, string>;
  status: "Good" | "Low" | "Critical";
  ports: number[];
  recommendations: string[];
  created_at: string;
  metadata: Record<string, any>;
}

export interface K8sScore {
  total: number;
  counts: {
    Good: number;
    Low: number;
    Critical: number;
  };
  percentages: {
    Good: number;
    Low: number;
    Critical: number;
  };
  score: number;
  criticality_level: "Low" | "Medium" | "High";
}

export interface K8sAction {
  type: string;
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  remediation: string;
}

export interface K8sResourceActions {
  resource_id: string;
  kind: string;
  name: string;
  namespace: string;
  actions: K8sAction[];
}

export interface K8sActionsResponse {
  total_actions: number;
  actions: K8sResourceActions[];
}

export interface SecurityEvent {
  event: "service.created" | "service.updated" | "score.updated";
  data: Service | K8sScore;
}

export interface SecurityContextType {
  services: Service[];
  score: K8sScore | null;
  actions: K8sResourceActions[];
  isConnected: boolean;
  isLoading: boolean;
  updateService: (service: Service) => void;
  addService: (service: Service) => void;
  updateScore: (score: K8sScore) => void;
  applyAction: (serviceId: string, command: string) => Promise<{ success: boolean; message: string; output?: string }>;
  fetchActions: () => Promise<void>;
  refreshData: () => Promise<void>;
}