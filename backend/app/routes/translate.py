import time
from collections import defaultdict, deque

from fastapi import APIRouter, HTTPException, Request

from ..schemas import TranslateIn, TranslateOut
from ..services import translation_service as ts

router = APIRouter(prefix="/api", tags=["translate"])
_hits: dict = defaultdict(deque)
LIMIT, WINDOW = 20, 60  # 20 requests per minute per client


def _rate_limit(ip: str) -> None:
    now = time.time()
    q = _hits[ip]
    while q and now - q[0] > WINDOW:
        q.popleft()
    if len(q) >= LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a minute.")
    q.append(now)


@router.post("/translate", response_model=TranslateOut)
def translate(body: TranslateIn, request: Request):
    _rate_limit(request.client.host if request.client else "unknown")
    decoded = ts.decode_text(body.text, body.target_lang)
    ai = ts.translate_with_ai(body.text, body.target_lang)
    if ai:
        notice = ("AI-generated simplification and translation. It may contain mistakes: compare it with "
                  "the original and the highlighted terms, and follow local authorities.")
        return {**decoded, "provider": "claude", "machine_translated": True, **ai, "notice": notice}
    notice = ("AI translation is not enabled on this server. Showing reviewed glossary matches only. "
              "Not every word is translated.")
    return {**decoded, "provider": "glossary", "machine_translated": False, "notice": notice}
