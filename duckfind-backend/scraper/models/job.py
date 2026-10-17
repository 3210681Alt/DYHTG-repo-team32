from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class Job:
    """One job listing. Stored in the `jobs` collection, linked to its company by `companyId`."""

    greenhouse_id: int
    title: str
    location: str
    is_uk: bool
    url: str
    description_html: str
    description_text: str
    departments: List[str] = field(default_factory=list)
    offices: List[str] = field(default_factory=list)
    first_published_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    def to_document(self) -> Dict[str, Any]:
        # companyId, sponsorsVisa and lastSeenAt are added when the job is saved (see db.py)
        return {
            "greenhouseId": self.greenhouse_id,
            "title": self.title,
            "location": self.location,
            "isUk": self.is_uk,
            "url": self.url,
            "descriptionHtml": self.description_html,
            "descriptionText": self.description_text,
            "departments": self.departments,
            "offices": self.offices,
            "firstPublishedAt": self.first_published_at,
            "updatedAt": self.updated_at,
        }
