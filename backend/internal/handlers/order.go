package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/sparkaph/internal/models"
	"gorm.io/gorm"
)

func ListOrders(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var orders []models.Order
		db.Preload("OrderLines").Find(&orders)
		c.JSON(http.StatusOK, gin.H{"data": orders})
	}
}

func CreateOrder(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var order models.Order
		c.ShouldBindJSON(&order)
		db.Create(&order)
		c.JSON(http.StatusCreated, order)
	}
}

func GetOrder(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var order models.Order
		db.Preload("OrderLines").First(&order, c.Param("id"))
		c.JSON(http.StatusOK, order)
	}
}

func UpdateOrderStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Status string `json:"status"`
		}
		c.ShouldBindJSON(&req)
		db.Model(&models.Order{}).Where("id = ?", c.Param("id")).Update("status", req.Status)
		c.JSON(http.StatusOK, gin.H{"message": "Order status updated"})
	}
}
