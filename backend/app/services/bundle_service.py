# Bundle service - save, retrieve, compare, and delete bundles
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.models.bundle import Bundle, BundleItem
from app.models.saved_bundle import SavedBundle
from fastapi import HTTPException, status


def get_bundle_by_id(db: Session, bundle_id: int) -> Optional[Bundle]:
    """Get a bundle with its items and products."""
    return (
        db.query(Bundle)
        .options(joinedload(Bundle.items).joinedload(BundleItem.product))
        .filter(Bundle.id == bundle_id)
        .first()
    )


def get_bundles_for_comparison(db: Session, bundle_ids: List[int]) -> List[Bundle]:
    """Get multiple bundles for side-by-side comparison."""
    return (
        db.query(Bundle)
        .options(joinedload(Bundle.items).joinedload(BundleItem.product))
        .filter(Bundle.id.in_(bundle_ids))
        .all()
    )


def save_bundle(db: Session, user_id: int, bundle_id: int) -> SavedBundle:
    """Save a bundle to user's favourites."""
    # Check if already saved
    existing = (
        db.query(SavedBundle)
        .filter(SavedBundle.user_id == user_id, SavedBundle.bundle_id == bundle_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bundle already saved",
        )

    # Check bundle exists
    bundle = db.query(Bundle).filter(Bundle.id == bundle_id).first()
    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bundle not found",
        )

    saved = SavedBundle(user_id=user_id, bundle_id=bundle_id)
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return saved


def get_saved_bundles(db: Session, user_id: int) -> List[SavedBundle]:
    """Get all saved bundles for a user."""
    return (
        db.query(SavedBundle)
        .options(
            joinedload(SavedBundle.bundle)
            .joinedload(Bundle.items)
            .joinedload(BundleItem.product)
        )
        .filter(SavedBundle.user_id == user_id)
        .order_by(SavedBundle.saved_at.desc())
        .all()
    )


def delete_saved_bundle(db: Session, user_id: int, saved_id: int) -> bool:
    """Remove a bundle from user's saved list."""
    saved = (
        db.query(SavedBundle)
        .filter(SavedBundle.id == saved_id, SavedBundle.user_id == user_id)
        .first()
    )
    if not saved:
        return False
    db.delete(saved)
    db.commit()
    return True
