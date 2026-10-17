"""Derives filterable fields from a job's title and location text: countries, workplace, seniority.

These are best-effort keyword matches; Greenhouse has no structured fields for them.
"""

from __future__ import annotations

import re
from typing import List, Pattern, Tuple

UK_PATTERN = re.compile(
    r"\b(uk|u\.k\.|united kingdom|great britain|england|scotland|wales|northern ireland|"
    r"london|manchester|edinburgh|glasgow|cardiff|bristol|cambridge|oxford|birmingham|leeds|"
    r"belfast|liverpool|newcastle|sheffield|nottingham|reading|brighton|bath|milton keynes)\b",
    re.IGNORECASE,
)
# Places that share a UK place's name
NOT_UK_PATTERN = re.compile(
    r"\b(massachusetts|ontario|kentucky|ohio|connecticut|new south wales)\b"
    r"|cambridge,\s*ma\b|london,\s*on\b",
    re.IGNORECASE,
)


def is_uk_location(name: str) -> bool:
    return bool(name and UK_PATTERN.search(name) and not NOT_UK_PATTERN.search(name))


def _words(*terms: str) -> Pattern[str]:
    return re.compile(r"\b(" + "|".join(terms) + r")\b", re.IGNORECASE)


# Case-sensitive, after a comma or dash ("Austin, TX", "Remote - CA"). DE and IN are left out because
# in job locations they usually mean Germany and India.
US_STATE_PATTERN = re.compile(
    r"[,\-]\s*(AL|AK|AZ|AR|CA|CO|CT|DC|FL|GA|HI|IA|ID|IL|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|"
    r"NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY)\b"
)

# (country name, pattern). The UK is handled by is_uk_location above.
COUNTRY_PATTERNS: List[Tuple[str, Pattern[str]]] = [
    ("United States", re.compile(
        r"\b(united states|u\.s\.a?\.?|america|new york|nyc|san francisco|seattle|austin|chicago|"
        r"boston|los angeles|denver|atlanta|washington,? d\.?c\.?|miami|dallas|houston|"
        r"california|texas|colorado|illinois|georgia|florida|oregon|massachusetts|virginia|"
        r"pennsylvania|north carolina|new jersey|arizona|nevada|utah|minnesota|ohio|michigan|"
        r"bay area|palo alto|mountain view|sunnyvale|san jose|menlo park|redmond|"
        r"san diego|philadelphia|pittsburgh|portland|salt lake city|nashville|raleigh)\b"
        r"|\bUSA?\b|US-Remote",
        re.IGNORECASE,
    )),
    ("Ireland", _words("ireland", "dublin", "cork", "galway")),
    ("Canada", _words("canada", "toronto", "vancouver", "montreal", "ottawa", "calgary",
                      "alberta", "ontario", "british columbia", "quebec")),
    ("Germany", _words("germany", "berlin", "munich", "münchen", "hamburg", "frankfurt", "cologne", "düsseldorf", "dusseldorf")),
    ("France", _words("france", "paris", "lyon", "bordeaux", "grenoble", "nantes", "montpellier",
                      "sophia antipolis")),
    ("Netherlands", _words("netherlands", "amsterdam", "rotterdam", "utrecht")),
    ("Spain", _words("spain", "madrid", "barcelona", "valencia", "málaga", "malaga", "seville")),
    ("Portugal", _words("portugal", "lisbon", "porto")),
    ("Italy", _words("italy", "milan", "rome")),
    ("Belgium", _words("belgium", "brussels", "bruxelles")),
    ("Luxembourg", _words("luxembourg")),
    ("Slovenia", _words("slovenia", "ljubljana")),
    ("Switzerland", _words("switzerland", "zurich", "zürich", "geneva")),
    ("Austria", _words("austria", "vienna")),
    ("Sweden", _words("sweden", "stockholm")),
    ("Denmark", _words("denmark", "copenhagen")),
    ("Norway", _words("norway", "oslo")),
    ("Finland", _words("finland", "helsinki")),
    ("Poland", _words("poland", "warsaw", "krakow", "kraków", "wroclaw")),
    ("Czechia", _words("czechia", "czech republic", "prague")),
    ("Lithuania", _words("lithuania", "vilnius")),
    ("Latvia", _words("latvia", "riga")),
    ("Estonia", _words("estonia", "tallinn")),
    ("Hungary", _words("hungary", "budapest")),
    ("Turkey", _words("turkey", "türkiye", "istanbul")),
    ("Bulgaria", _words("bulgaria", "sofia")),
    ("Serbia", _words("serbia", "belgrade")),
    ("Romania", _words("romania", "bucharest")),
    ("Greece", _words("greece", "athens")),
    ("Israel", _words("israel", "tel aviv")),
    ("United Arab Emirates", _words("united arab emirates", "uae", "dubai", "abu dhabi")),
    ("Qatar", _words("qatar", "doha")),
    ("Saudi Arabia", _words("saudi arabia", "riyadh", "jeddah")),
    ("Kuwait", _words("kuwait")),
    ("Egypt", _words("egypt", "cairo")),
    ("South Africa", _words("south africa", "cape town", "johannesburg")),
    ("Nigeria", _words("nigeria", "lagos")),
    ("Kenya", _words("kenya", "nairobi")),
    ("India", _words("india", "bengaluru", "bangalore", "mumbai", "hyderabad", "delhi", "pune",
                     "chennai", "gurgaon", "gurugram", "noida")),
    ("Singapore", _words("singapore")),
    ("Japan", _words("japan", "tokyo")),
    ("South Korea", _words("south korea", "korea", "seoul")),
    ("China", _words("china", "shanghai", "beijing", "shenzhen")),
    ("Hong Kong", _words("hong kong")),
    ("Taiwan", _words("taiwan", "taipei")),
    ("Thailand", _words("thailand", "bangkok")),
    ("Indonesia", _words("indonesia", "jakarta")),
    ("Malaysia", _words("malaysia", "kuala lumpur")),
    ("Vietnam", _words("vietnam", "ho chi minh", "hanoi")),
    ("Australia", _words("australia", "sydney", "melbourne", "brisbane", "perth", "new south wales")),
    ("New Zealand", _words("new zealand", "auckland")),
    ("Brazil", _words("brazil", "brasil", "são paulo", "sao paulo")),
    ("Mexico", _words("mexico", "méxico", "mexico city")),
    ("Argentina", _words("argentina", "buenos aires")),
    ("Colombia", _words("colombia", "bogota", "bogotá")),
    ("Chile", _words("chile", "santiago")),
    ("Philippines", _words("philippines", "manila")),
]


