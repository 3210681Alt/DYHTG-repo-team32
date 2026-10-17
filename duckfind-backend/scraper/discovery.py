"""Finds new Greenhouse board tokens from Common Crawl's index of crawled job-board URLs.

Best effort only: Common Crawl's index is often overloaded (504s), so any failure is logged and the
run carries on with the boards it already knows.
"""

from __future__ import annotations

import json
import logging
import re
import time
from typing import Set
from urllib.parse import parse_qs, urlparse

import requests

from config import MAX_DISCOVERY_PAGES_PER_HOST, REQUEST_TIMEOUT_SECONDS

log = logging.getLogger(__name__)

COLLECTIONS_URL = "https://index.commoncrawl.org/collinfo.json"
HOSTS = ("job-boards.greenhouse.io", "boards.greenhouse.io")
TOKEN_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]{1,60}$")
# First path segments that aren't company tokens
NOT_TOKENS = {"embed", "v1", "jobs", "job_app", "api", "assets", "static", "favicon.ico", "robots.txt"}


def token_from_url(url: str) -> str | None:
    parsed = urlparse(url)
    segments = [s for s in parsed.path.split("/") if s]
    if not segments:
        return None
    # Embedded boards look like boards.greenhouse.io/embed/job_board?for=<token>
    if segments[0] == "embed":
        candidate = (parse_qs(parsed.query).get("for") or [""])[0]
    else:
        candidate = segments[0]
    candidate = candidate.lower()
    if candidate in NOT_TOKENS or not TOKEN_PATTERN.match(candidate):
        return None
    return candidate


def discover_tokens(session: requests.Session) -> Set[str]:
    tokens: Set[str] = set()
    try:
        collections = session.get(COLLECTIONS_URL, timeout=REQUEST_TIMEOUT_SECONDS).json()
        cdx_api = collections[0]["cdx-api"]
    except (requests.RequestException, ValueError, KeyError, IndexError) as err:
        log.warning("Discovery skipped, couldn't load Common Crawl collections: %s", err)
        return tokens

    for host in HOSTS:
        for page in range(MAX_DISCOVERY_PAGES_PER_HOST):
            try:
                response = session.get(
                    cdx_api,
                    params={"url": f"{host}/*", "output": "json", "fl": "url", "page": page},
                    timeout=REQUEST_TIMEOUT_SECONDS,
                )
                if response.status_code == 400:
                    break  # past the last page
                response.raise_for_status()
            except requests.RequestException as err:
                log.warning("Discovery: %s page %d failed: %s", host, page, err)
                break

            for line in response.text.splitlines():
                try:
                    token = token_from_url(json.loads(line)["url"])
                except (ValueError, KeyError, TypeError):
                    continue
                if token:
                    tokens.add(token)
            time.sleep(1)  # Common Crawl asks clients to go slowly

    log.info("Discovery found %d candidate boards", len(tokens))
    return tokens
