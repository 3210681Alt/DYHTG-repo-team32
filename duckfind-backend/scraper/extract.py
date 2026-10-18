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


# "Closing Date: 1st November 2026", "Applications close: Sunday November 1st 2026"...
CLOSING_PATTERN = re.compile(
    r"(?:closing date|applications? (?:close|closes|deadline)|deadline (?:for applications|to apply))"
    r"\s*(?:is|on|:|-|–)?\s*(?P<date>[^.;|\n]{6,40})",
    re.IGNORECASE,
)
WEEKDAYS = r"(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s*"
DATE_FORMATS = ("%d %B %Y", "%B %d %Y", "%d %b %Y", "%b %d %Y", "%d/%m/%Y")


def parse_written_date(text: str) -> Optional[datetime]:
    """'Sunday November 1st 2026' -> 2026-11-01. Needs a year, so 'November 15th' is ignored."""
    cleaned = re.sub(WEEKDAYS, "", text.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"(\d)(st|nd|rd|th)\b", r"\1", cleaned)
    cleaned = re.sub(r"\bof\b|,", " ", cleaned)
    cleaned = " ".join(cleaned.split())
    # Try the first 3 words (e.g. "1 November 2026"), ignoring whatever follows
    words = cleaned.split(" ")
    for length in (3, 1):
        candidate = " ".join(words[:length])
        for date_format in DATE_FORMATS:
            try:
                return datetime.strptime(candidate, date_format)
            except ValueError:
                continue
    return None


def closing_date_for(raw: Dict[str, Any], description_text: str) -> Optional[datetime]:
    """Greenhouse's application_deadline if set, otherwise a date written in the description."""
    deadline = parse_datetime(raw.get("application_deadline"))
    if deadline:
        return deadline
    match = CLOSING_PATTERN.search(description_text)
    return parse_written_date(match.group("date")) if match else None


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
        closing_date=closing_date_for(raw, html_to_text(description_html)),
    )


def extract_jobs(raw_jobs: List[Dict[str, Any]]) -> List[Job]:
    return [extract_job(raw) for raw in raw_jobs if raw.get("id") is not None]
