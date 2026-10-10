"""Alert Trust Scorecard.

No made-up AI confidence number: every judgement is a visible, explainable check
(source, link, freshness, corroboration, data origin).
"""
from datetime import datetime
from typing import Dict, List

FRESH_HOURS = 3
AGING_HOURS = 12


def _hours(delta) -> float:
    return delta.total_seconds() / 3600


def _age_text(delta) -> str:
    minutes = int(delta.total_seconds() // 60)
    if minutes < 60:
        return f"{minutes} min ago"
    hours = minutes // 60
    if hours < 48:
        return f"{hours} h ago"
    return f"{hours // 24} days ago"


def compute_trust(alert: Dict, linked_hazards: int, now: datetime) -> Dict:
    checks: List[Dict] = []
    social = alert["source_kind"] == "social_media"
    simulated = alert["is_simulated"]
    expired = alert["status"] == "expired"
    updated_age = now - alert["_updated_dt"]

    # 1. Is the source identifiable and official?
    if social:
        checks.append({"id": "source", "status": "fail",
                       "detail": "Anonymous forwarded message. The original sender is unknown."})
    else:
        checks.append({"id": "source", "status": "pass",
                       "detail": f"Issued by {alert['source_name']}."})

    # 2. Is there a link back to the source?
    if alert.get("source_url"):
        checks.append({"id": "link", "status": "pass", "detail": "A link to the original notice is provided."})
    else:
        reason = "simulated data has no real notice" if simulated else "no link was provided"
        checks.append({"id": "link", "status": "warn", "detail": f"No source link ({reason})."})

    # 3. Is it still current?
    if expired:
        checks.append({"id": "fresh", "status": "fail",
                       "detail": f"Expired. Last updated {_age_text(updated_age)}."
                                 + (f" Replaced by {alert['superseded_by']}." if alert.get("superseded_by") else "")})
    elif _hours(updated_age) <= FRESH_HOURS:
        checks.append({"id": "fresh", "status": "pass", "detail": f"Updated {_age_text(updated_age)}."})
    elif _hours(updated_age) <= AGING_HOURS:
        checks.append({"id": "fresh", "status": "warn", "detail": f"Last updated {_age_text(updated_age)}."})
    else:
        checks.append({"id": "fresh", "status": "fail", "detail": f"Last updated {_age_text(updated_age)}."})

    # 4. Do other records support it, or contradict it?
    if alert.get("contradicted_by"):
        checks.append({"id": "linked", "status": "fail",
                       "detail": f"Contradicted by official alert {alert['contradicted_by']}."})
    elif social:
        checks.append({"id": "linked", "status": "fail", "detail": "No official source confirms this claim."})
    elif linked_hazards > 0:
        checks.append({"id": "linked", "status": "pass",
                       "detail": f"{linked_hazards} location report(s) linked to this alert."})
    else:
        checks.append({"id": "linked", "status": "warn", "detail": "No location reports are linked to this alert."})

    # 5. Is the data real or simulated?
    if simulated:
        checks.append({"id": "origin", "status": "warn",
                       "detail": "Simulated hackathon data. This is not a real emergency."})
    else:
        checks.append({"id": "origin", "status": "pass", "detail": "Live data from the named source."})

    if social:
        level, summary = "unverified", "Unverified. Do not act on this message alone."
    elif expired:
        level, summary = "expired", "Expired. A newer alert has replaced it."
    elif simulated:
        level, summary = "simulated_official", "Simulated official-style alert for demonstration."
    else:
        level, summary = "official", "From an official source and still current."
    return {"level": level, "summary": summary, "checks": checks}
