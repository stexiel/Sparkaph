package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/sparkaph/internal/models"
	"gorm.io/gorm"
)

func ListProducts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var products []models.Product
		db.Find(&products)
		c.JSON(http.StatusOK, gin.H{"data": products})
	}
}

func CreateProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			SKU         string  `json:"sku"`
			Name        string  `json:"name"`
			Description string  `json:"description"`
			Barcode     string  `json:"barcode"`
			Price       float64 `json:"price"`
			CategoryID  *uint   `json:"category_id"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		product := models.Product{
			SKU:         req.SKU,
			Name:        req.Name,
			Description: req.Description,
			Barcode:     req.Barcode,
			Price:       req.Price,
			CategoryID:  req.CategoryID,
			Active:      true,
		}
		if err := db.Create(&product).Error; err != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "SKU or barcode already exists"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"data": product})
	}
}

func ListInventory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		warehouseID := c.Query("warehouse_id")
		var inventory []models.Inventory
		q := db.Preload("Product").Preload("Cell.Zone")
		if warehouseID != "" {
			q = q.Joins("JOIN cells ON cells.id = inventories.cell_id").
				Joins("JOIN zones ON zones.id = cells.zone_id").
				Where("zones.warehouse_id = ?", warehouseID)
		}
		q.Find(&inventory)
		c.JSON(http.StatusOK, gin.H{"data": inventory})
	}
}

func CreateInventory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			ProductID uint `json:"product_id"`
			CellID    uint `json:"cell_id"`
			Quantity  int  `json:"quantity"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		var existing models.Inventory
		if db.Where("product_id = ? AND cell_id = ?", req.ProductID, req.CellID).First(&existing).Error == nil {
			existing.Quantity += req.Quantity
			db.Save(&existing)
			c.JSON(http.StatusOK, gin.H{"data": existing})
			return
		}
		inv := models.Inventory{ProductID: req.ProductID, CellID: req.CellID, Quantity: req.Quantity}
		db.Create(&inv)
		c.JSON(http.StatusCreated, gin.H{"data": inv})
	}
}

// ReceiveStock — приёмка товара на склад
func ReceiveStock(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			ProductID uint   `json:"product_id"`
			CellID    uint   `json:"cell_id"`
			Quantity  int    `json:"quantity"`
			Batch     string `json:"batch"`
			Note      string `json:"note"`
		}
		if err := c.ShouldBindJSON(&req); err != nil || req.Quantity <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}
		// upsert inventory
		var inv models.Inventory
		if db.Where("product_id = ? AND cell_id = ?", req.ProductID, req.CellID).First(&inv).Error == nil {
			inv.Quantity += req.Quantity
			db.Save(&inv)
		} else {
			inv = models.Inventory{ProductID: req.ProductID, CellID: req.CellID, Quantity: req.Quantity}
			db.Create(&inv)
		}
		// log movement
		mov := models.Movement{ProductID: req.ProductID, ToCell: &req.CellID, Quantity: req.Quantity, Type: "receive"}
		db.Create(&mov)
		c.JSON(http.StatusOK, gin.H{"data": inv, "message": "stock received"})
	}
}

// MoveStock — перемещение товара между ячейками
func MoveStock(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			ProductID  uint `json:"product_id"`
			FromCellID uint `json:"from_cell_id"`
			ToCellID   uint `json:"to_cell_id"`
			Quantity   int  `json:"quantity"`
		}
		if err := c.ShouldBindJSON(&req); err != nil || req.Quantity <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}
		var src models.Inventory
		if err := db.Where("product_id = ? AND cell_id = ?", req.ProductID, req.FromCellID).First(&src).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "source inventory not found"})
			return
		}
		if src.Quantity < req.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{"error": "insufficient quantity"})
			return
		}
		src.Quantity -= req.Quantity
		db.Save(&src)

		var dst models.Inventory
		if db.Where("product_id = ? AND cell_id = ?", req.ProductID, req.ToCellID).First(&dst).Error == nil {
			dst.Quantity += req.Quantity
			db.Save(&dst)
		} else {
			dst = models.Inventory{ProductID: req.ProductID, CellID: req.ToCellID, Quantity: req.Quantity}
			db.Create(&dst)
		}
		mov := models.Movement{ProductID: req.ProductID, FromCell: &req.FromCellID, ToCell: &req.ToCellID, Quantity: req.Quantity, Type: "move"}
		db.Create(&mov)
		c.JSON(http.StatusOK, gin.H{"message": "moved", "from": src, "to": dst})
	}
}

// WriteOffStock — списание товара
func WriteOffStock(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			ProductID uint   `json:"product_id"`
			CellID    uint   `json:"cell_id"`
			Quantity  int    `json:"quantity"`
			Reason    string `json:"reason"`
		}
		if err := c.ShouldBindJSON(&req); err != nil || req.Quantity <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}
		var inv models.Inventory
		if err := db.Where("product_id = ? AND cell_id = ?", req.ProductID, req.CellID).First(&inv).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "inventory not found"})
			return
		}
		if inv.Quantity < req.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{"error": "insufficient quantity"})
			return
		}
		inv.Quantity -= req.Quantity
		db.Save(&inv)
		mov := models.Movement{ProductID: req.ProductID, FromCell: &req.CellID, Quantity: req.Quantity, Type: "writeoff"}
		db.Create(&mov)
		c.JSON(http.StatusOK, gin.H{"data": inv, "message": "written off"})
	}
}

// StockSummary — сводка остатков по всем товарам
func StockSummary(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		type Summary struct {
			ProductID  uint    `json:"product_id"`
			SKU        string  `json:"sku"`
			Name       string  `json:"name"`
			TotalQty   int     `json:"total_quantity"`
			Price      float64 `json:"price"`
			TotalValue float64 `json:"total_value"`
		}
		var results []Summary
		db.Raw(`
			SELECT p.id as product_id, p.sku, p.name, p.price,
				COALESCE(SUM(i.quantity), 0) as total_quantity,
				COALESCE(SUM(i.quantity * p.price), 0) as total_value
			FROM products p
			LEFT JOIN inventories i ON i.product_id = p.id
			GROUP BY p.id, p.sku, p.name, p.price
			ORDER BY total_quantity DESC
		`).Scan(&results)
		c.JSON(http.StatusOK, gin.H{"data": results})
	}
}

// ListMovements — история движений
func ListMovements(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var movements []models.Movement
		db.Preload("Product").Order("id desc").Limit(100).Find(&movements)
		c.JSON(http.StatusOK, gin.H{"data": movements})
	}
}
