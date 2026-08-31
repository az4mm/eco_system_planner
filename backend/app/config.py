# Backend configuration - loads environment variables
import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/tech_planner")

# JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60 * 24  # 24 hours

# App
APP_NAME = "Personal Technology Ecosystem Planner"
APP_VERSION = "1.0.0"
DEBUG = os.getenv("DEBUG", "True").lower() == "true"

# CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