def countries_for(location: str) -> List[str]:
    if not location:
        return []
    found = ["United Kingdom"] if is_uk_location(location) else []
    # "Northern Ireland" is in the UK, not Ireland
    without_ni = re.sub(r"northern ireland", "", location, flags=re.IGNORECASE)
    for country, pattern in COUNTRY_PATTERNS:
        text = without_ni if country == "Ireland" else location
        if pattern.search(text) or (country == "United States" and US_STATE_PATTERN.search(location)):
            found.append(country)
    return found


REMOTE_PATTERN = _words("remote", "remote-friendly", "work from home", "wfh", "anywhere")
HYBRID_PATTERN = _words("hybrid")


def workplace_for(location: str, title: str) -> List[str]:
    """Any of remote / hybrid; onsite when neither is mentioned."""
    text = f"{location} {title}"
    types = []
    if REMOTE_PATTERN.search(text):
        types.append("remote")
    if HYBRID_PATTERN.search(text):
        types.append("hybrid")
    return types or ["onsite"]


# Checked in order; the first level that matches wins
SENIORITY_PATTERNS: List[Tuple[str, Pattern[str]]] = [
    ("intern", _words("intern", "interns", "internship", "internships", "placement",
                      "industrial placement", "co-op", "summer analyst", "summer associate",
                      "working student", "student")),
    ("graduate", _words("graduate", "grad", "new grad", "early careers?", "entry[- ]level",
                        "apprentice", "apprenticeship", "trainee")),
    ("junior", _words("junior", "jr\\.?")),
    # Not "manager": "Account Manager" or "Customer Success Manager" aren't leadership roles
    ("lead", _words("lead", "head", "director", "vp", "vice president", "chief", "cto", "cfo",
                    "ceo", "coo", "cpo", "managing director", "engineering manager",
                    "manager, (software )?engineering", "people manager")),
    ("senior", _words("senior", "sr\\.?", "staff", "principal", "expert", "distinguished")),
]


def seniority_for(title: str) -> str:
    """intern / graduate / junior / lead / senior, or mid when the title names no level."""
    for level, pattern in SENIORITY_PATTERNS:
        if pattern.search(title):
            return level
    return "mid"
