import json
from collections import Counter
from pathlib import Path
from typing import Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from recommend import recommend

app = FastAPI(title="Everywhen API")

ROOT = Path(__file__).parent.parent
DATA_PATH = ROOT / "city_data.json"
FRONTEND_DIR = ROOT / "frontend"

with open(DATA_PATH, encoding="utf-8") as f:
    CITY_DATA: List[Dict] = json.load(f)

REGION_COUNTS = Counter(
    (c.get("region") or "").lower() for c in CITY_DATA if c.get("region")
)


class RecommendRequest(BaseModel):
    regions: List[str]
    prefs: Dict[str, float]
    top_n: int = 15


@app.get("/api/stats")
def stats():
    return {"total": len(CITY_DATA), "by_region": dict(REGION_COUNTS)}


@app.post("/api/recommend")
def api_recommend(req: RecommendRequest):
    regions = [r.lower() for r in req.regions]
    filtered = [c for c in CITY_DATA if (c.get("region") or "").lower() in regions]
    if not filtered:
        raise HTTPException(status_code=404, detail="No cities found for selected regions")
    results = recommend(req.prefs, filtered, req.top_n)
    return {"results": results, "total": len(CITY_DATA)}


app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")
