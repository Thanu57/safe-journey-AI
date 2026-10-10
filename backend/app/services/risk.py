"""'Am I in a danger zone?' Compares one position with hazards and shelters."""
from typing import Dict, List

from .geo import haversine_m

DANGER_TYPES = {"flood", "river_flood", "coastal_surge"}
NEAR_BUFFER_M = 1500


def compute_risk(lat: float, lng: float, hazards: List[Dict], shelters: List[Dict]) -> Dict:
    level = "watch"
    nearby: List[Dict] = []
    for h in hazards:
        d = haversine_m(lat, lng, h["lat"], h["lng"])
        inside = d <= h["radius_m"]
        near = d <= h["radius_m"] + NEAR_BUFFER_M
        if not near:
            continue
        nearby.append({"id": h["id"], "name": h["name"], "type": h["type"], "status": h["status"],
                       "distance_m": int(max(d - h["radius_m"], 0)) if not inside else 0, "inside": inside})
        if h["status"] == "unverified":
            continue  # unverified claims never raise the level
        if h["type"] in DANGER_TYPES:
            level = "danger" if inside else ("caution" if level == "watch" else level)
        else:  # road closures and projected cyclone zones
            if inside and level == "watch":
                level = "caution"
            elif near and level == "watch" and h["type"] == "road_closure":
                level = "caution"
    nearby.sort(key=lambda x: (not x["inside"], x["distance_m"]))

    verified = [h for h in hazards if h["status"] != "unverified"]
    ranked = []
    for s in shelters:
        d = haversine_m(lat, lng, s["lat"], s["lng"])
        in_hz = any(haversine_m(s["lat"], s["lng"], h["lat"], h["lng"]) <= h["radius_m"]
                    and h["type"] in DANGER_TYPES for h in verified)
        ranked.append({"id": s["id"], "name": s["name"], "distance_m": int(d),
                       "walk_minutes": max(1, round(d * 1.3 / 80)),
                       "availability": s["availability"], "inside_hazard": in_hz})
    ranked.sort(key=lambda x: (x["inside_hazard"], x["distance_m"]))

    advice = {
        "danger": ["move_higher", "avoid_floodwater", "avoid_beach", "call_112"],
        "caution": ["avoid_travel", "avoid_floodwater", "follow_authorities"],
        "watch": ["stay_indoors", "charge_phone", "follow_authorities"],
    }[level]
    return {"level": level, "lat": lat, "lng": lng, "hazards": nearby[:6], "shelters": ranked[:3],
            "advice_phrase_ids": advice}
