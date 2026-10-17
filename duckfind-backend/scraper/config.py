from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

SCRAPER_DIR = Path(__file__).resolve().parent

# Shares the backend's .env (duckfind-backend/.env)
load_dotenv(SCRAPER_DIR.parent / ".env")

MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.environ.get("MONGODB_DB", "duckfind")
SCRAPE_INTERVAL_HOURS = float(os.environ.get("SCRAPE_INTERVAL_HOURS", "24"))

SEEDS_FILE = SCRAPER_DIR / "seeds.json"
DATA_DIR = SCRAPER_DIR / "data"

USER_AGENT = "DuckFindScraper/0.1 (job aggregator; contact via github.com/Spikree)"
REQUEST_TIMEOUT_SECONDS = 60
# Pause between Greenhouse boards so we don't hammer their API
DELAY_BETWEEN_BOARDS_SECONDS = 1.0
# Caps how many newly discovered boards are added per run, so a run stays a few minutes long
MAX_NEW_BOARDS_PER_RUN = 50
# Common Crawl index pages to read per host (each page is a few thousand URLs)
MAX_DISCOVERY_PAGES_PER_HOST = 3
