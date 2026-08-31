# Product service - CRUD and search operations for the product catalogue
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def get_all_products(
    db: Session,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    ecosystem: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
) -> List[Product]:
    """Get products with optional filters."""
    query = db.query(Product).filter(Product.is_active == True)

    if category:
        query = query.filter(Product.category == category)
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    if ecosystem:
        if ecosystem == "Mixed":
            pass  # No filter — return all ecosystems
        else:
            query = query.filter(
                or_(Product.ecosystem == ecosystem, Product.ecosystem == "Universal")
            )
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if min_rating is not None:
        query = query.filter(Product.rating >= min_rating)

    return query.order_by(Product.category, Product.price).all()


def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
    """Get a single product by ID."""
    return db.query(Product).filter(Product.id == product_id).first()


def get_products_by_ecosystem(db: Session, ecosystem: str) -> List[Product]:
    """Get all active products compatible with the given ecosystem."""
    if ecosystem == "Mixed":
        return db.query(Product).filter(Product.is_active == True).all()
    return (
        db.query(Product)
        .filter(
            Product.is_active == True,
            or_(Product.ecosystem == ecosystem, Product.ecosystem == "Universal"),
        )
        .all()
    )


def get_products_by_category_and_budget(
    db: Session, category: str, ecosystem: str, min_price: float, max_price: float
) -> List[Product]:
    """Get products for a specific category within a price range."""
    query = db.query(Product).filter(
        Product.is_active == True,
        Product.category == category,
        Product.price >= min_price,
        Product.price <= max_price,
    )
    if ecosystem != "Mixed":
        query = query.filter(
            or_(Product.ecosystem == ecosystem, Product.ecosystem == "Universal")
        )
    return query.order_by(Product.rating.desc()).all()


def search_products(db: Session, query_str: str) -> List[Product]:
    """Search products by brand or model name."""
    search = f"%{query_str}%"
    return (
        db.query(Product)
        .filter(
            Product.is_active == True,
            or_(
                Product.brand.ilike(search),
                Product.model.ilike(search),
            ),
        )
        .all()
    )


def create_product(db: Session, product_data: ProductCreate) -> Product:
    """Create a new product (admin only)."""
    product = Product(**product_data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, product_data: ProductUpdate) -> Optional[Product]:
    """Update an existing product (admin only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None

    update_data = product_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> bool:
    """Delete a product (admin only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return False
    db.delete(product)
    db.commit()
    return True
