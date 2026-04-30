package models

type Warehouse struct {
	ID          uint        `gorm:"primaryKey" json:"id"`
	Name        string      `gorm:"size:100;not null" json:"name"`
	Address     string      `gorm:"type:text" json:"address"`
	Rows        int         `json:"rows"`
	Columns     int         `json:"columns"`
	Floors      int         `json:"floors"`
	Active      bool        `gorm:"default:true" json:"active"`
	Zones       []Zone      `gorm:"foreignKey:WarehouseID" json:"zones,omitempty"`
}

type SKUSequence struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	LastNum int64  `gorm:"default:0" json:"last_num"`
	Type    string `gorm:"uniqueIndex;size:10" json:"type"`
}
