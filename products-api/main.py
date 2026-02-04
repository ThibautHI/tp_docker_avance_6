from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import uuid

app = FastAPI(
    title="CloudShop Products API",
    description="API for managing products in CloudShop e-commerce platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    stock: int = 0
    image_url: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None

class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    stock: int
    image_url: Optional[str]
    created_at: str
    updated_at: str

# In-memory database
products_db: dict[str, dict] = {}

# Seed sample products
def seed_products():
    sample_products = [
        {"name": "MacBook Pro M3", "description": "Ordinateur portable puissant pour les pros", "price": 2499.0, "category": "computers", "stock": 50, "emoji": "💻"},
        {"name": "iPhone 15 Pro", "description": "Le smartphone le plus avancé", "price": 1199.0, "category": "phones", "stock": 100, "emoji": "📱"},
        {"name": "AirPods Pro", "description": "Audio immersif avec réduction de bruit", "price": 279.0, "category": "audio", "stock": 200, "emoji": "🎧"},
        {"name": "Apple Watch Ultra", "description": "La montre pour les aventuriers", "price": 899.0, "category": "wearables", "stock": 75, "emoji": "⌚"},
        {"name": "iPad Pro", "description": "Tablette professionnelle M2", "price": 1299.0, "category": "tablets", "stock": 60, "emoji": "📲"},
        {"name": "Magic Keyboard", "description": "Clavier sans fil premium", "price": 349.0, "category": "accessories", "stock": 150, "emoji": "⌨️"},
        {"name": "Studio Display", "description": "Écran 5K Retina 27 pouces", "price": 1799.0, "category": "displays", "stock": 30, "emoji": "🖥️"},
        {"name": "HomePod Mini", "description": "Enceinte intelligente compacte", "price": 99.0, "category": "audio", "stock": 300, "emoji": "🔊"},
    ]

    for product_data in sample_products:
        product_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        products_db[product_id] = {
            "id": product_id,
            **product_data,
            "image_url": None,
            "created_at": now,
            "updated_at": now
        }

seed_products()

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "products-api",
        "timestamp": datetime.utcnow().isoformat(),
        "total_products": len(products_db)
    }

# Get all products
@app.get("/", response_model=List[dict])
async def get_products(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get all products with optional filters"""
    result = list(products_db.values())

    if category:
        result = [p for p in result if p["category"].lower() == category.lower()]

    if search:
        search_lower = search.lower()
        result = [p for p in result if search_lower in p["name"].lower() or search_lower in p["description"].lower()]

    if min_price is not None:
        result = [p for p in result if p["price"] >= min_price]

    if max_price is not None:
        result = [p for p in result if p["price"] <= max_price]

    return result[offset:offset + limit]

# Get single product
@app.get("/{product_id}")
async def get_product(product_id: str):
    """Get a product by ID"""
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")
    return products_db[product_id]

# Create product
@app.post("/", status_code=201)
async def create_product(product: ProductCreate):
    """Create a new product"""
    product_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    new_product = {
        "id": product_id,
        **product.model_dump(),
        "created_at": now,
        "updated_at": now
    }

    products_db[product_id] = new_product
    return new_product

# Update product
@app.put("/{product_id}")
async def update_product(product_id: str, product: ProductUpdate):
    """Update an existing product"""
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = products_db[product_id]
    update_data = product.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if value is not None:
            existing[key] = value

    existing["updated_at"] = datetime.utcnow().isoformat()
    products_db[product_id] = existing

    return existing

# Delete product
@app.delete("/{product_id}", status_code=204)
async def delete_product(product_id: str):
    """Delete a product"""
    if product_id not in products_db:
        raise HTTPException(status_code=404, detail="Product not found")

    del products_db[product_id]
    return None

# Get categories
@app.get("/meta/categories")
async def get_categories():
    """Get all unique categories"""
    categories = list(set(p["category"] for p in products_db.values()))
    return {"categories": categories}

# Search products (for Elasticsearch-like functionality)
@app.get("/search/products")
async def search_products(q: str = Query(..., min_length=1)):
    """Full-text search on products"""
    q_lower = q.lower()
    results = [
        p for p in products_db.values()
        if q_lower in p["name"].lower() or q_lower in p["description"].lower()
    ]
    return {
        "query": q,
        "count": len(results),
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8082))
    uvicorn.run(app, host="0.0.0.0", port=port)
