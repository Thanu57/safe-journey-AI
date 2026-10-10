"""Pydantic models: they validate every response the API sends to the frontend."""
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

Severity = Literal["Extreme", "Severe", "Moderate", "Minor", "Info"]
AlertStatus = Literal["active", "expired"]
TrustLevel = Literal["official", "simulated_official", "unverified", "expired"]
CheckStatus = Literal["pass", "warn", "fail"]


class TrustCheck(BaseModel):
    id: Literal["source", "link", "fresh", "linked", "origin"]
    status: CheckStatus
    detail: str


class Trust(BaseModel):
    level: TrustLevel
    summary: str
    checks: List[TrustCheck]


class OriginalText(BaseModel):
    lang: str
    text: str


class LocalizedText(BaseModel):
    title: str
    plain: str


class Alert(BaseModel):
    id: str
    title: str
    type: str
    severity: Severity
    region: str
    source_name: str
    source_kind: str
    source_url: str = ""
    issued_at: str
    updated_at: str
    expires_at: str
    status: AlertStatus
    verification_status: str
    is_simulated: bool
    original: OriginalText
    translations: Dict[str, LocalizedText]
    instructions: Dict[str, List[str]]
    hazard_ids: List[str]
    contradicted_by: Optional[str] = None
    superseded_by: Optional[str] = None
    trust: Trust


class Hazard(BaseModel):
    id: str
    name: str
    type: str
    alert_id: str
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    radius_m: int = Field(gt=0)
    status: Literal["reported", "projected", "unverified"]
    severity: Severity
    description: str
    source_name: str
    observed_at: str
    is_simulated: bool = True


class Accessibility(BaseModel):
    step_free: Literal["yes", "no", "unknown"] = "unknown"
    medical_desk: bool = False
    notes: str = ""


class Shelter(BaseModel):
    id: str
    name: str
    address: str
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    capacity: Optional[int] = None
    availability: Literal["confirmed_open", "unconfirmed"]
    verified_at: Optional[str] = None
    source_name: str
    accessibility: Accessibility
    is_simulated: bool = True


class Contact(BaseModel):
    id: str
    name: str
    number: str
    kind: str


class Language(BaseModel):
    code: str
    name: str
    native: str


class DemoLocation(BaseModel):
    id: str
    name: str
    lat: float
    lng: float


class Scenario(BaseModel):
    id: str
    name: str
    description: str
    is_simulated: bool
    map_center: List[float]
    map_zoom: int
    languages: List[Language]
    demo_locations: List[DemoLocation]


class GlossaryTerm(BaseModel):
    id: str
    en: str
    urgency: Literal["high", "medium", "low"]
    phrase: str
    variants: List[str]


class Bundle(BaseModel):
    generated_at: str
    scenario: Scenario
    alerts: List[Alert]
    hazards: List[Hazard]
    shelters: List[Shelter]
    contacts: List[Contact]
    contacts_note: str
    glossary: List[GlossaryTerm]
    phrasebook: Dict[str, Dict[str, str]]


class NearbyHazard(BaseModel):
    id: str
    name: str
    type: str
    status: str
    distance_m: int
    inside: bool


class NearestShelter(BaseModel):
    id: str
    name: str
    distance_m: int
    walk_minutes: int
    availability: str
    inside_hazard: bool


class Risk(BaseModel):
    level: Literal["danger", "caution", "watch"]
    lat: float
    lng: float
    hazards: List[NearbyHazard]
    shelters: List[NearestShelter]
    advice_phrase_ids: List[str]


class TranslateIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    target_lang: str = Field(default="en", pattern="^(en|ta|hi|te)$")


class GlossaryMatch(BaseModel):
    term_id: str
    meaning: str
    matched_text: str
    urgency: str


class TranslateOut(BaseModel):
    detected_language: str
    urgency: Literal["high", "medium", "low", "unknown"]
    matches: List[GlossaryMatch]
    suggested_actions: List[Dict[str, str]]
    provider: Literal["glossary", "claude"]
    machine_translated: bool
    simplified_en: Optional[str] = None
    translation: Optional[str] = None
    notice: str
