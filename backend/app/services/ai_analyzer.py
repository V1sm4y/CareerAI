"""
AI Resume Analyzer — multi-backend, production-ready.

Controlled by environment variable ANALYZER_BACKEND:
  - "ollama"   → Mistral via local Ollama (default, great for dev/local)
  - "mistral"  → Mistral Cloud API (api.mistral.ai, best for production)
  - "groq"     → Groq cloud (free tier, very fast)
  - "heuristic"→ Rule-based fallback (no AI, always available)

Set in backend/.env:
  ANALYZER_BACKEND=mistral
  MISTRAL_API_KEY=your-key-here

  ANALYZER_BACKEND=groq
  GROQ_API_KEY=your-key-here

  ANALYZER_BACKEND=ollama          # default, no key needed
  OLLAMA_MODEL=mistral:latest
  OLLAMA_BASE_URL=http://localhost:11434
"""

import json
import logging
import os
import re
from typing import Optional

import httpx
import ollama

logger = logging.getLogger("careerforge")

# ── Configuration (all overridable via env) ───────────────────────────────────
ANALYZER_BACKEND = os.getenv("ANALYZER_BACKEND", "ollama").lower()
OLLAMA_MODEL     = os.getenv("OLLAMA_MODEL", "mistral:latest")
OLLAMA_BASE_URL  = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MISTRAL_API_KEY  = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_MODEL    = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
GROQ_API_KEY     = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL       = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")

# ── Shared prompt builder ─────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert resume reviewer with 15 years of recruiting experience
across software engineering, data science, product management, and design roles.
Evaluate resumes critically and honestly. Do NOT be overly generous with scores."""

def _build_user_prompt(text: str) -> str:
    words = text.split()
    truncated = " ".join(words[:3000])
    if len(words) > 3000:
        truncated += "\n[... resume truncated ...]"

    return f"""Analyze the following resume and return ONLY a valid JSON object with this exact structure:

{{
  "score": <number 0-100, realistic>,
  "grade": <"A"|"B"|"C"|"D"|"F">,
  "strengths": [<2-4 specific strengths as strings>],
  "recommendations": [<3-5 specific, actionable improvements as strings>],
  "sections_found": [<section names detected: "experience","education","skills","summary","contact","projects","certifications">],
  "word_count": <integer>
}}

Grading: A=85-100, B=70-84, C=55-69, D=40-54, F=0-39
Return ONLY the JSON. No markdown, no explanation.

RESUME:
{truncated}"""

def _parse_llm_response(raw: str, word_count: int) -> Optional[dict]:
    """Parse and validate JSON from any LLM response."""
    try:
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE).strip()
        result = json.loads(raw)

        required = {"score", "grade", "strengths", "recommendations", "sections_found", "word_count"}
        if not required.issubset(result.keys()):
            logger.warning(f"[ai_analyzer] Missing keys in response: {required - result.keys()}")
            return None

        result["score"] = round(max(0.0, min(100.0, float(result["score"]))), 1)
        result["word_count"] = word_count  # always use our own count
        return result
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"[ai_analyzer] JSON parse error: {e} | Raw: {raw[:300]}")
        return None


# ── Backend 1: Ollama (local) ─────────────────────────────────────────────────
def _analyze_ollama(text: str, word_count: int) -> Optional[dict]:
    """Run analysis via local Ollama instance."""
    try:
        client = ollama.Client(host=OLLAMA_BASE_URL)
        response = client.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": _build_user_prompt(text)},
            ],
            options={"temperature": 0.2, "num_predict": 512},
        )
        raw = response["message"]["content"].strip()
        logger.info(f"[ai_analyzer] Ollama ({OLLAMA_MODEL}) responded")
        return _parse_llm_response(raw, word_count)
    except Exception as e:
        logger.error(f"[ai_analyzer] Ollama failed: {e}")
        return None


# ── Backend 2: Mistral Cloud API ──────────────────────────────────────────────
def _analyze_mistral_api(text: str, word_count: int) -> Optional[dict]:
    """Run analysis via Mistral's official cloud API."""
    if not MISTRAL_API_KEY:
        logger.error("[ai_analyzer] MISTRAL_API_KEY not set")
        return None
    try:
        with httpx.Client(timeout=60) as client:
            resp = client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {MISTRAL_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MISTRAL_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user",   "content": _build_user_prompt(text)},
                    ],
                    "temperature": 0.2,
                    "max_tokens": 512,
                    "response_format": {"type": "json_object"},
                },
            )
            resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"]
            logger.info(f"[ai_analyzer] Mistral API ({MISTRAL_MODEL}) responded")
            return _parse_llm_response(raw, word_count)
    except Exception as e:
        logger.error(f"[ai_analyzer] Mistral API failed: {e}")
        return None


