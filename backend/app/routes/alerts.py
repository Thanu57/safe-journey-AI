from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from ..schemas import Alert
from ..services import data_store

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=List[Alert])
def list_alerts(
    q: Optional[str] = Query(None, description="Search title, region and source"),
    severity: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = Query(None, pattern="^(active|expired)$"),
    verification: Optional[str] = None,
):
    items = data_store.alerts()
    if q:
        needle = q.casefold()
        items = [a for a in items if needle in " ".join(
            [a["title"], a["region"], a["source_name"], a["type"]]
            + [t["title"] for t in a["translations"].values()]).casefold()]
    if severity:
        items = [a for a in items if a["severity"].casefold() == severity.casefold()]
    if type:
        items = [a for a in items if a["type"] == type]
    if status:
        items = [a for a in items if a["status"] == status]
    if verification:
        items = [a for a in items if a["verification_status"] == verification]
    return items


@router.get("/{alert_id}", response_model=Alert)
def get_alert(alert_id: str):
    for a in data_store.alerts():
        if a["id"] == alert_id:
            return a
    raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")
