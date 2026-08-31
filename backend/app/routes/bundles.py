# Bundle routes - /api/v1/bundles
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.bundle import (
    GenerateBundlesRequest,
    BundleResponse,
    BundleCompareRequest,
    SavedBundleResponse,
)
from app.services import recommendation_engine, bundle_service
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/bundles", tags=["Bundles"])


@router.post("/generate", response_model=List[BundleResponse])
def generate_bundles(
    request: GenerateBundlesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate top 5 recommended bundles based on budget, ecosystem, and usage."""
    # Validate budget
    if request.budget < 5000:
        raise HTTPException(status_code=400, detail="Minimum budget is ₹5,000")
    if request.budget > 500000:
        raise HTTPException(status_code=400, detail="Maximum budget is ₹5,00,000")

    # Validate ecosystem
    valid_ecosystems = ["Apple", "Android", "Windows", "Linux", "Mixed"]
    if request.ecosystem not in valid_ecosystems:
        raise HTTPException(status_code=400, detail=f"Invalid ecosystem. Choose from: {valid_ecosystems}")

    # Validate usage profile
    valid_profiles = ["Gaming", "Creator", "Office", "Student", "Photography", "Travel"]
    if request.usage_profile not in valid_profiles:
        raise HTTPException(status_code=400, detail=f"Invalid usage profile. Choose from: {valid_profiles}")

    bundles = recommendation_engine.generate_bundles(
        db, current_user.id, request.budget, request.ecosystem, request.usage_profile
    )

    if not bundles:
        raise HTTPException(
            status_code=404,
            detail="No bundles could be generated for the given criteria. Try increasing your budget or choosing a different ecosystem.",
        )

    return bundles


@router.get("/{bundle_id}", response_model=BundleResponse)
def get_bundle(
    bundle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a specific bundle."""
    bundle = bundle_service.get_bundle_by_id(db, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return bundle


@router.post("/compare", response_model=List[BundleResponse])
def compare_bundles(
    request: BundleCompareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Compare multiple bundles side-by-side."""
    if len(request.bundle_ids) < 2:
        raise HTTPException(status_code=400, detail="Select at least 2 bundles to compare")
    if len(request.bundle_ids) > 5:
        raise HTTPException(status_code=400, detail="Can compare at most 5 bundles")

    bundles = bundle_service.get_bundles_for_comparison(db, request.bundle_ids)
    return bundles


@router.post("/{bundle_id}/save", status_code=201)
def save_bundle(
    bundle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a bundle to user's favourites."""
    saved = bundle_service.save_bundle(db, current_user.id, bundle_id)
    return {"message": "Bundle saved successfully", "saved_id": saved.id}


@router.get("/saved/list", response_model=List[SavedBundleResponse])
def get_saved_bundles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all saved bundles for the current user."""
    return bundle_service.get_saved_bundles(db, current_user.id)


@router.delete("/saved/{saved_id}")
def delete_saved_bundle(
    saved_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a bundle from saved list."""
    success = bundle_service.delete_saved_bundle(db, current_user.id, saved_id)
    if not success:
        raise HTTPException(status_code=404, detail="Saved bundle not found")
    return {"message": "Bundle removed from saved list"}


@router.get("/{bundle_id}/export")
def export_bundle_pdf(
    bundle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export a bundle as a downloadable PDF report."""
    from app.services.pdf_service import generate_bundle_pdf

    bundle = bundle_service.get_bundle_by_id(db, bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    pdf_bytes = generate_bundle_pdf(bundle)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="TechPlanner_Bundle_{bundle_id}.pdf"'
        },
    )
