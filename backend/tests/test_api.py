from fastapi.testclient import TestClient

from app.main import app
from app.services import translation_service as ts
from app.services.risk import compute_risk
from app.services import data_store

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"


def test_alerts_sorted_and_labelled():
    items = client.get("/api/alerts").json()
    assert len(items) == 6
    assert items[0]["status"] == "active"
    assert all(a["is_simulated"] for a in items)
    assert items[-1]["status"] == "expired" or items[-1]["source_kind"] == "social_media"


def test_filters():
    assert all(a["status"] == "expired" for a in client.get("/api/alerts?status=expired").json())
    assert client.get("/api/alerts?severity=extreme").json()[0]["id"] == "alert-001"
    assert client.get("/api/alerts?q=கூவம்").json()  # search in translated titles
    assert client.get("/api/alerts/nope").status_code == 404


def test_trust_levels():
    by_id = {a["id"]: a for a in client.get("/api/alerts").json()}
    assert by_id["alert-005"]["trust"]["level"] == "unverified"
    assert by_id["alert-005"]["contradicted_by"] == "alert-003"
    assert by_id["alert-006"]["status"] == "expired" and by_id["alert-006"]["trust"]["level"] == "expired"
    assert by_id["alert-001"]["trust"]["level"] == "simulated_official"
    ids = [c["id"] for c in by_id["alert-001"]["trust"]["checks"]]
    assert ids == ["source", "link", "fresh", "linked", "origin"]


def test_all_languages_present():
    for a in client.get("/api/alerts").json():
        for lang in ("en", "ta", "hi", "te"):
            assert a["translations"][lang]["plain"]
            assert len(a["instructions"][lang]) == len(a["instructions"]["en"])


def test_risk_levels():
    assert client.get("/api/risk?lat=12.9815&lng=80.2180").json()["level"] == "danger"  # Velachery
    assert client.get("/api/risk?lat=13.05&lng=80.2824").json()["level"] == "danger"    # Marina
    assert client.get("/api/risk?lat=12.6208&lng=80.1930").json()["level"] == "watch"   # Mahabalipuram
    assert client.get("/api/risk?lat=999&lng=0").status_code == 422


def test_unverified_claim_never_raises_level():
    r = compute_risk(13.01, 80.07, data_store.hazards(), data_store.shelters())
    assert r["level"] != "danger"
    assert any(h["status"] == "unverified" for h in r["hazards"])


def test_shelters_sorted_by_distance_and_flagged():
    r = client.get("/api/risk?lat=13.0418&lng=80.2341").json()
    d = [s["distance_m"] for s in r["shelters"]]
    assert d == sorted(d) or any(s["inside_hazard"] for s in r["shelters"])


def test_decoder_tamil_and_english():
    out = ts.decode_text("சிவப்பு எச்சரிக்கை: புயல் கரையைக் கடக்கும். தாழ்வான பகுதிகளில் வெளியேறுங்கள்", "hi")
    ids = {m["term_id"] for m in out["matches"]}
    assert {"red_alert", "cyclone", "landfall", "low_lying", "evacuate"} <= ids
    assert out["detected_language"] == "ta" and out["urgency"] == "high"
    assert out["suggested_actions"]
    out = ts.decode_text("Damage reported. Dam release tonight, evacuation of low-lying areas.")
    assert "reservoir" in {m["term_id"] for m in out["matches"]}
    assert "damage" not in " ".join(m["matched_text"].lower() for m in out["matches"])


def test_translate_endpoint_without_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    r = client.post("/api/translate", json={"text": "Red alert for flood", "target_lang": "ta"})
    body = r.json()
    assert r.status_code == 200 and body["provider"] == "glossary" and not body["machine_translated"]
    assert client.post("/api/translate", json={"text": "", "target_lang": "ta"}).status_code == 422
    assert client.post("/api/translate", json={"text": "x", "target_lang": "xx"}).status_code == 422


def test_bundle():
    b = client.get("/api/bundle").json()
    assert b["scenario"]["is_simulated"] and b["glossary"] and b["phrasebook"] and b["contacts"]
