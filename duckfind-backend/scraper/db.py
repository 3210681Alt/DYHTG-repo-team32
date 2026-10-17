from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Tuple

from bson import ObjectId
from pymongo import ASCENDING, MongoClient, ReturnDocument, UpdateOne
from pymongo.database import Database

from config import MONGODB_DB, MONGODB_URI
from models import Company, Job


def utc_now() -> datetime:
    """Current time at millisecond precision, the precision Mongo stores. With microseconds, a job
    saved this run could compare as older than `now` and be deleted as stale."""
    now = datetime.now(timezone.utc)
    return now.replace(microsecond=now.microsecond // 1000 * 1000)


def get_database() -> Database:
    client: MongoClient = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000, tz_aware=True)
    client.admin.command("ping")  # fail fast if Mongo isn't running
    return client[MONGODB_DB]


def ensure_indexes(db: Database) -> None:
    db.companies.create_index("boardToken", unique=True)
    db.companies.create_index("sponsorsVisa")
    db.jobs.create_index([("companyId", ASCENDING), ("greenhouseId", ASCENDING)], unique=True)
    db.jobs.create_index("sponsorsVisa")
    db.jobs.create_index("isUk")


def known_board_tokens(db: Database) -> List[str]:
    return db.companies.distinct("boardToken")


def upsert_company(
    db: Database, company: Company, now: datetime, include_sponsor: bool
) -> Tuple[ObjectId, bool]:
    """Insert or update by boardToken. Returns the company's _id and its stored sponsorsVisa flag."""
    saved = db.companies.find_one_and_update(
        {"boardToken": company.board_token},
        {
            "$set": {**company.to_document(include_sponsor), "lastScrapedAt": now, "updatedAt": now},
            "$setOnInsert": {"createdAt": now, **({} if include_sponsor else {"sponsorsVisa": False})},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
        projection={"_id": True, "sponsorsVisa": True},
    )
    return saved["_id"], bool(saved.get("sponsorsVisa"))


def replace_company_jobs(
    db: Database, company_id: ObjectId, jobs: List[Job], sponsors_visa: bool, now: datetime
) -> Tuple[int, int]:
    """Upsert this run's jobs, then delete the company's jobs no longer on its board."""
    operations = [
        UpdateOne(
            {"companyId": company_id, "greenhouseId": job.greenhouse_id},
            {
                "$set": {
                    **job.to_document(),
                    "companyId": company_id,
                    "sponsorsVisa": sponsors_visa,
                    "lastSeenAt": now,
                },
                "$setOnInsert": {"createdAt": now},
            },
            upsert=True,
        )
        for job in jobs
    ]
    if operations:
        db.jobs.bulk_write(operations, ordered=False)
    removed = db.jobs.delete_many({"companyId": company_id, "lastSeenAt": {"$lt": now}})
    return len(operations), removed.deleted_count


def remove_company_jobs(db: Database, board_token: str, now: datetime) -> int:
    """A known board that no longer exists: its listings are gone too."""
    company = db.companies.find_one_and_update(
        {"boardToken": board_token},
        {"$set": {"jobCount": 0, "lastScrapedAt": now, "updatedAt": now}},
        projection={"_id": True},
    )
    if not company:
        return 0
    return db.jobs.delete_many({"companyId": company["_id"]}).deleted_count
