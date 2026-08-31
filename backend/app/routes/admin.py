# Admin routes - /api/v1/admin
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate
from app.services import product_service
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.models.product import Product

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get admin dashboard statistics."""
    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.is_active == True).count()

    # Count by category
    categories = {}
    for cat in ["Laptop", "Smartphone", "Earbuds", "Smartwatch", "Accessories"]:
        categories[cat] = db.query(Product).filter(Product.category == cat, Product.is_active == True).count()

    # Count by ecosystem
    ecosystems = {}
    for eco in ["Apple", "Android", "Windows", "Linux", "Universal"]:
        ecosystems[eco] = db.query(Product).filter(Product.ecosystem == eco, Product.is_active == True).count()

    return {
        "total_products": total_products,
        "active_products": active_products,
        "by_category": categories,
        "by_ecosystem": ecosystems,
    }


@router.post("/products", response_model=ProductResponse, status_code=201)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    """Add a new product to the catalogue."""
    return product_service.create_product(db, product_data)


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing product."""
    product = product_service.update_product(db, product_id, product_data)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    """Delete a product from the catalogue."""
    success = product_service.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}
