# Bundle schemas - request/response models for bundles and recommendations
from pydantic import BaseModel
from typing import List
from app.schemas.product import ProductResponse


class GenerateBundlesRequest(BaseModel):
    budget: float
    ecosystem: str
    usage_profile: str


class BundleItemResponse(BaseModel):
    id: int
    category: str
    product: ProductResponse

    class Config:
        from_attributes = True


class BundleResponse(BaseModel):
    id: int
    total_price: float
    compatibility_score: float
    value_score: float
    overall_score: float
    usage_profile: str
    ecosystem: str
    budget: float
    items: List[BundleItemResponse] = []

    class Config:
        from_attributes = True


class BundleCompareRequest(BaseModel):
    bundle_ids: List[int]


class BundleCompareResponse(BaseModel):
    bundles: List[BundleResponse]


class SavedBundleResponse(BaseModel):
    id: int
    bundle_id: int
    saved_at: str
    bundle: BundleResponse

    class Config:
        from_attributes = True
