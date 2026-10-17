"""Splits raw Greenhouse API payloads into Company and Job records."""

from __future__ import annotations

import html
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from classify import countries_for, is_uk_location, seniority_for, workplace_for
from models import Company, Job

# Tags that separate words; inline tags like <strong> can sit inside a word ("<b>A</b>BOUT")
BLOCK_TAG_PATTERN = re.compile(
    r"</?(p|div|br|li|ul|ol|h[1-6]|tr|td|th|table|section|blockquote|hr)\b[^>]*>", re.IGNORECASE
)
TAG_PATTERN = re.compile(r"<[^>]+>")
WHITESPACE_PATTERN = re.compile(r"\s+")


def html_to_text(markup: str) -> str:
    text = TAG_PATTERN.sub("", BLOCK_TAG_PATTERN.sub(" ", markup))
    return WHITESPACE_PATTERN.sub(" ", html.unescape(text)).strip()


def parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        # Python 3.9's fromisoformat doesn't accept a trailing "Z"
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def extract_company(
    token: str, board: Dict[str, Any], job_count: int, name_override: Optional[str] = None
) -> Company:
    return Company(
        board_token=token,
        name=(name_override or board.get("name") or token).strip(),
        description=html_to_text(board.get("content") or ""),
        board_url=f"https://job-boards.greenhouse.io/{token}",
        job_count=job_count,
    )


def extract_job(raw: Dict[str, Any]) -> Job:
    # Greenhouse returns the description HTML-escaped (&lt;p&gt;...)
    description_html = html.unescape(raw.get("content") or "")
    location = ((raw.get("location") or {}).get("name") or "").strip()
    offices = [office.get("name", "") for office in raw.get("offices") or [] if office.get("name")]
    # The location is where the job is; offices often list every office of the company, so they
    # are only used when the location is missing
    place = location or "; ".join(offices)
    countries = countries_for(place)
    title = (raw.get("title") or "").strip()

    return Job(
        greenhouse_id=int(raw["id"]),
        title=title,
        location=location,
        is_uk="United Kingdom" in countries,
        countries=countries,
        workplace=workplace_for(location, title),
        seniority=seniority_for(title),
        url=raw.get("absolute_url") or "",
        description_html=description_html,
        description_text=html_to_text(description_html),
        departments=[d.get("name", "") for d in raw.get("departments") or [] if d.get("name")],
        offices=offices,
        first_published_at=parse_datetime(raw.get("first_published")),
        updated_at=parse_datetime(raw.get("updated_at")),
    )


def extract_jobs(raw_jobs: List[Dict[str, Any]]) -> List[Job]:
    return [extract_job(raw) for raw in raw_jobs if raw.get("id") is not None]
