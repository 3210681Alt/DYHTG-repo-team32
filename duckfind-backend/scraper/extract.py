"""Splits raw Greenhouse API payloads into Company and Job records."""

from __future__ import annotations

import html
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from models import Company, Job

UK_PATTERN = re.compile(
    r"\b(uk|u\.k\.|united kingdom|great britain|england|scotland|wales|northern ireland|"
    r"london|manchester|edinburgh|glasgow|cardiff|bristol|cambridge|oxford|birmingham|leeds|"
    r"belfast|liverpool|newcastle|sheffield|nottingham|reading|brighton|bath|milton keynes)\b",
    re.IGNORECASE,
)
# Places that share a UK city's name
NOT_UK_PATTERN = re.compile(
    r"\b(massachusetts|ontario|kentucky|ohio|connecticut)\b|cambridge,\s*ma\b|london,\s*on\b",
    re.IGNORECASE,
)
# Tags that separate words; inline tags like <strong> can sit inside a word ("<b>A</b>BOUT")
BLOCK_TAG_PATTERN = re.compile(
    r"</?(p|div|br|li|ul|ol|h[1-6]|tr|td|th|table|section|blockquote|hr)\b[^>]*>", re.IGNORECASE
)
TAG_PATTERN = re.compile(r"<[^>]+>")
WHITESPACE_PATTERN = re.compile(r"\s+")


def html_to_text(markup: str) -> str:
    text = TAG_PATTERN.sub("", BLOCK_TAG_PATTERN.sub(" ", markup))
    return WHITESPACE_PATTERN.sub(" ", html.unescape(text)).strip()


def is_uk_location(name: str) -> bool:
    return bool(name and UK_PATTERN.search(name) and not NOT_UK_PATTERN.search(name))


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
    is_uk = is_uk_location(location) if location else any(is_uk_location(o) for o in offices)

    return Job(
        greenhouse_id=int(raw["id"]),
        title=(raw.get("title") or "").strip(),
        location=location,
        is_uk=is_uk,
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
