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

---

## Skills

### GET `/skills` 🔒

`200` `{ "status": 200, "message": "Skills fetched", "skills": ["JavaScript", "TypeScript", "..."] }`

---

## Jobs

### GET `/jobs`

All query params optional:

| Param          | Example                                                    |
| -------------- | ---------------------------------------------------------- |
| `sponsors`     | `true` / `false`                                           |
| `uk`           | `true` / `false`                                           |
| `seniority`    | `intern,graduate,junior,mid,senior,lead`                   |
| `workplace`    | `remote,hybrid,onsite`                                     |
| `country`      | `united kingdom,ireland`                                   |
| `location`     | `manchester`                                               |
| `department`   | `engineering`                                              |
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
