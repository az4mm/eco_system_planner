# Bundle and BundleItem models - generated recommendation bundles
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Bundle(Base):
    __tablename__ = "bundles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total_price = Column(Float, nullable=False)
    compatibility_score = Column(Float, default=0.0)  # 0-100
    value_score = Column(Float, default=0.0)  # 0-100
    overall_score = Column(Float, default=0.0)  # 0-100 composite
    usage_profile = Column(String(20), nullable=False)
    ecosystem = Column(String(20), nullable=False)
    budget = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="bundles")
    items = relationship("BundleItem", back_populates="bundle", cascade="all, delete-orphan")
    saved_by = relationship("SavedBundle", back_populates="bundle", cascade="all, delete-orphan")


class BundleItem(Base):
    __tablename__ = "bundle_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    bundle_id = Column(Integer, ForeignKey("bundles.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    category = Column(String(50), nullable=False)

    # Relationships
    bundle = relationship("Bundle", back_populates="items")
    product = relationship("Product")
