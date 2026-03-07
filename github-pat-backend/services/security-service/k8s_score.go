package securityservice

import (
	"net/http"

	"github-pat-backend/pkg/analysis"
	"github-pat-backend/pkg/database"
	"github-pat-backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type ScoreRequest struct {
	SessionToken string `json:"session_token" binding:"required"`
}

type ScoreResponse struct {
	TotalResources    int                    `json:"total_resources"`
	OverallScore      int                    `json:"overall_score"`
	MaxPossibleScore  int                    `json:"max_possible_score"`
	OverallPercentage float64                `json:"overall_percentage"`
	OverallGrade      string                 `json:"overall_grade"`
	CategoryScores    map[string]interface{} `json:"category_scores"`
	ResourceScores    []interface{}          `json:"resource_scores"`
	ComplianceStatus  string                 `json:"compliance_status"`
	Recommendations   []string               `json:"recommendations"`
}

// GetScore calculates security and compliance score for K8s resources
func GetScore(c *gin.Context) {
	var req ScoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "session_token is required", err)
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

	// Get all K8s resources for scoring (filtered by org_id)
	rows, err := database.DB.Query(`
		SELECT kr.id, kr.resource_id, kr.kind, kr.name, kr.namespace, kr.yaml_content
		FROM kubernetes_resource kr
		WHERE kr.org_id = $1
		ORDER BY kr.kind, kr.name
	`, orgID)

	if err != nil {
		response.InternalError(c, "failed to fetch resources", err)
		return
	}
	defer rows.Close()

	totalResources := 0
	totalScore := 0
	categoryScores := make(map[string]int)
	categoryMaxScores := make(map[string]int)
	resourceScores := []interface{}{}

	for rows.Next() {
		var id int
		var resourceID, kind, name, namespace string
		var yamlContent *string // Use pointer to handle NULL

		if err := rows.Scan(&id, &resourceID, &kind, &name, &namespace, &yamlContent); err != nil {
			continue
		}

		totalResources++

		// Convert pointer to string
		yamlStr := ""
		if yamlContent != nil {
			yamlStr = *yamlContent
		}

		// Calculate score for this resource using analysis package
		score, maxScore, breakdown := analysis.CalculateResourceScore(kind, yamlStr)
		totalScore += score

		// Update category scores
		if _, exists := categoryScores[kind]; !exists {
			categoryScores[kind] = 0
			categoryMaxScores[kind] = 0
		}
		categoryScores[kind] += score
		categoryMaxScores[kind] += maxScore

		resourceScores = append(resourceScores, map[string]interface{}{
			"resource_id": resourceID,
			"kind":        kind,
			"name":        name,
			"namespace":   namespace,
			"score":       score,
			"max_score":   maxScore,
			"percentage":  analysis.CalculatePercentage(score, maxScore),
			"grade":       analysis.CalculateGrade(score, maxScore),
			"breakdown":   breakdown,
		})
	}

	// Calculate overall score
	maxPossibleScore := totalResources * 100
	overallPercentage := analysis.CalculatePercentage(totalScore, maxPossibleScore)
	overallGrade := analysis.CalculateGrade(totalScore, maxPossibleScore)

	// Calculate category percentages
	categoryPercentages := make(map[string]interface{})
	for category, score := range categoryScores {
		maxScore := categoryMaxScores[category]
		categoryPercentages[category] = map[string]interface{}{
			"score":      score,
			"max_score":  maxScore,
			"percentage": analysis.CalculatePercentage(score, maxScore),
			"grade":      analysis.CalculateGrade(score, maxScore),
		}
	}

	scoreResp := ScoreResponse{
		TotalResources:    totalResources,
		OverallScore:      totalScore,
		MaxPossibleScore:  maxPossibleScore,
		OverallPercentage: overallPercentage,
		OverallGrade:      overallGrade,
		CategoryScores:    categoryPercentages,
		ResourceScores:    resourceScores,
		ComplianceStatus:  analysis.GetComplianceStatus(overallPercentage),
		Recommendations:   analysis.GetRecommendations(overallPercentage),
	}

	response.Success(c, http.StatusOK, "security score calculated successfully", scoreResp)
}
