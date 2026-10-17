from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class Company:
    """One Greenhouse board. Stored in the `companies` collection, keyed by `boardToken`."""

    board_token: str
    name: str
    description: str
    board_url: str
    job_count: int = 0
    # Set from the UK Register of Licensed Sponsors
    sponsors_visa: bool = False
    sponsor_register_name: Optional[str] = None
    sponsor_routes: List[str] = field(default_factory=list)

    def to_document(self, include_sponsor: bool = True) -> Dict[str, Any]:
        document: Dict[str, Any] = {
            "boardToken": self.board_token,
            "name": self.name,
            "description": self.description,
            "boardUrl": self.board_url,
            "jobCount": self.job_count,
        }
        # Left out when the register couldn't be downloaded, so the stored flag is kept
        if include_sponsor:
            document["sponsorsVisa"] = self.sponsors_visa
            document["sponsorRegisterName"] = self.sponsor_register_name
            document["sponsorRoutes"] = self.sponsor_routes
        return document
