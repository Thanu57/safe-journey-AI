from fastapi import APIRouter

from ..schemas import Bundle, Contact, Scenario
from ..services import data_store

router = APIRouter(prefix="/api", tags=["bundle"])


@router.get("/scenario", response_model=Scenario)
def get_scenario():
    return data_store.scenario()


@router.get("/contacts", response_model=list[Contact])
def get_contacts():
    return data_store.contacts()["contacts"]


@router.get("/bundle", response_model=Bundle)
def get_bundle():
    """Everything the app needs in one request. The frontend caches this for offline use."""
    now = data_store.now_utc()
    c = data_store.contacts()
    return {
        "generated_at": data_store.iso(now),
        "scenario": data_store.scenario(),
        "alerts": data_store.alerts(now),
        "hazards": data_store.hazards(now),
        "shelters": data_store.shelters(now),
        "contacts": c["contacts"],
        "contacts_note": c["note"],
        "glossary": data_store.glossary(),
        "phrasebook": data_store.phrasebook(),
    }
