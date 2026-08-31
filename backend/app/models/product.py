# Product model - stores tech product catalogue
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(50), nullable=False, index=True)  # Laptop, Smartphone, Earbuds, Smartwatch, Accessories
    brand = Column(String(100), nullable=False, index=True)
    model = Column(String(200), nullable=False)
    price = Column(Float, nullable=False)  # Price in INR
    rating = Column(Float, default=0.0)  # 0-5 scale
    ecosystem = Column(String(20), nullable=False, index=True)  # Apple, Android, Windows, Linux, Universal
    specs = Column(JSONB, nullable=True)  # Technical specifications as JSON
    image_url = Column(String(500), nullable=True)  # Brand logo or product image URL
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
