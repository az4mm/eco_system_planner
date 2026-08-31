# Product routes - /api/v1/products
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate
from app.services import product_service

router = APIRouter(prefix="/api/v1/products", tags=["Products"])


@router.get("/", response_model=List[ProductResponse])
def list_products(
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    ecosystem: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    db: Session = Depends(get_db),
):
    """List all products with optional filters."""
    return product_service.get_all_products(
        db, category, brand, ecosystem, min_price, max_price, min_rating
    )


@router.get("/search", response_model=List[ProductResponse])
def search_products(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """Search products by brand or model name."""
    return product_service.search_products(db, q)


@router.get("/categories")
def get_categories():
    """Get list of available product categories."""
    return ["Laptop", "Smartphone", "Earbuds", "Smartwatch", "Accessories"]


@router.get("/ecosystems")
def get_ecosystems():
    """Get list of available ecosystems."""
    return ["Apple", "Android", "Windows", "Linux", "Mixed"]


@router.get("/usage-profiles")
def get_usage_profiles():
    """Get list of available usage profiles."""
    return ["Gaming", "Creator", "Office", "Student", "Photography", "Travel"]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID."""
    product = product_service.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
