# Compatibility rules model - ecosystem compatibility matrix
from sqlalchemy import Column, Integer, String, Boolean, Float
from app.database import Base


class CompatibilityRule(Base):
    __tablename__ = "compatibility_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ecosystem_a = Column(String(20), nullable=False)
    ecosystem_b = Column(String(20), nullable=False)
    score = Column(Float, nullable=False, default=50.0)  # 0-100 compatibility score
