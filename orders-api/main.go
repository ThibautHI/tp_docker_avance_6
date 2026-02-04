package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

// Order represents an order in the system
type Order struct {
	ID         string      `json:"id"`
	UserID     string      `json:"user_id"`
	Items      []OrderItem `json:"items"`
	Status     string      `json:"status"`
	Total      float64     `json:"total"`
	CreatedAt  string      `json:"created_at"`
	UpdatedAt  string      `json:"updated_at"`
	ShippingAddress Address `json:"shipping_address,omitempty"`
}

// OrderItem represents an item in an order
type OrderItem struct {
	ProductID string  `json:"product_id"`
	Name      string  `json:"name"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

// Address represents a shipping address
type Address struct {
	Street  string `json:"street"`
	City    string `json:"city"`
	ZipCode string `json:"zip_code"`
	Country string `json:"country"`
}

// CreateOrderRequest represents the request to create an order
type CreateOrderRequest struct {
	UserID          string      `json:"user_id"`
	Items           []OrderItem `json:"items"`
	ShippingAddress Address     `json:"shipping_address"`
}

// UpdateOrderRequest represents the request to update an order
type UpdateOrderRequest struct {
	Status string `json:"status"`
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status      string `json:"status"`
	Service     string `json:"service"`
	Timestamp   string `json:"timestamp"`
	TotalOrders int    `json:"total_orders"`
}

// In-memory database
var (
	orders   = make(map[string]Order)
	ordersMu sync.RWMutex
)

func main() {
	// Seed sample orders
	seedOrders()

	router := mux.NewRouter()

	// Routes
	router.HandleFunc("/health", healthHandler).Methods("GET")
	router.HandleFunc("/", getOrdersHandler).Methods("GET")
	router.HandleFunc("/", createOrderHandler).Methods("POST")
	router.HandleFunc("/{id}", getOrderHandler).Methods("GET")
	router.HandleFunc("/{id}", updateOrderHandler).Methods("PUT", "PATCH")
	router.HandleFunc("/{id}", deleteOrderHandler).Methods("DELETE")
	router.HandleFunc("/user/{userId}", getOrdersByUserHandler).Methods("GET")
	router.HandleFunc("/stats/summary", getStatsHandler).Methods("GET")

	// CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
	}

	log.Printf("📦 Orders API running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func seedOrders() {
	sampleOrders := []Order{
		{
			ID:     uuid.New().String(),
			UserID: "user-1",
			Items: []OrderItem{
				{ProductID: "prod-1", Name: "MacBook Pro M3", Quantity: 1, Price: 2499.0},
				{ProductID: "prod-3", Name: "AirPods Pro", Quantity: 2, Price: 279.0},
			},
			Status:    "delivered",
			Total:     3057.0,
			CreatedAt: time.Now().Add(-72 * time.Hour).Format(time.RFC3339),
			UpdatedAt: time.Now().Add(-24 * time.Hour).Format(time.RFC3339),
			ShippingAddress: Address{
				Street:  "123 Tech Street",
				City:    "Paris",
				ZipCode: "75001",
				Country: "France",
			},
		},
		{
			ID:     uuid.New().String(),
			UserID: "user-1",
			Items: []OrderItem{
				{ProductID: "prod-2", Name: "iPhone 15 Pro", Quantity: 1, Price: 1199.0},
			},
			Status:    "shipped",
			Total:     1199.0,
			CreatedAt: time.Now().Add(-24 * time.Hour).Format(time.RFC3339),
			UpdatedAt: time.Now().Add(-12 * time.Hour).Format(time.RFC3339),
			ShippingAddress: Address{
				Street:  "456 Innovation Ave",
				City:    "Lyon",
				ZipCode: "69001",
				Country: "France",
			},
		},
		{
			ID:     uuid.New().String(),
			UserID: "user-2",
			Items: []OrderItem{
				{ProductID: "prod-4", Name: "Apple Watch Ultra", Quantity: 1, Price: 899.0},
				{ProductID: "prod-6", Name: "Magic Keyboard", Quantity: 1, Price: 349.0},
			},
			Status:    "processing",
			Total:     1248.0,
			CreatedAt: time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			UpdatedAt: time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
			ShippingAddress: Address{
				Street:  "789 Cloud Boulevard",
				City:    "Marseille",
				ZipCode: "13001",
				Country: "France",
			},
		},
	}

	for _, order := range sampleOrders {
		orders[order.ID] = order
	}
	log.Printf("✅ Seeded %d sample orders", len(sampleOrders))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	ordersMu.RLock()
	totalOrders := len(orders)
	ordersMu.RUnlock()

	response := HealthResponse{
		Status:      "healthy",
		Service:     "orders-api",
		Timestamp:   time.Now().Format(time.RFC3339),
		TotalOrders: totalOrders,
	}
	jsonResponse(w, http.StatusOK, response)
}

func getOrdersHandler(w http.ResponseWriter, r *http.Request) {
	ordersMu.RLock()
	defer ordersMu.RUnlock()

	orderList := make([]Order, 0, len(orders))
	for _, order := range orders {
		orderList = append(orderList, order)
	}
	jsonResponse(w, http.StatusOK, orderList)
}

func getOrderHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	ordersMu.RLock()
	order, exists := orders[id]
	ordersMu.RUnlock()

	if !exists {
		jsonError(w, http.StatusNotFound, "Order not found")
		return
	}
	jsonResponse(w, http.StatusOK, order)
}

func createOrderHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.UserID == "" {
		jsonError(w, http.StatusBadRequest, "user_id is required")
		return
	}

	if len(req.Items) == 0 {
		jsonError(w, http.StatusBadRequest, "items are required")
		return
	}

	// Calculate total
	var total float64
	for _, item := range req.Items {
		total += item.Price * float64(item.Quantity)
	}

	now := time.Now().Format(time.RFC3339)
	order := Order{
		ID:              uuid.New().String(),
		UserID:          req.UserID,
		Items:           req.Items,
		Status:          "pending",
		Total:           total,
		CreatedAt:       now,
		UpdatedAt:       now,
		ShippingAddress: req.ShippingAddress,
	}

	ordersMu.Lock()
	orders[order.ID] = order
	ordersMu.Unlock()

	jsonResponse(w, http.StatusCreated, order)
}

func updateOrderHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	ordersMu.Lock()
	defer ordersMu.Unlock()

	order, exists := orders[id]
	if !exists {
		jsonError(w, http.StatusNotFound, "Order not found")
		return
	}

	var req UpdateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate status
	validStatuses := map[string]bool{
		"pending":    true,
		"processing": true,
		"shipped":    true,
		"delivered":  true,
		"cancelled":  true,
	}

	if req.Status != "" {
		if !validStatuses[req.Status] {
			jsonError(w, http.StatusBadRequest, "Invalid status")
			return
		}
		order.Status = req.Status
	}

	order.UpdatedAt = time.Now().Format(time.RFC3339)
	orders[id] = order

	jsonResponse(w, http.StatusOK, order)
}

func deleteOrderHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	ordersMu.Lock()
	defer ordersMu.Unlock()

	if _, exists := orders[id]; !exists {
		jsonError(w, http.StatusNotFound, "Order not found")
		return
	}

	delete(orders, id)
	w.WriteHeader(http.StatusNoContent)
}

func getOrdersByUserHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userId := vars["userId"]

	ordersMu.RLock()
	defer ordersMu.RUnlock()

	userOrders := make([]Order, 0)
	for _, order := range orders {
		if order.UserID == userId {
			userOrders = append(userOrders, order)
		}
	}
	jsonResponse(w, http.StatusOK, userOrders)
}

func getStatsHandler(w http.ResponseWriter, r *http.Request) {
	ordersMu.RLock()
	defer ordersMu.RUnlock()

	var totalRevenue float64
	statusCount := make(map[string]int)

	for _, order := range orders {
		totalRevenue += order.Total
		statusCount[order.Status]++
	}

	stats := map[string]interface{}{
		"total_orders":  len(orders),
		"total_revenue": totalRevenue,
		"by_status":     statusCount,
	}
	jsonResponse(w, http.StatusOK, stats)
}

func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func jsonError(w http.ResponseWriter, status int, message string) {
	jsonResponse(w, status, map[string]string{"error": message})
}
