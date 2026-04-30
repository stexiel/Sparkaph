package models

type Category struct {
	ID       uint      `gorm:"primaryKey" json:"id"`
	Name     string    `gorm:"size:100;not null" json:"name"`
	ParentID *uint     `gorm:"index" json:"parent_id"`
	Parent   *Category `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Products []Product `gorm:"foreignKey:CategoryID" json:"products,omitempty"`
}

type Product struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	SKU         string    `gorm:"uniqueIndex;size:50;not null" json:"sku"`
	Name        string    `gorm:"size:200;not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Barcode     string    `gorm:"size:50;uniqueIndex" json:"barcode"`
	CategoryID  *uint     `gorm:"index" json:"category_id"`
	Category    *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Price       float64   `json:"price"`
	Active      bool      `gorm:"default:true" json:"active"`
}
