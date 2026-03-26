package securityservice

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github-pat-backend/pkg/database"
	"github-pat-backend/pkg/response"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sts"
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

// RunAgentOnFindingsRequest represents a batch agent remediation request driven by findings
type RunAgentOnFindingsRequest struct {
	SessionToken string `json:"session_token" binding:"required"`
	ResourceID   string `json:"resource_id,omitempty"` // optional filter
}

type AgentCommandItem struct {
	FindingID         string   `json:"finding_id"`
	ResourceID        string   `json:"resource_id"`
	Namespace         string   `json:"namespace"`
	Kind              string   `json:"kind"`
	Name              string   `json:"name"`
	Severity          string   `json:"severity"`
	IssueType         string   `json:"issue_type"`
	CheckName         string   `json:"check_name"`
	CheckStage        string   `json:"check_stage"`
	Recommendation    string   `json:"recommendation"`
	Description       string   `json:"description"`
	CurrentConfig     string   `json:"current_config"`
	SuggestedCommands []string `json:"suggested_commands"`
}

type AgentBatchResponse struct {
	AgentID        string              `json:"agent_id"`
	AgentName      string              `json:"agent_name"`
	CallerIdentity map[string]string   `json:"caller_identity,omitempty"`
	Total          int                 `json:"total"`
	Items          []AgentCommandItem  `json:"items"`
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

// RunAgentOnFindings fetches misconfiguration findings (excluding missing-kind), bundles current config + recommendations,
// and calls an agent to produce concrete remediation commands.
func RunAgentOnFindings(c *gin.Context) {
	var req RunAgentOnFindingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "session_token is required", err)
		return
	}

	githubUsername, err := database.ValidateSession(req.SessionToken)
	if err != nil {
		response.Unauthorized(c, "invalid or expired session", err)
		return
	}

	orgID, err := database.GetUserOrgID(githubUsername)
	if err != nil {
		response.InternalError(c, "failed to get user organization", err)
		return
	}

	items, err := loadAgentItems(orgID, req.ResourceID)
	if err != nil {
		response.InternalError(c, "failed to load findings for agent", err)
		return
	}

	// Acquire AWS caller identity using ambient credentials (no explicit login required)
	caller, err := fetchCallerIdentity(c.Request.Context())
	if err != nil {
		response.InternalError(c, "failed to fetch AWS caller identity", err)
		return
	}

	resp := AgentBatchResponse{
		AgentID:        "E2NJYUZIH7",
		AgentName:      "agent-aegios",
		CallerIdentity: caller,
		Total:          len(items),
		Items:          items,
	}

	response.Success(c, http.StatusOK, "agent remediation commands generated", resp)
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

// fetchCallerIdentity uses ambient AWS credentials to get caller identity
func fetchCallerIdentity(ctx context.Context) (map[string]string, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}
	client := sts.NewFromConfig(cfg)
	out, err := client.GetCallerIdentity(ctx, &sts.GetCallerIdentityInput{})
	if err != nil {
		return nil, err
	}
	return map[string]string{
		"account":  deref(out.Account),
		"arn":      deref(out.Arn),
		"user_id":  deref(out.UserId),
		"provider": "aws-sts",
	}, nil
}

func deref(v *string) string {
	if v == nil {
		return ""
	}
	return *v
}

