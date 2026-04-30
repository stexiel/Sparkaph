package seed

import (
	"log"

	"github.com/yourusername/sparkaph/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Run(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Where("username = ?", "admin").Count(&count)
	if count > 0 {
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Println("Seed: failed to hash password:", err)
		return
	}

	admin := models.User{
		Username:     "admin",
		Email:        "admin@sparkaph.com",
		PasswordHash: string(hash),
		Role:         "admin",
		FirstName:    "Admin",
		LastName:     "Sparkaph",
		Active:       true,
	}
	if err := db.Create(&admin).Error; err != nil {
		log.Println("Seed: failed to create admin:", err)
		return
	}

	db.FirstOrCreate(&models.SKUSequence{}, models.SKUSequence{Type: "SKU", LastNum: 0})
	db.FirstOrCreate(&models.SKUSequence{}, models.SKUSequence{Type: "BATCH", LastNum: 0})

	log.Println("Seed: admin user created (admin / admin123)")
}
