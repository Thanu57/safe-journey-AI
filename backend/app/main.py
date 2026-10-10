"""SafeJourney AI backend (FastAPI).

Run locally:  uvicorn app.main:app --reload --port 8000
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import alerts, bundle, geo, translate
from .services import data_store

app = FastAPI(
    title="SafeJourney AI API",
    version="1.0.0",
    description="Structured, source-labelled emergency information for tourists. "
                "All bundled data is SIMULATED demonstration data.",
)

origins = [o.strip() for o in os.getenv("FRONTEND_ORIGIN", "").split(",") if o.strip()]
origins += ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=os.getenv("FRONTEND_ORIGIN_REGEX") or None,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

for r in (alerts.router, geo.router, translate.router, bundle.router):
    app.include_router(r)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "time": data_store.iso(data_store.now_utc()),
            "ai_translation": bool(os.getenv("ANTHROPIC_API_KEY")), "simulated_data": True}


@app.get("/", tags=["meta"])
def root():
    return {"name": "SafeJourney AI API", "docs": "/docs", "health": "/health"}