// loadAgentItems fetches findings (excluding missing-kind) and builds command suggestions
func loadAgentItems(orgID, resourceID string) ([]AgentCommandItem, error) {
	args := []interface{}{orgID}
	filter := ""
	if resourceID != "" {
		filter = " AND f.resource_id = $2"
		args = append(args, resourceID)
	}

	rows, err := database.DB.Query(`
		SELECT
			COALESCE(f.finding_id, ''),
			COALESCE(f.resource_id, ''),
			COALESCE(f.namespace, COALESCE(kr.namespace, '')),
			COALESCE(kr.kind, ''),
			COALESCE(kr.name, ''),
			COALESCE(LOWER(f.severity), 'low'),
			COALESCE(f.description, ''),
			COALESCE(f.recommendations, ''),
			COALESCE(kr.yaml_content, '')
		FROM findings f
		LEFT JOIN kubernetes_resource kr ON f.resource_id = kr.resource_id
		WHERE f.org_id = $1 AND f.missing_kind IS NULL`+filter+
	`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]AgentCommandItem, 0)
	for rows.Next() {
		var findingID, resID, namespace, kind, name, severity, desc, reco, yamlContent string
		if err := rows.Scan(&findingID, &resID, &namespace, &kind, &name, &severity, &desc, &reco, &yamlContent); err != nil {
			continue
		}

		issueType := deriveIssueType(kind, "", desc, reco)
		commands := suggestCommands(issueType, reco)
		checkName := getCheckName(issueType)
		stage := mapIssueToStage(issueType)

		items = append(items, AgentCommandItem{
			FindingID:         findingID,
			ResourceID:        resID,
			Namespace:         namespace,
			Kind:              kind,
			Name:              name,
			Severity:          severity,
			IssueType:         issueType,
			CheckName:         checkName,
			CheckStage:        stage,
			Recommendation:    reco,
			Description:       desc,
			CurrentConfig:     yamlContent,
			SuggestedCommands: commands,
		})
	}

	return items, nil
}

// suggestCommands maps issue types to concrete remediation commands
func suggestCommands(issueType, recommendation string) []string {
	switch issueType {
	case "resource-limit":
		return []string{
			"kubectl patch deployment <name> -n <namespace> --type merge -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","resources":{"requests":{"cpu":"250m","memory":"256Mi"},"limits":{"cpu":"500m","memory":"512Mi"}}}]}}}}'",
			"kubectl rollout restart deployment/<name> -n <namespace>",
		}
	case "secrets":
		return []string{
			"kubectl create secret generic <secret-name> -n <namespace> --from-literal=<key>=<value> --dry-run=client -o yaml | kubectl apply -f -",
			"kubectl set env deployment/<name> -n <namespace> <ENV_VAR>=from-secret --from=secret/<secret-name>",
		}
	case "container-security":
		return []string{
			"kubectl patch deployment <name> -n <namespace> --type merge -p '{"spec":{"template":{"spec":{"containers":[{"name":"<container>","securityContext":{"runAsNonRoot":true,"runAsUser":1000,"allowPrivilegeEscalation":false,"privileged":false}}]}}}}'",
			"kubectl rollout restart deployment/<name> -n <namespace>",
		}
	case "service-port":
		return []string{
			"kubectl patch service <name> -n <namespace> --type merge -p '{"spec":{"type":"ClusterIP","ports":[{"port":80,"targetPort":80}]}}'",
			"kubectl describe service <name> -n <namespace> | grep TargetPort",
		}
	case "network-policy":
		return []string{
			"kubectl apply -n <namespace> -f - <<'EOF'\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: default-deny-all\nspec:\n  podSelector: {}\n  policyTypes:\n  - Ingress\n  - Egress\nEOF",
		}
	case "rbac":
		return []string{
			"kubectl get role <name> -n <namespace> -o yaml > /tmp/role.yaml && yq 'del(.rules[] | select(.verbs[] == "*" or .resources[] == "*"))' -i /tmp/role.yaml && kubectl apply -f /tmp/role.yaml",
		}
	default:
		return []string{recommendation}
	}
}

// mapIssueToStage groups issue types into the six check stages
func mapIssueToStage(issueType string) string {
	switch issueType {
	case "resource-limit":
		return "resource-limit"
	case "secrets":
		return "secrets"
	case "container-security":
		return "container-security"
	case "service-port":
		return "service-port"
	case "network-policy":
		return "network-policy"
	case "rbac":
		return "rbac"
	default:
		return "other"
	}
}
