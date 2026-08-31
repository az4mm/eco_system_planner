# Admin routes - /api/v1/admin
from enum import Enum
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate
from app.services import product_service
from app.utils.security import hash_password, verify_password, create_access_token
from app.models.admin import Admin
from app.models.product import Product

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


# ── Role Enum ──

class AdminRole(str, Enum):
    superadmin = "superadmin"
    admin = "admin"


# ── Helper: get current admin from token stored in X-Admin-Id header ──

def get_current_admin(x_admin_id: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Resolve the current admin from the X-Admin-Id header."""
    if not x_admin_id:
        return None
    try:
        admin = db.query(Admin).filter(Admin.id == int(x_admin_id)).first()
        return admin
    except (ValueError, TypeError):
        return None


# ── Admin Auth ──

class AdminLogin(BaseModel):
    username: str
    password: str


@router.post("/login")
def admin_login(credentials: AdminLogin, db: Session = Depends(get_db)):
    """Authenticate as admin and receive a JWT token."""
    admin = db.query(Admin).filter(Admin.username == credentials.username).first()
    if not admin or not verify_password(credentials.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    token = create_access_token(data={"sub": f"admin:{admin.id}", "role": admin.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {"id": admin.id, "username": admin.username, "role": admin.role},
    }


@router.post("/seed", status_code=201)
def seed_admin(db: Session = Depends(get_db)):
    """Create the default superadmin account if no admins exist."""
    existing = db.query(Admin).first()
    if existing:
        return {"message": "Admin account already exists"}

    admin = Admin(
        username="admin",
        password_hash=hash_password("admin123"),
        role=AdminRole.superadmin,
    )
    db.add(admin)
    db.commit()
    return {"message": "Default superadmin created", "username": "admin", "password": "admin123"}


# ── Stats ──

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get admin dashboard statistics."""
    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.is_active == True).count()

    categories = {}
    for cat in ["Laptop", "Smartphone", "Earbuds", "Smartwatch", "Accessories"]:
        categories[cat] = db.query(Product).filter(Product.category == cat, Product.is_active == True).count()

    ecosystems = {}
    for eco in ["Apple", "Android", "Windows", "Linux", "Universal"]:
        ecosystems[eco] = db.query(Product).filter(Product.ecosystem == eco, Product.is_active == True).count()

    return {
        "total_products": total_products,
        "active_products": active_products,
        "by_category": categories,
        "by_ecosystem": ecosystems,
    }


# ── Product CRUD ──

@router.post("/products", response_model=ProductResponse, status_code=201)
def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    """Add a new product to the catalogue."""
    return product_service.create_product(db, product_data)


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_data: ProductUpdate, db: Session = Depends(get_db)):
    """Update an existing product."""
    product = product_service.update_product(db, product_id, product_data)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product from the catalogue."""
    success = product_service.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}


# ── Admin Self-Update ──

class AdminSelfUpdate(BaseModel):
    username: str | None = None
    current_password: str | None = None
    new_password: str | None = None


@router.put("/me")
def update_admin_self(
    data: AdminSelfUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Allow an admin to update their own username and/or password."""
    if not current_admin:
        raise HTTPException(status_code=401, detail="Admin not identified")

    if data.username is not None:
        if len(data.username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        existing = db.query(Admin).filter(Admin.username == data.username, Admin.id != current_admin.id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Username already taken")
        current_admin.username = data.username

    if data.new_password is not None:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to change password")
        if not verify_password(data.current_password, current_admin.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if len(data.new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        current_admin.password_hash = hash_password(data.new_password)

    db.commit()
    db.refresh(current_admin)
    return {"id": current_admin.id, "username": current_admin.username, "role": current_admin.role}


# ── Admin Management ──

class AdminCreate(BaseModel):
    username: str
    password: str


@router.get("/admins")
def list_admins(db: Session = Depends(get_db)):
    """List all admin accounts."""
    admins = db.query(Admin).all()
    return [{"id": a.id, "username": a.username, "role": a.role, "created_at": str(a.created_at)} for a in admins]


@router.post("/admins", status_code=201)
def create_admin(
    data: AdminCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new admin account (always with 'admin' role). Only superadmin can create admins."""
    if not current_admin or current_admin.role != AdminRole.superadmin:
        raise HTTPException(status_code=403, detail="Only superadmin can create admin accounts")

    existing = db.query(Admin).filter(Admin.username == data.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    admin = Admin(
        username=data.username,
        password_hash=hash_password(data.password),
        role=AdminRole.admin,  # New admins always get 'admin' role
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return {"id": admin.id, "username": admin.username, "role": admin.role}


@router.delete("/admins/{admin_id}")
def delete_admin(
    admin_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete an admin account. Only superadmin can delete admins."""
    if not current_admin or current_admin.role != AdminRole.superadmin:
        raise HTTPException(status_code=403, detail="Only superadmin can remove admin accounts")

    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    if admin.role == AdminRole.superadmin:
        raise HTTPException(status_code=400, detail="Cannot delete a superadmin account")

    db.delete(admin)
    db.commit()
    return {"message": f"Admin '{admin.username}' deleted"}
