from __future__ import annotations

from typing import Any, Dict, List, Optional

import requests

from config import REQUEST_TIMEOUT_SECONDS

API_BASE = "https://boards-api.greenhouse.io/v1/boards"


def fetch_board(session: requests.Session, token: str) -> Optional[Dict[str, Any]]:
    """Board info ({ name, content }), or None if no board exists for this token."""
    response = session.get(f"{API_BASE}/{token}", timeout=REQUEST_TIMEOUT_SECONDS)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()


def fetch_jobs(session: requests.Session, token: str) -> List[Dict[str, Any]]:
    """Every open job on the board, including descriptions, departments and offices."""
    response = session.get(
        f"{API_BASE}/{token}/jobs",
        params={"content": "true"},
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json().get("jobs", [])
