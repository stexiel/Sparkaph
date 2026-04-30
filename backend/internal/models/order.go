package models

type Order struct {
	ID           uint        `gorm:"primaryKey" json:"id"`
	OrderNumber  string      `gorm:"uniqueIndex;size:50;not null" json:"order_number"`
	CustomerName string      `gorm:"size:100;not null" json:"customer_name"`
	Status       string      `gorm:"size:20;default:PENDING" json:"status"`
	Priority     string      `gorm:"size:20;default:NORMAL" json:"priority"`
	OrderLines   []OrderLine `gorm:"foreignKey:OrderID" json:"order_lines,omitempty"`
	CreatedAt    string      `json:"created_at"`
}

type OrderLine struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	OrderID   uint   `gorm:"index" json:"order_id"`
	ProductID uint   `gorm:"index" json:"product_id"`
	Quantity  int    `json:"quantity"`
	Price     float64 `json:"price"`
}

type PickingTask struct {
	ID        uint         `gorm:"primaryKey" json:"id"`
	OrderID   uint         `gorm:"index" json:"order_id"`
	Order     Order        `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Status    string       `gorm:"size:20;default:PENDING" json:"status"`
	AssignedTo *uint      `json:"assigned_to"`
	Steps     []PickingStep `gorm:"foreignKey:TaskID" json:"steps,omitempty"`
}

type PickingStep struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	TaskID    uint   `gorm:"index" json:"task_id"`
	ProductID uint   `gorm:"index" json:"product_id"`
	CellID    uint   `gorm:"index" json:"cell_id"`
	Quantity  int    `json:"quantity"`
	Scanned   int    `gorm:"default:0" json:"scanned"`
}
