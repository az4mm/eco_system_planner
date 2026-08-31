# Models package init - import all models for Base.metadata
from app.models.user import User
from app.models.product import Product
from app.models.bundle import Bundle, BundleItem
from app.models.admin import Admin
from app.models.compatibility import CompatibilityRule
from app.models.saved_bundle import SavedBundle
