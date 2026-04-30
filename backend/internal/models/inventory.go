package models

type Zone struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"size:50;not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`
	Capacity    int    `json:"capacity"`
	WarehouseID *uint  `gorm:"index" json:"warehouse_id"`
	Cells       []Cell `gorm:"foreignKey:ZoneID" json:"cells,omitempty"`
}

type Cell struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Code     string `gorm:"uniqueIndex;size:20;not null" json:"code"`
	ZoneID   uint   `gorm:"index" json:"zone_id"`
	Zone     Zone   `gorm:"foreignKey:ZoneID" json:"zone,omitempty"`
	Capacity int    `json:"capacity"`
	Active   bool   `gorm:"default:true" json:"active"`
}

type Inventory struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	ProductID uint    `gorm:"index" json:"product_id"`
	Product   Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	CellID    uint    `gorm:"index" json:"cell_id"`
	Cell      Cell    `gorm:"foreignKey:CellID" json:"cell,omitempty"`
	Quantity  int     `json:"quantity"`
}

type Movement struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	ProductID uint    `gorm:"index" json:"product_id"`
	Product   Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	FromCell  *uint   `json:"from_cell"`
	ToCell    *uint   `json:"to_cell"`
	Quantity  int     `json:"quantity"`
	Type      string  `gorm:"size:20" json:"type"`
}
