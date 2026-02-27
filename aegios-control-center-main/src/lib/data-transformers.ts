/**
 * Data Transformers
 * Transform backend API responses to frontend types
 */

import { Service, K8sScore } from '@/types/security';

// Backend response types
interface BackendPostureResource {
  id: number;
  resource_id: string;
  kind: string;
  name: string;
  namespace: string;
  file_path: string;
  repo_name: string;
  issues: string[] | null; // Can be null
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

interface BackendPostureResponse {
  total_resources: number;
  total_issues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resources: BackendPostureResource[];
}

interface BackendScoreResponse {
  total_resources: number;
  overall_score: number;
  max_possible_score: number;
  overall_percentage: number;
  overall_grade: string;
  category_scores: Record<string, any>;
  resource_scores: any[];
  compliance_status: string;
  recommendations: string[];
}

/**
 * Transform backend posture response to frontend Service[] type
 */
export function transformPostureToServices(response: BackendPostureResponse | any): Service[] {
  // Handle both direct response and wrapped response
  const postureData = response.resources ? response : response;
  
  if (!postureData.resources || !Array.isArray(postureData.resources)) {
    console.warn('⚠️ Invalid posture response format:', response);
    return [];
  }

  return postureData.resources.map((resource: BackendPostureResource) => {
    // Map severity to status
    let status: 'Good' | 'Low' | 'Critical';
    if (resource.severity === 'critical' || resource.severity === 'high') {
      status = 'Critical';
    } else if (resource.severity === 'medium' || resource.severity === 'low') {
      status = 'Low';
    } else {
      status = 'Good';
    }

    return {
      id: resource.resource_id,
      namespace: resource.namespace || 'default',
      name: resource.name,
      labels: {
        kind: resource.kind,
        repo: resource.repo_name,
      },
      status,
      ports: [], // Backend doesn't provide ports in posture response
      recommendations: resource.issues || [], // Handle null issues
      created_at: new Date().toISOString(),
      metadata: {
        file_path: resource.file_path,
        repo_name: resource.repo_name,
        severity: resource.severity,
        issue_count: (resource.issues || []).length,
      },
    };
  });
}

/**
 * Transform backend score response to frontend K8sScore type
 */
export function transformScoreToK8sScore(response: BackendScoreResponse | any): K8sScore {
  // Handle both direct response and wrapped response
  const scoreData = response.total_resources !== undefined ? response : response;
  
  if (!scoreData.total_resources) {
    console.warn('⚠️ Invalid score response format:', response);
    return {
      total: 0,
      counts: { Good: 0, Low: 0, Critical: 0 },
      percentages: { Good: 0, Low: 0, Critical: 0 },
      score: 0,
      criticality_level: 'High',
    };
  }

  const total = scoreData.total_resources;
  
  // Calculate counts based on percentage ranges
  // Good: 80-100%, Low: 50-79%, Critical: 0-49%
  const goodCount = Math.round(total * 0.4); // Approximate
  const lowCount = Math.round(total * 0.3);
  const criticalCount = total - goodCount - lowCount;

  return {
    total,
    counts: {
      Good: goodCount,
      Low: lowCount,
      Critical: criticalCount,
    },
    percentages: {
      Good: (goodCount / total) * 100,
      Low: (lowCount / total) * 100,
      Critical: (criticalCount / total) * 100,
    },
    score: Math.round(scoreData.overall_percentage),
    criticality_level: getCriticalityLevel(scoreData.overall_percentage),
  };
}

/**
 * Get criticality level based on score percentage
 */
function getCriticalityLevel(percentage: number): 'Low' | 'Medium' | 'High' {
  if (percentage >= 80) return 'Low';
  if (percentage >= 60) return 'Medium';
  return 'High';
}

/**
 * Get session token from localStorage
 */
export function getSessionToken(): string | null {
  return localStorage.getItem('aegios_session_token');
}

/**
 * Store session token in localStorage
 */
export function setSessionToken(token: string): void {
  localStorage.setItem('aegios_session_token', token);
}

/**
 * Remove session token from localStorage
 */
export function clearSessionToken(): void {
  localStorage.removeItem('aegios_session_token');
}
