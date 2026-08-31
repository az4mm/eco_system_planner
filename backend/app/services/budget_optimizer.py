# Budget optimizer - allocates budget across categories based on usage profile
from typing import Dict

# Usage-based budget allocation weights (percentage per category)
USAGE_WEIGHTS: Dict[str, Dict[str, float]] = {
    "Gaming": {
        "Laptop": 0.60,
        "Smartphone": 0.20,
        "Earbuds": 0.08,
        "Smartwatch": 0.07,
        "Accessories": 0.05,
    },
    "Creator": {
        "Laptop": 0.55,
        "Smartphone": 0.22,
        "Earbuds": 0.10,
        "Smartwatch": 0.08,
        "Accessories": 0.05,
    },
    "Office": {
        "Laptop": 0.50,
        "Smartphone": 0.25,
        "Earbuds": 0.10,
        "Smartwatch": 0.10,
        "Accessories": 0.05,
    },
    "Student": {
        "Laptop": 0.45,
        "Smartphone": 0.30,
        "Earbuds": 0.10,
        "Smartwatch": 0.08,
        "Accessories": 0.07,
    },
    "Photography": {
        "Laptop": 0.40,
        "Smartphone": 0.35,
        "Earbuds": 0.10,
        "Smartwatch": 0.08,
        "Accessories": 0.07,
    },
    "Travel": {
        "Laptop": 0.45,
        "Smartphone": 0.25,
        "Earbuds": 0.12,
        "Smartwatch": 0.10,
        "Accessories": 0.08,
    },
}

CATEGORIES = ["Laptop", "Smartphone", "Earbuds", "Smartwatch", "Accessories"]


def get_category_weights(usage_profile: str) -> Dict[str, float]:
    """Get budget allocation weights for a usage profile."""
    return USAGE_WEIGHTS.get(usage_profile, USAGE_WEIGHTS["Office"])


def allocate_budget(budget: float, usage_profile: str) -> Dict[str, Dict[str, float]]:
    """
    Allocate budget across categories based on usage profile.
    Returns a dict with target price and price range (±30%) for each category.
    """
    weights = get_category_weights(usage_profile)
    allocation = {}

    for category in CATEGORIES:
        weight = weights.get(category, 0.1)
        target = budget * weight
        # Allow ±30% flexibility around the target price
        tolerance = 0.30
        allocation[category] = {
            "target": round(target, 2),
            "min": round(target * (1 - tolerance), 2),
            "max": round(target * (1 + tolerance), 2),
        }

    return allocation


def calculate_value_score(product_price: float, product_rating: float, category_target: float) -> float:
    """
    Calculate value-for-money score for a product.
    Higher rating + lower price relative to target = higher score.
    Returns 0-100.
    """
    # Rating component (0-50): rating out of 5, scaled to 50
    rating_score = (product_rating / 5.0) * 50

    # Price efficiency component (0-50): how much value per rupee
    if category_target > 0:
        price_ratio = product_price / category_target
        # Closer to target or below = higher score
        if price_ratio <= 1.0:
            price_score = 50.0  # At or below target = max price score
        elif price_ratio <= 1.3:
            price_score = 50.0 * (1.3 - price_ratio) / 0.3  # Linear decay
        else:
            price_score = 0.0  # Too expensive
    else:
        price_score = 25.0

    return round(rating_score + price_score, 1)


def calculate_budget_fit_score(total_price: float, budget: float) -> float:
    """
    Calculate how well the bundle total fits the budget.
    Using more of the budget (without exceeding) = higher score.
    Returns 0-100.
    """
    if total_price > budget:
        # Over budget — penalize heavily
        overshoot = (total_price - budget) / budget
        return max(0, round(100 - overshoot * 200, 1))

    usage_ratio = total_price / budget
    if usage_ratio >= 0.85:
        return 100.0  # Using 85-100% of budget = perfect
    elif usage_ratio >= 0.70:
        return round(70 + (usage_ratio - 0.70) / 0.15 * 30, 1)  # 70-100
    else:
        return round(usage_ratio / 0.70 * 70, 1)  # 0-70
