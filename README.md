# SafeJourney AI

**Real-time crisis communication for tourists during extreme weather events.**
Hackathon project: IIITDM Kancheepuram 24-hour web development hackathon, TravelTech track.

SafeJourney AI puts four things in one tourist-friendly interface: source-labelled alerts, a map of reported hazards and shelters, the same warning in the tourist's own language, and a saved offline card. It **supports** decisions; it does not replace emergency authorities. In an emergency call **112**.

> **All bundled data is simulated** (a fictional "Cyclone Alpha" hitting Chennai). The app labels this everywhere.

## What makes it different
- **Crisis Clarity Engine**: every alert shows *Original wording | Plain English | My language* side by side so you can compare translations with the source.
- **Alert Trust Scorecard**: five checkable facts (issuer, link, freshness, corroboration, real or simulated). No invented AI confidence score.
- **Rumor desk**: an unverified "reservoir burst" claim is shown next to the official bulletin that contradicts it.
- **My safety check**: GPS or a demo location gives a danger / caution / watch level, advice in your language, and nearest shelters (shelters inside flood areas are pushed down; "open" only when verified).
- **Warning decoder**: paste a Tamil, Hindi, Telugu or English SMS; known warning terms are highlighted and explained from a reviewed glossary, offline. Optional AI translation, always labelled as machine-generated.
- **Offline Emergency Passport**: contacts, active alerts, shelters and instructions saved on-device in your language, with a visible "saved, not live" timestamp, print and text export.

## Tech stack
React 18, Vite, React Router, Leaflet (OpenStreetMap tiles) · Python, FastAPI, Pydantic · JSON data · service worker + localStorage · Vercel + Render.

## Run locally
Requires Node 18+ and Python 3.10+.

```bash
# 1. backend  (http://localhost:8000, API docs at /docs)
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 2. frontend (http://localhost:5173), in a second terminal
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

Tests: `cd backend && pip install -r requirements-dev.txt && pytest`

If you edit the JSON data, refresh the built-in offline snapshot: `python scripts/sync_fallback.py`

## API
| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Health check |
| `GET /api/bundle` | Everything the app needs in one call (cached for offline) |
| `GET /api/alerts` | Filters: `q`, `severity`, `type`, `status`, `verification` |
| `GET /api/alerts/{id}` | One alert with trust checks and all languages |
| `GET /api/hazards`, `GET /api/shelters` | Map records with source and time |
| `GET /api/risk?lat=&lng=` | Personal risk level, nearby hazards, nearest shelters |
| `POST /api/translate` | Glossary decode; AI simplify + translate if `ANTHROPIC_API_KEY` is set |
| `GET /api/scenario`, `GET /api/contacts` | Scenario info and emergency numbers |

## Deploy (free tiers)
**Backend on Render:** New Web Service → this repo → root directory `backend` → build `pip install -r requirements.txt` → start `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (a `render.yaml` is included). Set `FRONTEND_ORIGIN` to your Vercel URL. Check `/health`. Free services sleep after inactivity: open `/health` a minute before your demo.

**Frontend on Vercel:** Import repo → root directory `frontend` → framework Vite → env `VITE_API_URL=https://your-render-url` → deploy. `vercel.json` handles page refreshes.

**Pre-demo checklist:** open the public URL in a private window · alerts load · `/health` is OK · trust panel opens · map marker popup works · language switch works · save passport, then go offline and reload `/passport` · check on a phone-sized screen · stop the backend and confirm the "saved copy" banner appears instead of a blank page.

## Project layout
```
backend/app/{main.py, schemas.py, routes/, services/, data/}   backend/tests/
frontend/src/{pages, components, context, utils, services, data, i18n.js}   frontend/public/sw.js
docs/architecture.md   demo/video-link.md   scripts/sync_fallback.py   render.yaml
```

## Data and safety
- Simulated data is flagged in the UI, API (`is_simulated`) and passport.
- Translations of safety phrases are demo-reviewed; get native-speaker review before real use.
- Shelter "open" status appears only with a recent verification time; otherwise "availability unconfirmed".
- Distances are straight-line. The app never claims a route or shelter is safe.
- Emergency numbers were compiled for the demo; verify them before relying on them.

## Libraries and services used
React, React Router, Leaflet (BSD-2), react-leaflet (Hippocratic-2.1), Vite (MIT), FastAPI (MIT), Uvicorn (BSD), Pydantic (MIT). Map tiles © OpenStreetMap contributors (ODbL; the tile server has a usage policy: fine for a demo, not for heavy traffic). Fonts via Google Fonts (Atkinson Hyperlegible, Bricolage Grotesque, Noto Sans Tamil/Devanagari/Telugu), all OFL. Optional: Anthropic API for AI translation.

## Team
Add team members and contributions here.
