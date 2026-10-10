from typing import List

from fastapi import APIRouter, Query

from ..schemas import Hazard, Risk, Shelter
from ..services import data_store
from ..services.risk import compute_risk

router = APIRouter(prefix="/api", tags=["map"])


@router.get("/hazards", response_model=List[Hazard])
def list_hazards(alert_id: str | None = None, include_unverified: bool = True):
    items = data_store.hazards()
    if alert_id:
        items = [h for h in items if h["alert_id"] == alert_id]
    if not include_unverified:
        items = [h for h in items if h["status"] != "unverified"]
    return items


@router.get("/shelters", response_model=List[Shelter])
def list_shelters(availability: str | None = None):
    items = data_store.shelters()
    if availability:
        items = [s for s in items if s["availability"] == availability]
    return items


@router.get("/risk", response_model=Risk)
def risk(lat: float = Query(..., ge=-90, le=90), lng: float = Query(..., ge=-180, le=180)):
    return compute_risk(lat, lng, data_store.hazards(), data_store.shelters())
