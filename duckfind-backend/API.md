# DuckFind API

Base URL: `{{host}}/api` (e.g. `http://localhost:3000/api`)
🔒 = needs the `token` cookie (set by register/login)

---

## Auth

### POST `/auth/register`

```json
{ "name": "Ducky", "username": "ducky", "email": "ducky@gmail.com", "password": "Ducky123123" }
```

`201`

```json
{
  "status": 201,
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "name": "Ducky",
    "username": "ducky",
    "email": "ducky@gmail.com",
    "skills": [],
    "resumeUrl": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

`400` `{ "status": 400, "message": "Password must be at least 8 characters" }`
`409` `{ "status": 409, "message": "Email is already registered" }` / `"Username is already taken"`

### POST `/auth/login`

```json
{ "identifier": "ducky@gmail.com", "password": "Ducky123123" }
```

`identifier` = email or username

`200` `{ "status": 200, "message": "Logged in successfully", "user": { ... } }`
`401` `{ "status": 401, "message": "Invalid email/username or password" }`

### POST `/auth/logout`

`200` `{ "status": 200, "message": "Logged out successfully" }`

### GET `/auth/checkAuth` 🔒

`200` `{ "status": 200, "message": "Authenticated", "user": { ... } }`
`401` `{ "status": 401, "message": "Unauthorized - Invalid or missing token" }`

---

## Profile 🔒

### POST `/profile/skills`

```json
{ "skill": "react" }
```

`200` `{ "status": 200, "message": "Skill added", "skills": ["React"] }`
`400` `{ "status": 400, "message": "Unknown skill" }`
`409` `{ "status": 409, "message": "Skill already added" }`

### DELETE `/profile/skills/:skill`

e.g. `/profile/skills/React`, `/profile/skills/UI%2FUX%20Design`

`200` `{ "status": 200, "message": "Skill removed", "skills": [] }`
`404` `{ "status": 404, "message": "Skill not found in your list" }`

### PATCH `/profile/email`

```json
{ "email": "new@gmail.com", "currentPassword": "Ducky123123" }
```

`200` `{ "status": 200, "message": "Email updated", "user": { ... } }`
`401` `{ "status": 401, "message": "Current password is incorrect" }`
`409` `{ "status": 409, "message": "Email is already registered" }`

### PATCH `/profile/password`

```json
{ "currentPassword": "Ducky123123", "newPassword": "NewPass123" }
```

`200` `{ "status": 200, "message": "Password updated" }`
`400` `{ "status": 400, "message": "New password must be different from current password" }`
`401` `{ "status": 401, "message": "Current password is incorrect" }`

### GET `/profile/universities`

`200` `{ "status": 200, "message": "Universities fetched", "universities": [ ... ] }`

### POST `/profile/universities`

```json
{
  "university": "University of Glasgow",
  "course": "Computing Science",
  "courseType": "undergraduate",
  "status": "expected",
  "graduationDate": "2027-06-30"
}
```

`courseType`: `undergraduate` / `postgraduate` / `phd` / `other`
`status`: `graduated` / `not_graduated` / `expected` · `graduationDate` optional

`201` `{ "status": 201, "message": "University added", "university": { "id": "uuid", ... } }`
`400` `{ "status": 400, "message": "Course is required" }`

### PATCH `/profile/universities/:id`

Any of the fields above, e.g. `{ "status": "graduated", "graduationDate": "2026-06-30" }`

`200` `{ "status": 200, "message": "University updated", "university": { ... } }`
`404` `{ "status": 404, "message": "University not found" }`

### DELETE `/profile/universities/:id`

`200` `{ "status": 200, "message": "University removed" }`

### GET `/profile/saved-jobs`

`200`

```json
{
  "status": 200,
  "message": "Saved jobs fetched",
  "savedJobs": [
    {
      "jobId": "6ad3...",
      "jobTitle": "Credit Risk Manager",
      "companyName": "Monzo",
      "jobUrl": "https://...",
      "savedAt": "...",
      "job": { "...same as /jobs list, or null if taken down": "" }
    }
  ]
}
```

### POST `/profile/saved-jobs`

```json
{ "jobId": "6ad3aa8b9b08380fc5459c06" }
```

`201` `{ "status": 201, "message": "Job saved", "savedJob": { ... } }`
`404` `{ "status": 404, "message": "Job not found" }`
`409` `{ "status": 409, "message": "Job already saved" }`

### DELETE `/profile/saved-jobs/:jobId`

`200` `{ "status": 200, "message": "Job removed from saved" }`

### GET `/profile/hidden-jobs`

"Not interested" jobs. They're left out of `GET /jobs` for this user.

`200` `{ "status": 200, "message": "Hidden jobs fetched", "hiddenJobs": [{ "jobId", "jobTitle", "companyName", "hiddenAt" }] }`

### POST `/profile/hidden-jobs`

```json
{ "jobId": "6ad3aa8b9b08380fc5459c06" }
```

`201` `{ "status": 201, "message": "Job hidden", "hiddenJob": { ... } }`
`409` `{ "status": 409, "message": "Job already hidden" }`

### DELETE `/profile/hidden-jobs/:jobId`

`200` `{ "status": 200, "message": "Job shown again" }`

### GET `/profile/applications`

`200` `{ "status": 200, "message": "Applications fetched", "applications": [{ "jobId", "jobTitle", "companyName", "jobUrl", "status", "appliedAt", "updatedAt", "job" }] }`

### POST `/profile/applications`

```json
{ "jobId": "6ad3aa8b9b08380fc5459c06", "status": "applied" }
```

`status` (optional, default `applied`): `applied` / `online_assessment` / `interview` / `assessment_centre` / `offer` / `rejected` / `withdrawn`

`201` `{ "status": 201, "message": "Application added", "application": { ... } }`
`409` `{ "status": 409, "message": "You've already added this application" }`

### PATCH `/profile/applications/:jobId`

```json
{ "status": "online_assessment" }
```

`200` `{ "status": 200, "message": "Status updated", "application": { ... } }`
`404` `{ "status": 404, "message": "Application not found" }`

### DELETE `/profile/applications/:jobId`

`200` `{ "status": 200, "message": "Application removed" }`

### GET `/profile/resume`

`200` `{ "status": 200, "message": "CV fetched", "resume": { "name": "cv.pdf", "uploadedAt": "...", "keywords": ["Python", "React", "payments"], "downloadUrl": "https://api.cloudinary.com/... (works for 10 minutes)" } }`
`404` `{ "status": 404, "message": "You haven't uploaded a CV yet" }`

### PUT `/profile/resume`

Body: `form-data`, key `resume` (type File), a PDF up to 5 MB. Replaces any earlier CV.

`200` `{ "status": 200, "message": "CV uploaded", "resume": { ... } }`
`400` `{ "status": 400, "message": "Your CV must be a PDF" }`
`400` `{ "status": 400, "message": "We couldn't find any text in this PDF. If it's a scan, upload one made from a document instead" }`
`413` `{ "status": 413, "message": "Your CV must be 5 MB or smaller" }`
`503` `{ "status": 503, "message": "CV uploads aren't set up on this server yet" }`

### DELETE `/profile/resume`

`200` `{ "status": 200, "message": "CV removed" }`

Jobs that fit the CV: `GET /jobs?keywords=<resume keywords joined by spaces>&sort=relevance` (the keywords are also on the user as `resumeKeywords`).

---

## Skills

### GET `/skills` 🔒

`200` `{ "status": 200, "message": "Skills fetched", "skills": ["JavaScript", "TypeScript", "..."] }`

---

## Jobs

### GET `/jobs`

When logged in, jobs you marked "Not interested" are left out.

All query params optional:

| Param          | Example                                                    |
| -------------- | ---------------------------------------------------------- |
| `sponsors`     | `true` / `false`                                           |
| `uk`           | `true` / `false`                                           |
| `seniority`    | `intern,graduate,junior,mid,senior,lead`                   |
| `workplace`    | `remote,hybrid,onsite`                                     |
| `country`      | `united kingdom,ireland`                                   |
| `location`     | `manchester`                                               |
| `department`   | `engineering` (one department)                             |
| `company`      | `monzo,stripe`                                             |
| `route`        | `skilled-worker` / `global-business-mobility` / `scale-up` |
| `postedWithin` | `7` (days, 1–365)                                          |
| `q`            | `engineer` (title)                                         |
| `keywords`     | `machine learning` (title + description)                   |
| `sort`         | `newest` / `oldest` / `title` / `relevance`                |
| `page`         | `1`                                                        |
| `limit`        | `20` (max 100)                                             |

e.g. `/jobs?sponsors=true&uk=true&seniority=intern,graduate`

`200`

```json
{
  "status": 200,
  "message": "Jobs fetched",
  "jobs": [
    {
      "_id": "6ad3...",
      "title": "Software Engineer, New Grad",
      "location": "London, United Kingdom",
      "isUk": true,
      "countries": ["United Kingdom"],
      "workplace": ["onsite"],
      "seniority": "graduate",
      "departments": ["Engineering"],
      "offices": ["London"],
      "sponsorsVisa": true,
      "url": "https://job-boards.greenhouse.io/...",
      "firstPublishedAt": "...",
      "updatedAt": "...",
      "closingDate": "2026-11-01T00:00:00.000Z (or null when the company gives no closing date)",
      "company": {
        "_id": "...",
        "name": "Deliveroo",
        "boardToken": "deliveroo",
        "boardUrl": "...",
        "sponsorsVisa": true
      }
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 9,
  "totalPages": 1
}
```

`400` `{ "status": 400, "message": "seniority must be one of: intern, graduate, junior, mid, senior, lead" }`
`404` `{ "status": 404, "message": "Company not found" }`

### GET `/jobs/matches` 🔒

Jobs ranked by how well they fit you, best first. Each job gets a `match` score out of 100 from:
the share of the skills it asks for that you have, how many of your skills it uses, your skills or
CV words in its title, whether its level fits your education (students: intern/graduate; senior
and lead roles are pushed down), and how often it mentions you. The top 300 text matches are
scored; jobs sharing no skill and nothing in the title are left out. "Not interested" jobs are
left out too.

| Param       | Example                                   |
| ----------- | ----------------------------------------- |
| `from`      | `skills` (profile skills, default) / `cv` |
| `sponsors`  | `true` / `false`                          |
| `uk`        | `true` / `false`                          |
| `seniority` | `intern,graduate,junior`                  |
| `page`      | `1`                                       |
| `limit`     | `20` (max 100)                            |

`200` Same as `GET /jobs`, with `"message": "Matches fetched"` and a `match` on every job:

```json
"match": { "score": 76, "matched": ["Python", "SQL"], "missing": ["Machine Learning"], "levelFit": true }
```

`404` `{ "status": 404, "message": "You haven't uploaded a CV yet" }` (or "Add some skills to your profile first")

### GET `/jobs/filters`

`200`

```json
{
  "status": 200,
  "message": "Filters fetched",
  "filters": {
    "countries": [{ "value": "United Kingdom", "count": 806 }],
    "departments": [{ "value": "Engineering", "count": 172 }],
    "workplace": [{ "value": "remote", "count": 1462 }],
    "seniority": [{ "value": "intern", "count": 107 }],
    "companies": [{ "value": "monzo", "name": "Monzo", "sponsorsVisa": true, "count": 71 }],
    "routes": [{ "value": "skilled-worker", "name": "Skilled Worker" }],
    "sorts": ["newest", "oldest", "title", "relevance"]
  }
}
```

### GET `/jobs/:id`

`200` `{ "status": 200, "message": "Job fetched", "job": { ...same as list, plus "descriptionHtml", "descriptionText", "company": { ..., "description", "sponsorRegisterName", "sponsorRoutes" } } }`
`400` `{ "status": 400, "message": "Invalid job id" }`
`404` `{ "status": 404, "message": "Job not found" }`

### GET `/greenhouse/jobs`

Live jobs for `GREENHOUSE_BOARD_TOKEN` in `.env`

`200` `{ "status": 200, "jobs": [ ...raw Greenhouse jobs ] }`

---

## Common errors

`400` `{ "status": 400, "message": "Invalid JSON in request body" }`
`404` `{ "status": 404, "message": "Route not found" }`
`429` `{ "status": 429, "message": "Too many attempts, please try again later" }` (register/login)
`500` `{ "status": 500, "message": "Internal server error" }`
