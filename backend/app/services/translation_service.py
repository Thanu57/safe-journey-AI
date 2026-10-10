"""Warning decoder (works offline, no AI) plus optional AI translation.

1. decode_text(): detects the script, finds known warning terms from the reviewed
   glossary and suggests reviewed safety actions. No generated text is involved.
2. translate_with_ai(): only used when ANTHROPIC_API_KEY is set. Its output is always
   labelled as machine translation in the API response and in the UI.
"""
import json
import os
import re
import urllib.error
import urllib.request
from typing import Dict, List, Optional

from . import data_store

SCRIPT_RANGES = {"ta": (0x0B80, 0x0BFF), "hi": (0x0900, 0x097F), "te": (0x0C00, 0x0C7F)}
URGENCY_RANK = {"high": 0, "medium": 1, "low": 2}
LANG_NAMES = {"en": "English", "ta": "Tamil", "hi": "Hindi", "te": "Telugu"}


def detect_language(text: str) -> str:
    counts = {code: 0 for code in SCRIPT_RANGES}
    for ch in text:
        cp = ord(ch)
        for code, (lo, hi) in SCRIPT_RANGES.items():
            if lo <= cp <= hi:
                counts[code] += 1
    best = max(counts, key=counts.get)
    return best if counts[best] > 0 else "en"


def _find(variant: str, text: str, folded: str) -> Optional[re.Match]:
    if variant.isascii():
        stem = variant.rstrip("*")
        pattern = r"\b" + re.escape(stem) + (r"\w*" if variant.endswith("*") else r"\b")
        return re.search(pattern, text, flags=re.IGNORECASE)
    idx = folded.find(variant.casefold())
    if idx == -1:
        return None
    return re.compile(re.escape(text[idx: idx + len(variant)])).search(text)


def decode_text(text: str, target_lang: str = "en") -> Dict:
    folded = text.casefold()
    book = data_store.phrasebook()
    matches: List[Dict] = []
    seen = set()
    for term in data_store.glossary():
        for variant in term["variants"]:
            m = _find(variant, text, folded)
            if m and term["id"] not in seen:
                seen.add(term["id"])
                matches.append({"term_id": term["id"], "meaning": term["en"], "matched_text": m.group(0),
                                "urgency": term["urgency"], "_phrase": term["phrase"]})
                break
    matches.sort(key=lambda x: URGENCY_RANK[x["urgency"]])
    urgency = matches[0]["urgency"] if matches else "unknown"
    actions, used = [], set()
    for m in matches:
        pid = m["_phrase"]
        if pid in used or pid not in book:
            continue
        used.add(pid)
        actions.append({"id": pid, "text": book[pid].get(target_lang) or book[pid]["en"]})
        if len(actions) == 5:
            break
    for m in matches:
        m.pop("_phrase", None)
    return {"detected_language": detect_language(text), "urgency": urgency, "matches": matches,
            "suggested_actions": actions}


def translate_with_ai(text: str, target_lang: str) -> Optional[Dict]:
    """Returns {'simplified_en', 'translation'} or None when unavailable or failed."""
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        return None
    model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5")
    prompt = (
        "You help tourists understand emergency warnings. Rewrite the warning below in simple "
        "English (max 3 short sentences) and translate that simple version into "
        f"{LANG_NAMES.get(target_lang, 'English')}. Do not add facts that are not in the warning. "
        'Reply with JSON only: {"simplified_en": "...", "translation": "..."}.\n\nWarning:\n' + text
    )
    body = json.dumps({"model": model, "max_tokens": 700,
                       "messages": [{"role": "user", "content": prompt}]}).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages", data=body, method="POST",
        headers={"content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            payload = json.load(resp)
        raw = "".join(b.get("text", "") for b in payload.get("content", []))
        raw = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        data = json.loads(raw)
        return {"simplified_en": str(data["simplified_en"]), "translation": str(data["translation"])}
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError):
        return None
