"""Loads JSON data and builds API-ready records.

Timestamps in the simulated scenario are stored as "minutes ago" and turned into
ISO 8601 times relative to the request, so the demo always looks current.
"""
import json
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Dict, List

from .trust import compute_trust

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SEVERITY_RANK = {"Extreme": 0, "Severe": 1, "Moderate": 2, "Minor": 3, "Info": 4}
LANGS = ("en", "ta", "hi", "te")


@lru_cache(maxsize=None)
def _load(name: str):
    with open(DATA_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def iso(dt: datetime) -> str:
    return dt.isoformat().replace("+00:00", "Z")


def scenario() -> Dict:
    return _load("scenario.json")


def phrasebook() -> Dict[str, Dict[str, str]]:
    return _load("phrasebook.json")["phrases"]


def glossary() -> List[Dict]:
    return _load("glossary.json")["terms"]


def contacts() -> Dict:
    return _load("contacts.json")


def hazards(now: datetime | None = None) -> List[Dict]:
    now = now or now_utc()
    out = []
    for h in _load("hazards.json"):
        rec = {k: v for k, v in h.items() if k != "observed_minutes_ago"}
        rec["observed_at"] = iso(now - timedelta(minutes=h["observed_minutes_ago"]))
        rec["is_simulated"] = True
        out.append(rec)
    return out


def shelters(now: datetime | None = None) -> List[Dict]:
    now = now or now_utc()
    out = []
    for s in _load("shelters.json"):
        rec = {k: v for k, v in s.items() if k != "verified_minutes_ago"}
        mins = s.get("verified_minutes_ago")
        rec["verified_at"] = iso(now - timedelta(minutes=mins)) if mins is not None else None
        rec["is_simulated"] = True
        out.append(rec)
    return out


def instructions_for(ids: List[str]) -> Dict[str, List[str]]:
    book = phrasebook()
    return {lang: [book[i][lang] for i in ids if i in book and lang in book[i]] for lang in LANGS}


def alerts(now: datetime | None = None) -> List[Dict]:
    now = now or now_utc()
    haz = hazards(now)
    out = []
    for raw in _load("alerts.json"):
        issued = now - timedelta(minutes=raw["issued_minutes_ago"])
        updated = now - timedelta(minutes=raw["updated_minutes_ago"])
        expires = issued + timedelta(hours=raw["valid_hours"])
        status = "expired" if now > expires else "active"
        social = raw["source_kind"] == "social_media"
        verification = "unverified" if social else "simulated_official"
        if status == "expired":
            verification = "expired"
        translations = {"en": {"title": raw["title"], "plain": raw["plain_en"]}, **raw["translations"]}
        rec = {
            "id": raw["id"], "title": raw["title"], "type": raw["type"], "severity": raw["severity"],
            "region": raw["region"], "source_name": raw["source_name"], "source_kind": raw["source_kind"],
            "source_url": raw.get("source_url", ""),
            "issued_at": iso(issued), "updated_at": iso(updated), "expires_at": iso(expires),
            "status": status, "verification_status": verification, "is_simulated": True,
            "original": raw["original"], "translations": translations,
            "instructions": instructions_for(raw["instruction_ids"]),
            "hazard_ids": [h["id"] for h in haz if h["alert_id"] == raw["id"]],
            "contradicted_by": raw.get("contradicted_by"), "superseded_by": raw.get("superseded_by"),
        }
        official_links = sum(1 for h in haz if h["alert_id"] == raw["id"] and h["status"] != "unverified")
        rec["trust"] = compute_trust({**rec, "_updated_dt": updated}, official_links, now)
        out.append(rec)
    out.sort(key=lambda a: (a["status"] != "active", a["source_kind"] == "social_media",
                            SEVERITY_RANK[a["severity"]], a["updated_at"]))
    return out
