package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/sparkaph/internal/models"
	"gorm.io/gorm"
)

func ListWarehouses(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var warehouses []models.Warehouse
		db.Find(&warehouses)
		c.JSON(http.StatusOK, gin.H{"data": warehouses})
	}
}

func CreateWarehouse(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Name    string `json:"name"`
			Address string `json:"address"`
			Rows    int    `json:"rows"`
			Columns int    `json:"columns"`
			Floors  int    `json:"floors"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		wh := models.Warehouse{
			Name:    req.Name,
			Address: req.Address,
			Rows:    req.Rows,
			Columns: req.Columns,
			Floors:  req.Floors,
		}
		if err := db.Create(&wh).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Auto-create zones and cells: Этаж / Ряд / Ячейка (batch insert)
		for floor := 1; floor <= req.Floors; floor++ {
			zone := models.Zone{
				Name:        fmt.Sprintf("Этаж %d", floor),
				WarehouseID: &wh.ID,
			}
			db.Create(&zone)
			cells := make([]models.Cell, 0, req.Rows*req.Columns)
			for row := 1; row <= req.Rows; row++ {
				for col := 1; col <= req.Columns; col++ {
					cells = append(cells, models.Cell{
						Code:     fmt.Sprintf("Э%d-Р%02d-Я%02d", floor, row, col),
						ZoneID:   zone.ID,
						Capacity: 100,
						Active:   true,
					})
				}
			}
			db.CreateInBatches(cells, 100)
		}

		c.JSON(http.StatusCreated, gin.H{"data": wh})
	}
}

func GetWarehouse(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var wh models.Warehouse
		if err := db.Preload("Zones.Cells").First(&wh, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": wh})
	}
}

func GetWarehouseGrid(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var wh models.Warehouse
		if err := db.First(&wh, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}

		var zones []models.Zone
		db.Where("warehouse_id = ?", id).Preload("Cells").Find(&zones)

		type CellWithInventory struct {
			models.Cell
			Quantity int `json:"quantity"`
		}
		type ZoneGrid struct {
			models.Zone
			Cells []CellWithInventory `json:"cells"`
		}

		var result []ZoneGrid
		for _, z := range zones {
			zg := ZoneGrid{Zone: z}
			for _, cell := range z.Cells {
				var inv models.Inventory
				qty := 0
				if db.Where("cell_id = ?", cell.ID).First(&inv).Error == nil {
					qty = inv.Quantity
				}
				zg.Cells = append(zg.Cells, CellWithInventory{Cell: cell, Quantity: qty})
			}
			result = append(result, zg)
		}

		c.JSON(http.StatusOK, gin.H{"warehouse": wh, "zones": result})
	}
}

func GenerateSKU(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sku := generateCode(db, "SKU", "08")
		c.JSON(http.StatusOK, gin.H{"sku": sku})
	}
}

func GenerateBatch(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		batch := generateCode(db, "BATCH", "07")
		c.JSON(http.StatusOK, gin.H{"batch": batch})
	}
}

func generateCode(db *gorm.DB, codeType string, prefix string) string {
	var seq models.SKUSequence
	db.Where("type = ?", codeType).FirstOrCreate(&seq, models.SKUSequence{Type: codeType, LastNum: 0})
	seq.LastNum++
	db.Save(&seq)
	return fmt.Sprintf("%s%011d", prefix, seq.LastNum)
}

func SearchProducts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		q := c.Query("q")
		if len(q) < 1 {
			c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
			return
		}
		var products []models.Product
		db.Where("name ILIKE ? OR sku ILIKE ? OR barcode ILIKE ?",
			"%"+q+"%", "%"+q+"%", "%"+q+"%").
			Limit(10).Find(&products)
		c.JSON(http.StatusOK, gin.H{"data": products})
	}
}
