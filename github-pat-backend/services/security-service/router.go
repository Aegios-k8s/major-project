package securityservice

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes registers security service routes
func RegisterRoutes(router *gin.RouterGroup) {
	router.POST("/k8s-score", GetScore)
	router.POST("/k8s-posture", GetPosture)
	router.POST("/k8s-action", GetActions)
	router.POST("/k8s-agentic", ApplyAgentic)
}
