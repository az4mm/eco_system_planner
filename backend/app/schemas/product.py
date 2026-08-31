# Product schemas - request/response models for products
from pydantic import BaseModel
from typing import Optional


class ProductResponse(BaseModel):
    id: int
    category: str
    brand: str
    model: str
    price: float
    rating: float
    ecosystem: str
    specs: dict | None = None
    image_url: str | None = None
    is_active: bool = True

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    category: str
    brand: str
    model: str
    price: float
    rating: float = 0.0
    ecosystem: str
    specs: dict | None = None
    image_url: str | None = None


class ProductUpdate(BaseModel):
    category: str | None = None
    brand: str | None = None
    model: str | None = None
    price: float | None = None
    rating: float | None = None
    ecosystem: str | None = None
    specs: dict | None = None
    image_url: str | None = None
    is_active: bool | None = None


class ProductFilter(BaseModel):
    category: str | None = None
    brand: str | None = None
    ecosystem: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    min_rating: float | None = None
