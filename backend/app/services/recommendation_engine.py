# Recommendation engine - the core algorithm that generates optimized bundles
import itertools
import random
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.bundle import Bundle, BundleItem
from app.services import product_service
from app.services.compatibility_checker import load_rules, calculate_bundle_compatibility
from app.services.budget_optimizer import (
    allocate_budget,
    calculate_value_score,
    calculate_budget_fit_score,
    CATEGORIES,
)


MAX_BUNDLES = 5
MAX_CANDIDATES_PER_CATEGORY = 8  # Limit to avoid combinatorial explosion


def generate_bundles(
    db: Session,
    user_id: int,
    budget: float,
    ecosystem: str,
    usage_profile: str,
) -> List[Bundle]:
    """
    Main entry point — generates top 5 ranked bundles.

    Pipeline:
    1. Allocate budget across categories based on usage profile
    2. For each category, find compatible products within price range
    3. Generate candidate bundle combinations
    4. Score each bundle (compatibility + value + rating + budget-fit)
    5. Rank and return top 5
    """
    # Step 1: Allocate budget
    allocation = allocate_budget(budget, usage_profile)

    # Step 2: Find products per category within budget range
    category_products: Dict[str, List[Product]] = {}
    for category in CATEGORIES:
        alloc = allocation[category]
        # Try exact range first
        products = product_service.get_products_by_category_and_budget(
            db, category, ecosystem, alloc["min"], alloc["max"]
        )
        if not products:
            # Fallback 1: expand range significantly (0 to 2x the max)
            products = product_service.get_products_by_category_and_budget(
                db, category, ecosystem, 0, alloc["max"] * 2.0
            )
        if not products:
            # Fallback 2: just get the cheapest products in this category regardless of budget
            products = product_service.get_cheapest_products_in_category(
                db, category, ecosystem, limit=5
            )
        if products:
            # Limit candidates to top-rated ones to avoid combinatorial explosion
            products.sort(key=lambda p: p.rating, reverse=True)
            category_products[category] = products[:MAX_CANDIDATES_PER_CATEGORY]

    # Need at least laptop and smartphone to make a meaningful bundle
    if "Laptop" not in category_products or "Smartphone" not in category_products:
        # Last resort: try to get ANY laptop and smartphone regardless of ecosystem/budget
        for req_cat in ["Laptop", "Smartphone"]:
            if req_cat not in category_products:
                fallback = product_service.get_cheapest_products_in_category(
                    db, req_cat, "Mixed", limit=5
                )
                if fallback:
                    category_products[req_cat] = fallback

    if "Laptop" not in category_products or "Smartphone" not in category_products:
        return []

    # Step 3: Generate candidate combinations
    # Use the total budget * 1.15 as the ceiling to allow slight overshoot for better results
    candidates = _generate_combinations(category_products, budget * 1.15)

    if not candidates:
        # If still no combos, try with just the cheapest item per category
        cheap_combo = {}
        for cat, prods in category_products.items():
            cheapest = min(prods, key=lambda p: p.price)
            cheap_combo[cat] = cheapest
        candidates = [cheap_combo]

    # Step 4: Score each candidate
    compat_rules = load_rules(db)
    scored_bundles = []
    for combo in candidates:
        scores = _score_bundle(combo, budget, ecosystem, allocation, compat_rules)
        scored_bundles.append((combo, scores))

    # Step 5: Rank by overall score and take top 5
    scored_bundles.sort(key=lambda x: x[1]["overall"], reverse=True)
    top_bundles = scored_bundles[:MAX_BUNDLES]

    # Save to database
    saved_bundles = []
    for combo, scores in top_bundles:
        bundle = Bundle(
            user_id=user_id,
            total_price=sum(p.price for p in combo.values()),
            compatibility_score=scores["compatibility"],
            value_score=scores["value"],
            overall_score=scores["overall"],
            usage_profile=usage_profile,
            ecosystem=ecosystem,
            budget=budget,
        )
        db.add(bundle)
        db.flush()  # Get the bundle ID

        for category, product in combo.items():
            item = BundleItem(
                bundle_id=bundle.id,
                product_id=product.id,
                category=category,
            )
            db.add(item)

        saved_bundles.append(bundle)

    db.commit()

    # Refresh to load relationships
    for bundle in saved_bundles:
        db.refresh(bundle)

    return saved_bundles


def _generate_combinations(
    category_products: Dict[str, List[Product]], budget: float
) -> List[Dict[str, Product]]:
    """
    Generate valid bundle combinations from category product lists.
    Filters out combinations that exceed budget.
    Uses smart sampling if the combination space is too large.
    """
    categories = list(category_products.keys())
    product_lists = [category_products[cat] for cat in categories]

    # Calculate total combinations
    total_combos = 1
    for pl in product_lists:
        total_combos *= len(pl)

    combos = []

    if total_combos <= 500:
        # Small enough to try all combinations
        for combo_tuple in itertools.product(*product_lists):
            combo = dict(zip(categories, combo_tuple))
            total = sum(p.price for p in combo.values())
            if total <= budget:
                combos.append(combo)
    else:
        # Too many combinations — use random sampling
        for _ in range(500):
            combo = {}
            for cat, products in category_products.items():
                combo[cat] = random.choice(products)
            total = sum(p.price for p in combo.values())
            if total <= budget:
                combos.append(combo)

    return combos


def _score_bundle(
    combo: Dict[str, Product],
    budget: float,
    target_ecosystem: str,
    allocation: Dict,
    compat_rules: Dict,
) -> Dict[str, float]:
    """
    Score a bundle using composite formula:
    Overall = Compatibility(0.3) + Value(0.3) + Rating(0.2) + BudgetFit(0.2)
    """
    # Compatibility score
    ecosystems = [p.ecosystem for p in combo.values()]
    compatibility = calculate_bundle_compatibility(ecosystems, target_ecosystem, compat_rules)

    # Value score (average across products)
    value_scores = []
    for category, product in combo.items():
        target_price = allocation[category]["target"]
        vs = calculate_value_score(product.price, product.rating, target_price)
        value_scores.append(vs)
    value = sum(value_scores) / len(value_scores) if value_scores else 0

    # Rating score (weighted average, normalized to 0-100)
    ratings = [p.rating for p in combo.values()]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    rating_score = (avg_rating / 5.0) * 100

    # Budget fit score
    total_price = sum(p.price for p in combo.values())
    budget_fit = calculate_budget_fit_score(total_price, budget)

    # Composite score
    overall = (
        compatibility * 0.30
        + value * 0.30
        + rating_score * 0.20
        + budget_fit * 0.20
    )

    return {
        "compatibility": round(compatibility, 1),
        "value": round(value, 1),
        "rating": round(rating_score, 1),
        "budget_fit": round(budget_fit, 1),
        "overall": round(overall, 1),
    }
