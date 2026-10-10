"""Regenerates frontend/src/data/fallbackBundle.json from the backend.

Run from the repo root:  python scripts/sync_fallback.py
The snapshot is what the app shows if the API is down AND nothing is cached yet.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from app.routes.bundle import get_bundle  # noqa: E402

out = ROOT / "frontend" / "src" / "data" / "fallbackBundle.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(get_bundle(), ensure_ascii=False, indent=1), encoding="utf-8")
print(f"Wrote {out} ({out.stat().st_size // 1024} KB)")
