# FastAPI application entry point
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import APP_NAME, APP_VERSION, FRONTEND_URL
from app.database import engine, Base
from app.routes import auth, products, bundles, admin

# Import all models so Base.metadata knows about them
import app.models  # noqa

# Create all tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="API for the Personal Technology Ecosystem Planner — recommends complete tech ecosystems within budget.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware — allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(bundles.router)
app.include_router(admin.router)


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": APP_NAME,
        "version": APP_VERSION,
    }


@app.get("/api/v1", tags=["Health"])
def api_info():
    """API information endpoint."""
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "endpoints": {
            "auth": "/api/v1/auth",
            "products": "/api/v1/products",
            "bundles": "/api/v1/bundles",
            "admin": "/api/v1/admin",
            "docs": "/docs",
        },
    }
