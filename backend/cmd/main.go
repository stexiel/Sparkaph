package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/yourusername/sparkaph/internal/config"
	"github.com/yourusername/sparkaph/internal/handlers"
	"github.com/yourusername/sparkaph/internal/middleware"
	"github.com/yourusername/sparkaph/internal/models"
	"github.com/yourusername/sparkaph/internal/seed"
	"github.com/yourusername/sparkaph/pkg/database"
)

func main() {
	godotenv.Load()
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	db.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Category{},
		&models.Product{},
		&models.Warehouse{},
		&models.SKUSequence{},
		&models.Zone{},
		&models.Cell{},
		&models.Inventory{},
		&models.Movement{},
		&models.Order{},
		&models.OrderLine{},
		&models.PickingTask{},
		&models.PickingStep{},
	)

	seed.Run(db)

	router := gin.Default()

	router.Use(middleware.CORS())
	router.Use(middleware.Logging())

	// Auth routes
	router.POST("/auth/login", handlers.Login(db, cfg.JWTSecret))
	router.POST("/auth/register", handlers.Register(db, cfg.JWTSecret))

	// Protected routes
	auth := router.Group("/api")
	auth.Use(middleware.AuthMiddleware(cfg.JWTSecret))

	// Products
	auth.GET("/products", handlers.ListProducts(db))
	auth.POST("/products", handlers.CreateProduct(db))
	auth.GET("/products/search", handlers.SearchProducts(db))

	// Inventory & Stock
	auth.GET("/inventory", handlers.ListInventory(db))
	auth.POST("/inventory", handlers.CreateInventory(db))
	auth.GET("/stock/summary", handlers.StockSummary(db))
	auth.POST("/stock/receive", handlers.ReceiveStock(db))
	auth.POST("/stock/move", handlers.MoveStock(db))
	auth.POST("/stock/writeoff", handlers.WriteOffStock(db))
	auth.GET("/stock/movements", handlers.ListMovements(db))

	// Orders
	auth.GET("/orders", handlers.ListOrders(db))
	auth.POST("/orders", handlers.CreateOrder(db))
	auth.GET("/orders/:id", handlers.GetOrder(db))
	auth.PUT("/orders/:id/status", handlers.UpdateOrderStatus(db))

	// Picking
	auth.GET("/picking/tasks", handlers.ListTasks(db))
	auth.POST("/picking/tasks", handlers.CreateTask(db))
	auth.POST("/picking/scan", handlers.ValidateScan(db))
	auth.PUT("/picking/tasks/:id/complete", handlers.CompleteTask(db))

	// Warehouses
	auth.GET("/warehouses", handlers.ListWarehouses(db))
	auth.POST("/warehouses", handlers.CreateWarehouse(db))
	auth.GET("/warehouses/:id", handlers.GetWarehouse(db))
	auth.GET("/warehouses/:id/grid", handlers.GetWarehouseGrid(db))

	// SKU / Batch generation
	auth.POST("/generate/sku", handlers.GenerateSKU(db))
	auth.POST("/generate/batch", handlers.GenerateBatch(db))

	// Admin routes
	admin := router.Group("/admin")
	admin.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	admin.Use(handlers.AdminOnly())
	admin.GET("/users", handlers.ListUsers(db))
	admin.POST("/users", handlers.CreateUser(db))
	admin.PUT("/users/:id", handlers.UpdateUser(db))
	admin.DELETE("/users/:id", handlers.DeleteUser(db))

	log.Printf("Server running on port %s", cfg.ServerPort)
	router.Run(":" + cfg.ServerPort)
}
