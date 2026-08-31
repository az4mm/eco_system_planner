# Product service - CRUD and search operations for the product catalogue
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def _build_product_query(
    db: Session,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    ecosystem: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    search: Optional[str] = None,
):
    """Build a filtered query — shared between list and count."""
    query = db.query(Product).filter(Product.is_active == True)

    if category:
        query = query.filter(Product.category == category)
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    if ecosystem:
        if ecosystem != "Mixed":
            query = query.filter(
                or_(Product.ecosystem == ecosystem, Product.ecosystem == "Universal")
            )
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if min_rating is not None:
        query = query.filter(Product.rating >= min_rating)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(Product.brand.ilike(s), Product.model.ilike(s))
        )
    return query


def get_all_products(
    db: Session,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    ecosystem: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "price_asc",
    skip: int = 0,
    limit: int = 12,
) -> List[Product]:
    """Get products with optional filters, sorting, and pagination."""
    query = _build_product_query(db, category, brand, ecosystem, min_price, max_price, min_rating, search)

    # Sorting
    if sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "rating":
        query = query.order_by(Product.rating.desc())
    elif sort_by == "name":
        query = query.order_by(Product.brand, Product.model)
    else:  # price_asc (default)
        query = query.order_by(Product.price.asc())

    return query.offset(skip).limit(limit).all()


def count_products(
    db: Session,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    ecosystem: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    search: Optional[str] = None,
) -> int:
    """Count total products matching filters (for pagination metadata)."""
    query = _build_product_query(db, category, brand, ecosystem, min_price, max_price, min_rating, search)
    return query.count()


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


def get_cheapest_products_in_category(
    db: Session, category: str, ecosystem: str, limit: int = 5
) -> List[Product]:
    """Get the cheapest products in a category, regardless of budget range."""
    query = db.query(Product).filter(
        Product.is_active == True,
        Product.category == category,
    )
    if ecosystem != "Mixed":
        query = query.filter(
            or_(Product.ecosystem == ecosystem, Product.ecosystem == "Universal")
        )
    return query.order_by(Product.price.asc()).limit(limit).all()


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
