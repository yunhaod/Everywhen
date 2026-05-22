import numpy as np
from typing import Dict, List

FEATURE_COLS = [
    "unesco_count", "nature", "beaches", "urban", "seclusion",
    "safety_index", "cost_of_living_index", "climate_index",
    "popularity_score", "pollution_index",
]
WEIGHTS = np.array([1, 1, 1, 1, 1, 2, 2, 1, 3, 1], dtype=float)

# Maps frontend pref keys → data column names
PREF_MAP = {"culture": "unesco_count"}


def _cosine(user_vec: np.ndarray, city_vec: np.ndarray, weights: np.ndarray) -> float:
    valid = ~np.isnan(city_vec) & ~np.isnan(user_vec)
    if not valid.any():
        return 0.0
    u, c, w = user_vec[valid], city_vec[valid], weights[valid]
    dot = np.dot(u * w, c)
    mag = np.linalg.norm(u * w) * np.linalg.norm(c)
    return float(dot / mag) if mag else 0.0


def recommend(
    user_prefs: Dict[str, float],
    cities: List[Dict],
    top_n: int = 15,
) -> List[Dict]:
    normalized = {PREF_MAP.get(k, k): v for k, v in user_prefs.items()}
    user_vec = np.array([normalized.get(f, np.nan) for f in FEATURE_COLS])

    scored = []
    for city in cities:
        city_vec = np.array(
            [float(city[f]) if city.get(f) is not None else np.nan for f in FEATURE_COLS]
        )
        score = _cosine(user_vec, city_vec, WEIGHTS)
        scored.append({**city, "match_score": round(score * 100, 1)})

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return scored[:top_n]
