package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/sparkaph/internal/models"
	"gorm.io/gorm"
)

func ListTasks(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tasks []models.PickingTask
		db.Preload("Steps").Preload("Order").Find(&tasks)
		c.JSON(http.StatusOK, gin.H{"data": tasks})
	}
}

func CreateTask(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var task models.PickingTask
		c.ShouldBindJSON(&task)
		db.Create(&task)
		c.JSON(http.StatusCreated, task)
	}
}

func ValidateScan(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Barcode string `json:"barcode"`
		}
		c.ShouldBindJSON(&req)
		c.JSON(http.StatusOK, gin.H{"valid": true})
	}
}

func CompleteTask(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		db.Model(&models.PickingTask{}).Where("id = ?", c.Param("id")).Update("status", "COMPLETED")
		c.JSON(http.StatusOK, gin.H{"message": "Task completed"})
	}
}
