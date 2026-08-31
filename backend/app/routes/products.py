# Product routes - /api/v1/products
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate
from app.services import product_service

router = APIRouter(prefix="/api/v1/products", tags=["Products"])


@router.get("/")
def list_products(
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    ecosystem: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("price_asc"),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """List all products with filters, sorting, and pagination."""
    skip = (page - 1) * per_page

    products = product_service.get_all_products(
        db, category, brand, ecosystem, min_price, max_price, min_rating,
        search, sort_by, skip, per_page,
    )
    total = product_service.count_products(
        db, category, brand, ecosystem, min_price, max_price, min_rating, search,
    )

    return {
        "products": [ProductResponse.model_validate(p) for p in products],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


@router.get("/brands")
def get_brands(db: Session = Depends(get_db)):
    """Get unique brands from the product database."""
    from app.models.product import Product
    brands = db.query(Product.brand).filter(Product.is_active == True).distinct().order_by(Product.brand).all()
    return [b[0] for b in brands]


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
