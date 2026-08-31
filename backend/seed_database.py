# Seed script — populates the database with products and compatibility rules
import json
import os
import sys

# Add parent directory to path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models.product import Product
from app.models.compatibility import CompatibilityRule
from app.models.admin import Admin
from app.utils.security import hash_password

# Import all models so Base.metadata knows about them
import app.models  # noqa


def seed_database():
    """Populate database with initial data."""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if already seeded
        existing_products = db.query(Product).count()
        if existing_products > 0:
            print(f"Database already has {existing_products} products. Skipping seed.")
            return

        # Seed products
        products_file = os.path.join(os.path.dirname(__file__), "seed_data", "products.json")
        with open(products_file, "r", encoding="utf-8") as f:
            products_data = json.load(f)

        for p in products_data:
            product = Product(
                category=p["category"],
                brand=p["brand"],
                model=p["model"],
                price=p["price"],
                rating=p["rating"],
                ecosystem=p["ecosystem"],
                specs=p.get("specs"),
                image_url=p.get("image_url"),
                is_active=True,
            )
            db.add(product)

        print(f"Seeded {len(products_data)} products.")

        # Seed compatibility rules
        rules_file = os.path.join(os.path.dirname(__file__), "seed_data", "compatibility_rules.json")
        with open(rules_file, "r", encoding="utf-8") as f:
            rules_data = json.load(f)

        for r in rules_data:
            rule = CompatibilityRule(
                ecosystem_a=r["ecosystem_a"],
                ecosystem_b=r["ecosystem_b"],
                score=r["score"],
            )
            db.add(rule)

        print(f"Seeded {len(rules_data)} compatibility rules.")

        # Create default admin
        admin = Admin(
            username="admin",
            password_hash=hash_password("admin123"),
            role="admin",
        )
        db.add(admin)
        print("Created default admin (username: admin, password: admin123).")

        db.commit()
        print("\nDatabase seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