# ── Backend 3: Groq ───────────────────────────────────────────────────────────
def _analyze_groq(text: str, word_count: int) -> Optional[dict]:
    """Run analysis via Groq's ultra-fast inference API (free tier available)."""
    if not GROQ_API_KEY:
        logger.error("[ai_analyzer] GROQ_API_KEY not set")
        return None
    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user",   "content": _build_user_prompt(text)},
                    ],
                    "temperature": 0.2,
                    "max_tokens": 512,
                    "response_format": {"type": "json_object"},
                },
            )
            resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"]
            logger.info(f"[ai_analyzer] Groq ({GROQ_MODEL}) responded")
            return _parse_llm_response(raw, word_count)
    except Exception as e:
        logger.error(f"[ai_analyzer] Groq failed: {e}")
        return None


# ── Heuristic Fallback ────────────────────────────────────────────────────────
_SECTION_KEYWORDS = {
    "experience":     ["experience", "work history", "employment"],
    "education":      ["education", "degree", "university", "college"],
    "skills":         ["skills", "technical skills", "technologies"],
    "projects":       ["projects", "portfolio", "open source"],
    "summary":        ["summary", "objective", "profile", "about me"],
    "certifications": ["certifications", "certificates", "licenses"],
    "contact":        ["email", "phone", "linkedin", "github"],
}
_ACTION_VERBS = [
    "achieved", "built", "created", "designed", "developed", "engineered",
    "implemented", "improved", "launched", "led", "managed", "optimized",
    "reduced", "shipped", "solved", "streamlined",
]

def _heuristic_analyze(text: str) -> dict:
    lower, word_count = text.lower(), len(text.split())
    sections = [s for s, kws in _SECTION_KEYWORDS.items() if any(kw in lower for kw in kws)]
    score, strengths, recommendations = 0.0, [], []

    score += min(len(sections) * 6, 40)
    if len(sections) >= 5:
        strengths.append("Well-structured with multiple clear sections")
    else:
        missing = [s for s in ["experience","education","skills","summary","contact"] if s not in sections]
        if missing:
            recommendations.append(f"Add missing sections: {', '.join(missing).title()}")

    if 400 <= word_count <= 900:
        score += 20; strengths.append("Appropriate resume length")
    elif word_count < 400:
        score += 8;  recommendations.append("Resume too short — add more experience detail")
    else:
        score += 12; recommendations.append("Resume too long — aim for 400–900 words")

    action_count = sum(1 for v in _ACTION_VERBS if v in lower)
    score += min(action_count * 2, 20)
    if action_count >= 5: strengths.append("Good use of strong action verbs")
    else: recommendations.append("Use more action verbs (Achieved, Built, Optimized, Led)")

    if len(re.findall(r"\b\d+[%x]?\b", text)) >= 3:
        score += 10; strengths.append("Contains quantified achievements")
    else:
        recommendations.append("Add measurable metrics (e.g., '30% faster', 'managed 10 engineers')")

    if "contact" in sections:
        score += 10; strengths.append("Contact information present")
    else:
        recommendations.append("Add contact details (email, LinkedIn, phone)")

    score = round(min(score, 100), 1)
    grade = "A" if score>=85 else "B" if score>=70 else "C" if score>=55 else "D" if score>=40 else "F"
    return {"score": score, "grade": grade, "strengths": strengths,
            "recommendations": recommendations, "sections_found": sections, "word_count": word_count}


# ── Public API ────────────────────────────────────────────────────────────────
_BACKENDS = {
    "ollama":    _analyze_ollama,
    "mistral":   _analyze_mistral_api,
    "groq":      _analyze_groq,
    "heuristic": None,
}

def analyze_resume(text: str) -> dict:
    """
    Analyze resume text using the configured AI backend.
    Falls back to heuristic scoring if the primary backend fails.

    Configure via env: ANALYZER_BACKEND=ollama|mistral|groq|heuristic
    """
    if not text or len(text.strip()) < 50:
        return {
            "score": 0.0, "grade": "F", "word_count": 0, "sections_found": [],
            "strengths": [],
            "recommendations": ["Could not extract text from this PDF. Try a text-based PDF."],
        }

    word_count = len(text.split())
    backend_fn = _BACKENDS.get(ANALYZER_BACKEND)

    if backend_fn:
        logger.info(f"[ai_analyzer] Using backend: {ANALYZER_BACKEND}")
        result = backend_fn(text, word_count)
        if result:
            return result
        logger.warning(f"[ai_analyzer] Backend '{ANALYZER_BACKEND}' failed — falling back to heuristic")

    return _heuristic_analyze(text)
