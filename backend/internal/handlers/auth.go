package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/yourusername/sparkaph/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Login(db *gorm.DB, secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
		c.ShouldBindJSON(&req)

		var user models.User
		db.Where("username = ?", req.Username).First(&user)

		if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		token := generateToken(user.ID, user.Role, user.Username, secret)
		c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
	}
}

func Register(db *gorm.DB, secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		c.ShouldBindJSON(&req)

		hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		user := models.User{
			Username:     req.Username,
			Email:        req.Email,
			PasswordHash: string(hash),
			Role:         "user",
		}
		db.Create(&user)

		token := generateToken(user.ID, user.Role, user.Username, secret)
		c.JSON(http.StatusCreated, gin.H{"token": token, "user": user})
	}
}

func generateToken(userID uint, role string, username string, secret string) string {
	claims := jwt.MapClaims{
		"user_id":  userID,
		"role":     role,
		"username": username,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte(secret))
	return tokenStr
}
