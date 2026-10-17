"""UK Home Office Register of Licensed Sponsors (workers): download, index and match companies."""

from __future__ import annotations

import csv
import io
import logging
import re
from typing import Dict, Iterable, List, Optional, Set, Tuple

import requests

from config import REQUEST_TIMEOUT_SECONDS

log = logging.getLogger(__name__)

# The CSV's URL changes with every daily update, so it's looked up through GOV.UK's content API
REGISTER_CONTENT_API = (
    "https://www.gov.uk/api/content/government/publications/register-of-licensed-sponsors-workers"
)
# Only routes for ordinary employment; skips e.g. religious, creative and seasonal worker routes
JOB_ROUTE_PREFIXES = ("Skilled Worker", "Global Business Mobility", "Scale-up", "Senior or Specialist")
# Company-type words dropped from the end of names before comparing
LEGAL_SUFFIXES = {"ltd", "limited", "plc", "llp", "llc", "lp", "inc", "incorporated", "corp",
                  "corporation", "co", "company", "uk", "gb"}
NON_ALPHANUMERIC = re.compile(r"[^a-z0-9]+")


def normalise_name(name: str) -> str:
    """'Monzo Bank Ltd.' -> 'monzo bank', 'The Trade Desk (UK) Limited' -> 'trade desk'."""
    words = NON_ALPHANUMERIC.sub(" ", name.lower().replace("&", " and ")).split()
    if words and words[0] == "the":
        words = words[1:]
    while words and words[-1] in LEGAL_SUFFIXES:
        words.pop()
    return " ".join(words)


class SponsorRegister:
    def __init__(self, rows: Iterable[Dict[str, str]]):
        # normalised name -> (name as written in the register, job routes)
        self._index: Dict[str, Tuple[str, Set[str]]] = {}
        for row in rows:
            name = (row.get("Organisation Name") or "").strip()
            route = (row.get("Route") or "").strip()
            key = normalise_name(name)
            if not key or not route.startswith(JOB_ROUTE_PREFIXES):
                continue
            self._index.setdefault(key, (name, set()))[1].add(route)

    def __len__(self) -> int:
        return len(self._index)

    @classmethod
    def download(cls, session: requests.Session) -> "SponsorRegister":
        content = session.get(REGISTER_CONTENT_API, timeout=REQUEST_TIMEOUT_SECONDS)
        content.raise_for_status()
        attachments = content.json().get("details", {}).get("attachments", [])
        csv_url = next((a["url"] for a in attachments if a.get("url", "").endswith(".csv")), None)
        if not csv_url:
            raise RuntimeError("No CSV attachment found on the sponsor register page")

        log.info("Downloading sponsor register %s", csv_url)
        response = session.get(csv_url, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        text = response.content.decode("utf-8-sig", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        # Header cells can carry stray spaces
        reader.fieldnames = [name.strip() for name in reader.fieldnames or []]
        return cls(reader)

    def match(self, names: Iterable[str]) -> Optional[Tuple[str, List[str]]]:
        """First name (company name or alias) found in the register -> (register name, routes)."""
        for name in names:
            entry = self._index.get(normalise_name(name))
            if entry:
                return entry[0], sorted(entry[1])
        return None
