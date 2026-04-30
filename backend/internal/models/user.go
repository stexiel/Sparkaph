package models

type User struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	Username     string `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Email        string `gorm:"uniqueIndex;size:100;not null" json:"email"`
	PasswordHash string `gorm:"size:255;not null" json:"-"`
	FirstName    string `gorm:"size:50" json:"first_name"`
	LastName     string `gorm:"size:50" json:"last_name"`
	Role         string `gorm:"size:20;default:user" json:"role"`
	Active       bool   `gorm:"default:true" json:"active"`
}

type Role struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"uniqueIndex;size:50;not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`
}
