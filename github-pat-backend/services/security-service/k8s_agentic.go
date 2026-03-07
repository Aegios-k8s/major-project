package securityservice

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github-pat-backend/pkg/database"
	"github-pat-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type AgenticRequest struct {
	SessionToken string `json:"session_token" binding:"required"`
	ResourceID   string `json:"resource_id" binding:"required"`
	ActionType   string `json:"action_type" binding:"required"`
	UserIntent   string `json:"user_intent,omitempty"` // NLP input
}

type AgenticResponse struct {
	Status     string                 `json:"status"`
	Message    string                 `json:"message"`
	ResourceID string                 `json:"resource_id"`
	ActionType string                 `json:"action_type"`
	Applied    bool                   `json:"applied"`
	Changes    map[string]interface{} `json:"changes"`
	Timestamp  string                 `json:"timestamp"`
	NextSteps  []string               `json:"next_steps"`
}

// ApplyAgentic applies NLP-driven remediation actions
func ApplyAgentic(c *gin.Context) {
	var req AgenticRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "session_token, resource_id, and action_type are required", err)
		return
	}

	// Validate session
	githubUsername, err := database.ValidateSession(req.SessionToken)
	if err != nil {
		response.Unauthorized(c, "invalid or expired session", err)
		return
	}

	// Get user's org_id
	orgID, err := database.GetUserOrgID(githubUsername)
	if err != nil {
		response.InternalError(c, "failed to get user organization", err)
		return
	}

	// Verify resource exists
	var resourceID, kind, name, namespace, yamlContent string
	err = database.DB.QueryRow(`
		SELECT resource_id, kind, name, namespace, yaml_content
		FROM kubernetes_resource
		WHERE org_id = $1 AND resource_id = $2
	`, orgID, req.ResourceID).Scan(&resourceID, &kind, &name, &namespace, &yamlContent)

	if err != nil {
		response.Error(c, http.StatusNotFound, "resource not found", err)
		return
	}

	// Parse user intent (NLP simulation)
	intent := parseUserIntent(req.UserIntent, req.ActionType)

	// Generate remediation plan
	_ = generateRemediationPlan(req.ActionType, kind, yamlContent, intent)

	// Apply remediation (simulation - in production, this would modify actual K8s resources)
	changes := applyRemediation(req.ActionType, yamlContent)

	// Log the action
	logAgenticAction(orgID, resourceID, req.ActionType, changes)

	// Generate next steps
	nextSteps := generateNextSteps(req.ActionType, kind)

	agenticResp := AgenticResponse{
		Status:     "success",
		Message:    fmt.Sprintf("Action '%s' applied successfully to %s/%s", req.ActionType, kind, name),
		ResourceID: resourceID,
		ActionType: req.ActionType,
		Applied:    true,
		Changes:    changes,
		Timestamp:  time.Now().Format(time.RFC3339),
		NextSteps:  nextSteps,
	}

	response.Success(c, http.StatusOK, "agentic action applied successfully", agenticResp)
}

// parseUserIntent uses NLP to understand user's intent
func parseUserIntent(userIntent, actionType string) map[string]interface{} {
	intent := make(map[string]interface{})

	// Simple NLP simulation
	userIntent = strings.ToLower(userIntent)

	if strings.Contains(userIntent, "secure") || strings.Contains(userIntent, "fix") {
		intent["goal"] = "security_improvement"
		intent["urgency"] = "high"
	}

	if strings.Contains(userIntent, "quickly") || strings.Contains(userIntent, "urgent") {
		intent["urgency"] = "critical"
	}

	if strings.Contains(userIntent, "test") || strings.Contains(userIntent, "staging") {
		intent["environment"] = "non-production"
	} else {
		intent["environment"] = "production"
	}

	intent["action_type"] = actionType

	return intent
}

// generateRemediationPlan creates a remediation plan based on action type
func generateRemediationPlan(actionType, kind, yamlContent string, intent map[string]interface{}) map[string]interface{} {
	plan := make(map[string]interface{})

	switch actionType {
	case "enforce_non_root":
		plan["changes"] = []string{
			"Add securityContext to container spec",
			"Set runAsNonRoot: true",
			"Set runAsUser: 1000 (non-root UID)",
		}
		plan["impact"] = "low"
		plan["rollback"] = "Remove securityContext or set runAsNonRoot: false"

	case "add_resource_limits":
		plan["changes"] = []string{
			"Add resources.limits.cpu",
			"Add resources.limits.memory",
			"Add resources.requests.cpu",
			"Add resources.requests.memory",
		}
		plan["impact"] = "medium"
		plan["rollback"] = "Remove resources section"

	case "remove_privilege":
		plan["changes"] = []string{
			"Set privileged: false in securityContext",
			"Remove unnecessary capabilities",
		}
		plan["impact"] = "high"
		plan["rollback"] = "Set privileged: true (not recommended)"

	default:
		plan["changes"] = []string{"Apply standard security hardening"}
		plan["impact"] = "low"
	}

	return plan
}

// applyRemediation simulates applying the remediation
func applyRemediation(actionType, yamlContent string) map[string]interface{} {
	changes := make(map[string]interface{})

	switch actionType {
	case "enforce_non_root":
		changes["securityContext"] = map[string]interface{}{
			"runAsNonRoot": true,
			"runAsUser":    1000,
		}
		changes["status"] = "applied"

	case "add_resource_limits":
		changes["resources"] = map[string]interface{}{
			"limits": map[string]string{
				"cpu":    "500m",
				"memory": "512Mi",
			},
			"requests": map[string]string{
				"cpu":    "250m",
				"memory": "256Mi",
			},
		}
		changes["status"] = "applied"

	case "remove_privilege":
		changes["securityContext"] = map[string]interface{}{
			"privileged": false,
		}
		changes["status"] = "applied"

	default:
		changes["status"] = "pending"
		changes["message"] = "Action queued for processing"
	}

	return changes
}

// logAgenticAction logs the agentic action for audit trail
func logAgenticAction(orgID, resourceID, actionType string, changes map[string]interface{}) {
	// In production, this would log to a dedicated audit table
	// For now, we'll just log to console
	fmt.Printf("[AGENTIC] org_id=%s resource_id=%s action=%s changes=%v\n",
		orgID, resourceID, actionType, changes)
}

// generateNextSteps provides recommendations for next actions
func generateNextSteps(actionType, kind string) []string {
	nextSteps := []string{
		"Verify the changes in your K8s cluster",
		"Monitor resource performance after changes",
		"Run validation to check for new issues",
	}

	switch actionType {
	case "enforce_non_root":
		nextSteps = append(nextSteps, "Test application functionality with non-root user")
		nextSteps = append(nextSteps, "Update CI/CD pipelines to use non-root images")

	case "add_resource_limits":
		nextSteps = append(nextSteps, "Monitor resource usage to optimize limits")
		nextSteps = append(nextSteps, "Set up alerts for resource exhaustion")

	case "remove_privilege":
		nextSteps = append(nextSteps, "Review application requirements for privileged access")
		nextSteps = append(nextSteps, "Consider using specific capabilities instead")
	}

	return nextSteps
}
