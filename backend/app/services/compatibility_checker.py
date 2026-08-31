# Compatibility checker - validates ecosystem compatibility and calculates scores
from sqlalchemy.orm import Session
from app.models.compatibility import CompatibilityRule
from typing import List, Dict

# Default compatibility matrix (used if DB rules are not loaded)
DEFAULT_COMPATIBILITY = {
    ("Apple", "Apple"): 100,
    ("Android", "Android"): 95,
    ("Windows", "Windows"): 95,
    ("Linux", "Linux"): 90,
    ("Windows", "Android"): 85,
    ("Android", "Windows"): 85,
    ("Apple", "Universal"): 95,
    ("Android", "Universal"): 95,
    ("Windows", "Universal"): 95,
    ("Linux", "Universal"): 90,
    ("Universal", "Universal"): 90,
    ("Apple", "Android"): 40,
    ("Android", "Apple"): 40,
    ("Apple", "Windows"): 45,
    ("Windows", "Apple"): 45,
    ("Apple", "Linux"): 35,
    ("Linux", "Apple"): 35,
    ("Windows", "Linux"): 70,
    ("Linux", "Windows"): 70,
    ("Android", "Linux"): 75,
    ("Linux", "Android"): 75,
}


def load_rules(db: Session) -> Dict:
    """Load compatibility rules from database, fallback to defaults."""
    rules = db.query(CompatibilityRule).all()
    if not rules:
        return DEFAULT_COMPATIBILITY

    rule_map = {}
    for rule in rules:
        rule_map[(rule.ecosystem_a, rule.ecosystem_b)] = rule.score
        rule_map[(rule.ecosystem_b, rule.ecosystem_a)] = rule.score
    return rule_map


def get_pairwise_score(eco_a: str, eco_b: str, rules: Dict) -> float:
    """Get compatibility score between two ecosystems."""
    key = (eco_a, eco_b)
    if key in rules:
        return rules[key]
    # If no rule found, return a moderate default
    if eco_a == eco_b:
        return 95.0
    return 50.0


def calculate_bundle_compatibility(
    product_ecosystems: List[str], target_ecosystem: str, rules: Dict
) -> float:
    """
    Calculate overall compatibility score for a bundle.
    Checks how well each product's ecosystem matches the target and each other.
    Returns a score 0-100.
    """
    if not product_ecosystems:
        return 0.0

    total_score = 0.0
    comparisons = 0

    # Score each product against the target ecosystem
    for eco in product_ecosystems:
        total_score += get_pairwise_score(eco, target_ecosystem, rules)
        comparisons += 1

    # Score pairwise compatibility between products
    for i in range(len(product_ecosystems)):
        for j in range(i + 1, len(product_ecosystems)):
            total_score += get_pairwise_score(
                product_ecosystems[i], product_ecosystems[j], rules
            )
            comparisons += 1

    return round(total_score / comparisons, 1) if comparisons > 0 else 0.0
