"""DuckFind scraper: Greenhouse boards -> companies + jobs in MongoDB, flagged with UK visa sponsorship.

Usage:
    python scraper/main.py          run now, then again every SCRAPE_INTERVAL_HOURS
    python scraper/main.py --once   run once and exit
"""

from __future__ import annotations

import argparse
import json
import logging
import time
from typing import Any, Dict, List, Optional

import requests
from pymongo.database import Database

import db as store
from config import (
    DATA_DIR,
    DELAY_BETWEEN_BOARDS_SECONDS,
    MAX_NEW_BOARDS_PER_RUN,
    SCRAPE_INTERVAL_HOURS,
    SEEDS_FILE,
)
from discovery import discover_tokens
from extract import extract_company, extract_jobs
from greenhouse import fetch_board, fetch_jobs
from net import make_session
from sponsors import SponsorRegister

log = logging.getLogger("scraper")


def load_seeds() -> Dict[str, Dict[str, Any]]:
    """board token -> seed entry ({ token, name?, sponsorAliases? }), from seeds.json."""
    seeds = json.loads(SEEDS_FILE.read_text())
    return {seed["token"].lower(): seed for seed in seeds}


def scrape_board(
    db: Database,
    session: requests.Session,
    token: str,
    seed: Dict[str, Any],
    register: Optional[SponsorRegister],
    known: bool,
    stats: Dict[str, int],
) -> None:
    now = store.utc_now()
    board = fetch_board(session, token)
    if board is None:
        if known:
            removed = store.remove_company_jobs(db, token, now)
            log.warning("%s: board no longer exists, removed %d jobs", token, removed)
        return

    jobs = extract_jobs(fetch_jobs(session, token))
    company = extract_company(token, board, job_count=len(jobs), name_override=seed.get("name"))

    if register is not None:
        names: List[str] = [company.name, board.get("name") or "", *seed.get("sponsorAliases", [])]
        match = register.match(names)
        if match:
            company.sponsors_visa = True
            company.sponsor_register_name, company.sponsor_routes = match
        else:
            stats["unmatched"] += 1

    company_id, sponsors_visa = store.upsert_company(db, company, now, register is not None)
    saved, removed = store.replace_company_jobs(db, company_id, jobs, sponsors_visa, now)

    stats["boards"] += 1
    stats["jobs"] += saved
    stats["removed"] += removed
    stats["sponsors"] += int(sponsors_visa)
    log.info(
        "%s (%s): %d jobs, %d removed, sponsor=%s",
        token, company.name, saved, removed,
        company.sponsor_register_name if sponsors_visa else "no",
    )


def write_snapshots(db: Database) -> None:
    """data/companies.json and data/jobs.json: a readable copy of what's in Mongo."""
    DATA_DIR.mkdir(exist_ok=True)
    for collection in ("companies", "jobs"):
        documents = list(db[collection].find())
        (DATA_DIR / f"{collection}.json").write_text(
            json.dumps(documents, default=str, indent=2, ensure_ascii=False)
        )


def run_once() -> None:
    started = time.monotonic()
    db = store.get_database()
    store.ensure_indexes(db)
    session = make_session()

    seeds = load_seeds()
    known = set(store.known_board_tokens(db))
    new_tokens = sorted(discover_tokens(session) - known - set(seeds))[:MAX_NEW_BOARDS_PER_RUN]
    tokens = sorted(set(seeds) | known) + new_tokens

    try:
        register: Optional[SponsorRegister] = SponsorRegister.download(session)
        log.info("Sponsor register: %d organisations on job routes", len(register))
    except (requests.RequestException, RuntimeError, ValueError) as err:
        register = None
        log.error("Sponsor register unavailable, keeping previous sponsor flags: %s", err)

    stats = {"boards": 0, "jobs": 0, "removed": 0, "sponsors": 0, "unmatched": 0, "failed": 0}
    for token in tokens:
        try:
            scrape_board(db, session, token, seeds.get(token, {}), register, token in known, stats)
        except Exception:  # one bad board must not stop the run
            stats["failed"] += 1
            log.exception("%s: failed", token)
        time.sleep(DELAY_BETWEEN_BOARDS_SECONDS)

    write_snapshots(db)
    log.info(
        "Done in %.0fs: %d boards (%d new tried), %d jobs saved, %d removed, %d sponsors, "
        "%d not on register, %d failed",
        time.monotonic() - started, stats["boards"], len(new_tokens), stats["jobs"],
        stats["removed"], stats["sponsors"], stats["unmatched"], stats["failed"],
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("--once", action="store_true", help="run once and exit")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    while True:
        try:
            run_once()
        except Exception:
            if args.once:
                raise
            log.exception("Run failed, will retry at the next interval")
        if args.once:
            return
        log.info("Next run in %.1f hours", SCRAPE_INTERVAL_HOURS)
        time.sleep(SCRAPE_INTERVAL_HOURS * 3600)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
