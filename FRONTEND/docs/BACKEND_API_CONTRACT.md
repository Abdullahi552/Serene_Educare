# Serene EduHealth: Backend Integration Guide

**Audience:** the backend developer.
**Purpose:** explain what the frontend is, how it behaves, and exactly which endpoints, request bodies and response shapes it expects.

The frontend is finished and talks to a REST API. If your API matches this document, no frontend change is needed. `src/mocks/mockAdapter.js` is a **runnable reference implementation** of everything below (in-memory, one file). When this document and the mock disagree, treat it as a bug and tell the frontend developer.

---

## 1. What the frontend is

A React single-page app (Vite + Tailwind CSS), built from the Figma file *Serene EduHealth Prototype*. It is a **school health management platform**: schools log student health incidents, run health activities (hygiene, nutrition, safety audits, health events), watch trends, train staff, and ask an AI assistant about protocols.

### Users and tenancy
- Users are **school staff** (roles: `school_admin`, `principal`, `school_nurse`, `counselor`, `teacher`). They sign in with **email + password**.
- Every user belongs to **one school**. **Every query must be scoped to the signed-in user's school** (take it from the token, never from the client). One school must never see another school's data.
- The design shows a single app for all roles. Role-based permissions are not designed; see section 10.

### Screens and the endpoints each one uses

| Screen | Route | Endpoints |
|---|---|---|
| Landing (public) | `/` | none (static plans and copy) |
| Sign in | `/login` | `POST /auth/login`, `GET /auth/me` |
| Get on board (school asks to be onboarded) | `/signup` | `POST /onboarding-requests` |
| Forgot / reset password | `/forgot-password`, `/reset-password?token=` | `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Dashboard | `/app` | `GET /dashboard`, `GET /training/events` |
| Health Activity Tracker | `/app/activities` | `GET /activities/overview`, `GET/POST/PUT/DELETE /activities`, `GET /school/users` |
| Incident report (form) | `/app/incidents` | `GET /students`, `GET /students/:id`, `POST /incidents`, `POST /incidents/:id/attachments` |
| Incident log | `/app/incidents/log` | `GET /incidents`, `GET /incidents/:id`, `PUT /incidents/:id` |
| Reports & Insights | `/app/reports` | `GET /reports/insights`, `GET/POST /reports/generated`, `GET /reports/generated/:id/download` |
| Training & Resources Library | `/app/training` | `GET /training/overview`, `GET /training/courses`, `POST /training/courses/:id/start`, `POST /training/courses/:id/complete` |
| School Profile (4 tabs) | `/app/profile` | `GET/PUT /school`, `POST/DELETE /school/logo`, `GET /school/users` |
| SereneAI chatbot | `/app/ai` | `GET /ai/conversations`, `GET /ai/conversations/:id`, `POST /ai/chat`, `DELETE /ai/conversations/:id` |
| Top bar: search | every app page | `GET /students?search=` |
| Top bar: notification bell | every app page | `GET /notifications` (polled every 60 s), `POST /notifications/read-all` |

---

## 2. Conventions (please follow exactly)

**Base URL.** All paths are relative to the API base (default `/api`, set with `VITE_API_BASE_URL`). Serve frontend and API on one domain (reverse-proxy `/api` and `/uploads`), or enable CORS (section 9).

**Format.** JSON in and out, `camelCase` keys. File uploads are `multipart/form-data`.

**Auth.** `Authorization: Bearer <jwt>` on every request except the "public" endpoints marked below. Suggested lifetime 24 h.
- Return **401 only** for a missing, invalid or expired token. The frontend signs the user out on any 401.
- Return **403** when the user is signed in but not allowed. Never 401 for that.
- A wrong email/password on login is a 401 and is handled on the login screen.

**Dates and times.** Timestamps are ISO 8601 UTC (`2026-11-02T09:15:00.000Z`). Calendar dates are `yyyy-mm-dd`. Date *filters* (`from`, `to`) are inclusive and interpreted in the **school's timezone (Africa/Lagos, UTC+1)**. "Today" and "this month" use the same timezone.

**IDs.** Use one type consistently (integers recommended). The frontend compares IDs with `===`.

**Pagination.** Query `page` (from 1) and `limit`. List responses:
```json
{ "data": [ ... ], "pagination": { "page": 1, "limit": 20, "total": 134, "totalPages": 7 } }
```
Default `limit` 20, maximum **500**. Lists marked "no pagination" return just `{ "data": [ ... ] }`.

**Empty responses.** `204 No Content` with no body.

**Errors.** Any status of 400 or above:
```json
{ "message": "Human-readable text shown to the user", "code": "OPTIONAL_MACHINE_CODE", "errors": { "fieldName": "message" } }
```
`message` is shown directly in toasts: keep it short and friendly. `errors` keys must equal the **request body field names** (for nested fields use dots, e.g. `contact.emergencyEmail`); forms show each message under the matching input. Use **422** for validation, **409** for duplicates, **404** for not found.

---

## 3. Business rules the backend must implement

### 3.1 Incidents
- An incident belongs to a student and a school. Types: `injury`, `illness`, `safety`, and `medication` (medication entries are created by other flows, for example the nurse's daily medication round; the report form only creates the first three).
- **Reference number:** unique, human-friendly, e.g. `INC-000123`.
- **Drafts.** `POST /incidents` with `isDraft: true` only needs `studentId` and `type`. A draft is **excluded from every count and trend** (dashboard, reports, open cases). A non-draft submit requires `location`, `occurredAt` and a `description` of at least 10 characters (422 with `errors` otherwise).
- **Status** (outcome / follow-up): `open` (default on creation), `treated`, `sent_home`, `administered`, `referred`, `closed`. Staff change it from the Incident Log via `PUT /incidents/:id`.
- **`summary`**: a short label shown on the dashboard (for example "Scraped Knee", "Fever (101°F)"). Generate it from the first ~40 characters of the description, or let nurses set it later.
- **`firstAid`**: array of keys from: `ice_pack`, `bandage_dressing`, `cleaned_wound`, `observation_rest`, `parent_contacted`, `emergency_called`.
- **`location`** is one of: `Classroom`, `Playground`, `Sports Field`, `Cafeteria`, `Hallway`, `Laboratory`, `School Bus`, `Toilets`, `Other` (the nurse may also record `Sick Bay` for medication entries). Accept these as free text and group by exact string in reports.
- **`notifyParent`**: when true on a **submitted** (non-draft) report, email the student's registered guardian a copy of the report. (The frontend does not collect guardian details; they live on the student record.)
- **Attachments**: the frontend creates the incident first, then uploads each file with `POST /incidents/:id/attachments`. PNG or JPG only, max 10 MB each, max 5 per report.

### 3.2 Dashboard and report definitions
All figures count **non-draft** incidents only.

| Term | Definition |
|---|---|
| `clinicVisitsToday` | incidents with `occurredAt` today (school timezone) |
| `openCases` | incidents with `status = open` (any date) |
| `medicationDispensed` | today's incidents with `status = administered` |
| `changePercent` | `round((today - yesterday) / yesterday * 100)`, or `0` if yesterday was 0 |
| `totalIncidents` (reports) | incidents in the selected period; `changePercent` compares with the previous period of the same length |
| `firstAidCases` | incidents in the period whose `firstAid` array is not empty |
| `sickLeaveDays` | total student-days of illness sick leave in the period (your own definition, for example illness cases sent home times expected days off) |
| `hygieneScore` | compliance rate from hygiene audits, 0 to 100 |
| `hygieneCompliance` | `pass + warning + fail = 100` (percentages of hygiene checks in the period) |
| `incidentsByLocation` | the top 3 locations in the period; `percent` = share of all incidents in the period, rounded |

### 3.3 Activities
- Categories: `hygiene`, `nutrition`, `safety`, `event`. Status: `pending` or `completed`. An activity has a `date` (`yyyy-mm-dd`), optional assignee (a school user) and optional notes.
- `GET /activities/overview` stats: `totalActivities` (all activities, with `changePercent` vs the previous month), `pendingAudits` (pending `safety` activities), `upcomingEvents` (pending `event` activities in the next 7 days), `nutritionSessions` (nutrition activities, with `changePercent`).
- Overview `categories` always returns exactly four cards in this order: `hygiene`, `nutrition`, `safety`, `event`, each with a human `subtitle`, for example `"Latest check: 2 days ago"`, `"Next session: Tomorrow"`, `"Audit Overdue: Gym"` (set `alert: true` when overdue), `"Upcoming: Dental Camp"`.

### 3.4 Training
- A course has a `type` (`video`, `module`, `presentation`, `guide`, `document`), `durationMinutes`, a `mandatory` flag and per-user progress: `status` (`not_started`, `in_progress`, `completed`) and `progressPercent`. Progress is **per user**.
- Filter `documents` means type `guide` or `document`.
- Overview: `mandatory.completed / total` (this user), `learningHours` (sum of time spent, with `thisWeek` hours), `certificates` (count of completed courses that issue one, plus the title of the latest).
- `start` sets `in_progress` if it was `not_started`. `complete` sets `completed` and `progressPercent: 100`.

### 3.5 School profile and notification preferences
- `PUT /school` is a **partial update** (send any subset of fields; nested `contact` and `notifications` objects replace their own keys).
- The `notifications` object is **stored preferences only**. The backend is responsible for acting on them: send the **daily health report** email at `dailyReport.time` (school timezone) when enabled, **emergency alerts** (SMS and email) for serious incidents when `emergencySms.enabled`, and the **weekly analytics digest** when enabled.
- The User Roles tab is **read-only** in the frontend (`View Only`). `status` is `active` or `offline` (your definition, e.g. activity within the last 15 minutes); `lastActiveAt` is shown as "2 hours ago".

### 3.6 Reports
- `POST /reports/generated` generates a file on the server and stores a record. The frontend then immediately calls the download endpoint and saves the file. Supported `type` values: `incident_summary`, `student_allergies`, `activity_log`, `hygiene_compliance`. `format`: `pdf` or `csv`. `name` is the display name, for example `Monthly Incident Summary`.
- "Recent Generated Reports" shows the 20 most recent for the school.

### 3.7 AI chatbot (SereneAI)
- `POST /ai/chat` receives the user's message and returns the assistant's reply. Answers should be grounded in the school's own records and protocols (retrieval over the school's policy documents and student health records, **respecting tenancy and student privacy**).
- A reply may include `attachments` (for example a policy PDF the answer is based on).
- The conversation is created on the first message (no `conversationId` sent) and its `id` is returned; the frontend sends it with later messages. `DELETE` removes the conversation (the "Clear Chat" button). The greeting message is created by the frontend and is not stored.
- Never let the chatbot give medical diagnosis; the screen carries the disclaimer "For medical emergencies, please call 911 immediately." (change the number in the UI if needed).

### 3.8 Notifications (bell)
Generate from live data (overdue audits, open cases needing follow-up, new training), or store them. Return the latest ~20 for the user, newest first. `read` is per user.

---

## 4. Data shapes

### User (from `/auth/login` and `/auth/me`)
```json
{ "id": 1, "name": "Busola Alao", "email": "admin1@nectarschools.com", "role": "school_admin",
  "title": "School Health Manager", "avatarUrl": null,
  "school": { "id": 1, "name": "Nectar Schools", "logoUrl": "/uploads/logos/1.png" } }
```
`title` is shown under the school name in the sidebar (default "School Health Manager" when null). `logoUrl` may be `null`, a path (`/uploads/...`, which the frontend prefixes with `VITE_ASSET_BASE_URL`) or an absolute URL.

### Student
```json
{ "id": 1, "admissionNo": "41325", "name": "Femi Sanusi", "className": "JSS 1" }
```
Shown as `#41325`. (Guardian contact details exist on the backend record but are not sent to the frontend.)

### Incident
```json
{
  "id": 12, "reference": "INC-000012",
  "student": { "id": 1, "admissionNo": "41325", "name": "Femi Sanusi", "className": "JSS 1" },
  "type": "injury", "summary": "Scraped Knee", "location": "Playground",
  "occurredAt": "2026-11-02T09:30:00.000Z",
  "description": "Fell off the swing and scraped the left knee.",
  "firstAid": ["ice_pack", "bandage_dressing"], "notifyParent": true,
  "status": "open", "isDraft": false,
  "reportedBy": { "id": 1, "name": "Busola Alao" },
  "attachments": [ { "id": 3, "name": "knee.jpg", "url": "/uploads/incidents/3.jpg", "sizeBytes": 183204 } ],
  "createdAt": "2026-11-02T09:41:00.000Z"
}
```
**List rows** (`GET /incidents`) are the same object **without** `description` and `attachments`. `GET /incidents/:id` returns the full object.

### Activity
```json
{ "id": 4, "title": "Monthly Water Tank Cleaning", "category": "hygiene", "date": "2026-10-30",
  "status": "completed", "assignee": { "id": 5, "name": "David Akanfe" }, "notes": null }
```
`assignee` is `null` when unassigned.

### Course
```json
{ "id": 1, "title": "First Aid Basics", "description": "Essential life-saving techniques...", "type": "video",
  "durationMinutes": 45, "mandatory": true, "status": "in_progress", "progressPercent": 60,
  "contentUrl": "https://example.com/first-aid" }
```
`contentUrl` may be `null`. The frontend opens it in a new tab from the course dialog.

### School
```json
{ "id": 1, "name": "Nectar Schools", "schoolCode": "DST-8842", "logoUrl": null,
  "physicalAddress": "Block 2-3, Anthony Street, Lagos Island, Lagos",
  "mailingAddress": "", "mailingSameAsPhysical": false,
  "contact": { "name": "Busola Alao", "jobTitle": "School Health Manager", "healthOfficePhone": "+234 803 555 0100", "emergencyEmail": "health@nectarschools.com.ng" },
  "notifications": { "dailyReport": { "enabled": true, "time": "08:00" }, "emergencySms": { "enabled": true }, "weeklyDigest": { "enabled": false } } }
```
`schoolCode` is the "School ID" field on screen.

### School user (roles table)
```json
{ "id": 2, "name": "Sarah Adebayo", "email": "adebayo.s@nectarschools.com.ng", "role": "principal", "status": "active", "lastActiveAt": "2026-11-02T08:10:00.000Z" }
```

### Generated report
```json
{ "id": 2, "name": "Monthly Incident Summary", "format": "pdf", "sizeBytes": 2516582, "createdAt": "2026-10-01T08:00:00.000Z" }
```

### Chat message
```json
{ "id": "m5", "role": "assistant", "content": "According to district policy #402...", "createdAt": "2026-11-02T09:05:00.000Z",
  "attachments": [ { "name": "Fever_Protocol_2024.pdf", "mimeType": "application/pdf", "sizeBytes": 126976, "url": "/uploads/policies/fever.pdf" } ] }
```
`role` is `user` or `assistant`.

---

## 5. Endpoints

All require authentication unless marked **public**.

### 5.1 Authentication

| Method and path | Request | Response |
|---|---|---|
| `POST /auth/login` **public** | `{ email, password }` | `200 { token, user }`. `401` wrong credentials (message "Invalid email or password."). `403` deactivated account. Emails are case-insensitive. |
| `POST /auth/logout` | none | `204` |
| `GET /auth/me` | none | `200 User`. Called on every page refresh to restore the session. |
| `POST /auth/forgot-password` **public** | `{ email }` | `204` **always** (do not reveal whether the email exists). Email a link to `https://<frontend>/reset-password?token=<token>`. |
| `POST /auth/reset-password` **public** | `{ token, newPassword }` | `204`. `400` invalid or expired token. `422` with `errors.newPassword` if under 8 characters. |
| `POST /onboarding-requests` **public** | `{ schoolName, contactName, email, phone, studentCount, plan, message }` | `201 { id }`. `plan` is `basic`, `standard`, `premium` or `null`; `message` may be `null`. Notify the Serene sales team (email or internal inbox). Validation errors use field names above. |

Hash passwords with bcrypt. Rate-limit login and forgot-password.

### 5.2 Dashboard

`GET /dashboard`:
```json
{
  "stats": {
    "clinicVisitsToday":   { "value": 42, "changePercent": 12 },
    "openCases":           { "value": 15 },
    "medicationDispensed": { "value": 18, "changePercent": 5 }
  },
  "recentIncidents": [ { "id": 12, "studentName": "Mariam Balogun", "summary": "Scraped Knee", "className": "Basic 5", "type": "injury", "status": "treated", "occurredAt": "..." } ],
  "weeklyActivity": [ { "date": "2026-10-27", "count": 14 } ],
  "upcomingTrainings": [ { "id": 1, "title": "CPR Refresher", "startsAt": "2026-11-04T10:00:00.000Z", "location": "Staff Room A" } ]
}
```
- `recentIncidents`: the 3 most recent non-draft incidents. `weeklyActivity`: exactly the **last 7 days ending today**, oldest first, including zero days; `count` = non-draft incidents that day.
- `upcomingTrainings`: the next 3 upcoming training events.
- `changePercent` may be `null` to hide the chip.

### 5.3 Students

| Method and path | Response |
|---|---|
| `GET /students?search=&page=&limit=` | `{ data: [Student], pagination }`. `search` matches name or admission number (ignore a leading `#`). The top-bar search and the incident form call this with `limit=6`. |
| `GET /students/:id` | `200 Student` or `404` |

### 5.4 Health activities

| Method and path | Notes |
|---|---|
| `GET /activities/overview` | `{ stats: { totalActivities: { value, changePercent }, pendingAudits: { value }, upcomingEvents: { value }, nutritionSessions: { value, changePercent } }, categories: [{ category, title, subtitle, alert }] }` (rules in 3.3) |
| `GET /activities` | Query: `category`, `status`, `search` (title contains), `page`, `limit`. Newest `date` first. `{ data: [Activity], pagination }` |
| `POST /activities` | Body `{ title, category, date, assigneeId, status, notes }` (`assigneeId` and `notes` may be `null`). `201 Activity`. `422` with `errors.title` / `errors.date`. |
| `PUT /activities/:id` | Partial update (for example just `{ "status": "completed" }`). `200 Activity` |
| `DELETE /activities/:id` | `204` |

### 5.5 Incidents

| Method and path | Notes |
|---|---|
| `POST /incidents` | Body below. `201 Incident` (full). |
| `GET /incidents` | Query: `search` (student name or reference), `type`, `status`, `page`, `limit`. Newest `occurredAt` first. **Includes drafts** (flagged `isDraft`). Returns list rows. |
| `GET /incidents/:id` | Full Incident |
| `PUT /incidents/:id` | Partial update of `status`, `description`, `location`, `occurredAt`, `firstAid`, `notifyParent`, `type`, `isDraft`. `200` full Incident. (The Incident Log only sends `{ status }`.) |
| `POST /incidents/:id/attachments` | multipart field `file`. `201 { id, name, url, sizeBytes }` |

`POST /incidents` body:
```json
{ "studentId": 1, "type": "injury", "location": "Playground", "occurredAt": "2026-11-02T09:30:00.000Z",
  "description": "Fell off the swing...", "firstAid": ["ice_pack"], "notifyParent": true, "isDraft": false }
```
For drafts, `location`, `occurredAt` and `description` may be `null`.

### 5.6 Reports & insights

`GET /reports/insights?from=yyyy-mm-dd&to=yyyy-mm-dd`:
```json
{
  "period": { "from": "...", "to": "..." },
  "stats": {
    "totalIncidents": { "value": 8, "changePercent": -12 },
    "hygieneScore":   { "value": 94, "label": "Compliance rate" },
    "firstAidCases":  { "value": 6, "changePercent": 0 },
    "sickLeaveDays":  { "value": 12, "changePercent": -5 }
  },
  "incidentsTrend": {
    "daily":  [ { "date": "2026-10-04", "value": 3 } ],
    "weekly": [ { "label": "Wk 1", "value": 12 } ]
  },
  "hygieneCompliance": { "score": 94, "pass": 70, "warning": 15, "fail": 15 },
  "incidentsByLocation": [ { "location": "Playground", "percent": 45 } ],
  "programImpact": { "labels": ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"], "values": [14, 46, 12, 78, 36, 100] }
}
```
- `daily` has one entry per day in the period (the frontend shows at most the last 31 days), oldest first; `weekly` groups the same days in weeks.
- `programImpact.values` are percentages (0 to 100) of the wellness and attendance improvement index over the last 6 months.
- A negative `changePercent` is an improvement for incidents and sick leave and is shown with a down arrow.

| Method and path | Notes |
|---|---|
| `GET /reports/generated` | `{ data: [GeneratedReport] }` (no pagination, newest first, max 20) |
| `POST /reports/generated` | Body `{ type, format, from, to }`. `201 GeneratedReport`. `422` with `errors.type` / `errors.format`. |
| `GET /reports/generated/:id/download` | The file itself (`Content-Type` `application/pdf` or `text/csv`). The frontend saves it as `<name>.<format>`. |

### 5.7 Training

| Method and path | Response |
|---|---|
| `GET /training/overview` | `{ stats: { mandatory: { completed, total }, learningHours: { value, thisWeek }, certificates: { count, latest } } }` (`latest` is a title or `null`) |
| `GET /training/courses?filter=all\|mandatory\|optional\|documents&search=` | `{ data: [Course] }` (no pagination) |
| `POST /training/courses/:id/start` | `200 Course` |
| `POST /training/courses/:id/complete` | `200 Course` |
| `GET /training/events` | `{ data: [{ id, title, startsAt, location }] }` upcoming events only, soonest first |

### 5.8 School profile

| Method and path | Notes |
|---|---|
| `GET /school` | `200 School` |
| `PUT /school` | Partial update. `200 School` (the full updated object). `422` with `errors.name` etc. When `mailingSameAsPhysical` is true the frontend already sends `mailingAddress` equal to `physicalAddress`. Ignore `logoUrl` in this body. |
| `POST /school/logo` | multipart field `logo` (PNG, JPG or SVG, max 2 MB). `200 { logoUrl }` |
| `DELETE /school/logo` | `204` |
| `GET /school/users?page=&limit=` | `{ data: [SchoolUser], pagination }`. The frontend shows 6 per page ("Showing 6 of 24 users") and the activity form loads `limit=100` for its assignee list. |

### 5.9 AI chatbot

| Method and path | Request and response |
|---|---|
| `POST /ai/chat` | `{ message, conversationId }` (`conversationId` is `null` for the first message). `200 { conversationId, message: ChatMessage }` (the assistant reply). Replies may take a few seconds; the UI shows a typing indicator. `422` with `errors.message` if empty. |
| `GET /ai/conversations` | `{ data: [{ id, title, updatedAt }] }` newest first (the "History" dialog). `title` = first message, truncated. |
| `GET /ai/conversations/:id` | `{ id, messages: [ChatMessage] }` oldest first |
| `DELETE /ai/conversations/:id` | `204` |

### 5.10 Notifications

| Method and path | Response |
|---|---|
| `GET /notifications` | `{ data: [{ id, title, message, read, createdAt }] }` |
| `POST /notifications/read-all` | `204` |

---

## 6. Suggested tables

| Table | Key columns |
|---|---|
| `schools` | id, name, school_code, logo_url, physical_address, mailing_address, mailing_same_as_physical, contact (JSON), notifications (JSON), timezone |
| `users` | id, school_id, name, email (unique), password_hash, role, title, status/last_active_at, active |
| `students` | id, school_id, admission_no, name, class_name, guardian_name, guardian_email, guardian_phone, allergies |
| `incidents` | id, school_id, reference, student_id, type, summary, location, occurred_at, description, first_aid (JSON), notify_parent, status, is_draft, reported_by, created_at |
| `incident_attachments` | id, incident_id, name, url, size_bytes |
| `activities` | id, school_id, title, category, date, assignee_id, status, notes |
| `courses` | id, title, description, type, duration_minutes, mandatory, content_url |
| `course_progress` | user_id, course_id, status, progress_percent, minutes_spent, completed_at |
| `training_events` | id, school_id, title, starts_at, location |
| `generated_reports` | id, school_id, type, name, format, size_bytes, file_path, period_from, period_to, created_at |
| `ai_conversations`, `ai_messages` | conversation (id, user_id, title, updated_at); message (id, conversation_id, role, content, attachments JSON, created_at) |
| `notifications` (optional) | id, user_id, title, message, created_at, read_at |
| `onboarding_requests` | id, school_name, contact_name, email, phone, student_count, plan, message, created_at |

Index ideas: `incidents(school_id, occurred_at)`, `incidents(school_id, status)`, `activities(school_id, category, date)`, `students(school_id, admission_no)`.

---

## 7. Seed data for development

Please seed at least: one school ("Nectar Schools"); `admin1@nectarschools.com` / `password123` (role `school_admin`); five more users covering every role; about 15 students; 40 or more incidents over the last 45 days in a mix of types, locations and statuses; 10 activities across all four categories (some pending, one overdue safety audit); 8 courses (4 mandatory) with progress; and 3 upcoming training events. `src/mocks/mockAdapter.js` (function `seed()`) is a ready template.

---

## 8. Connecting the frontend to your API

1. `cp .env.example .env.local` and set:
   ```
   VITE_USE_MOCK=false
   VITE_PROXY_TARGET=http://localhost:5000
   VITE_API_BASE_URL=/api
   ```
2. `npm install && npm run dev`. The dev server proxies `/api` and `/uploads` to your API, so no CORS setup is needed in development.
3. Suggested order: login and `/auth/me`, school profile, students, incidents (form, log), dashboard, activities, reports, training, notifications, AI chat.
4. To compare behaviour, run with `VITE_USE_MOCK=true` (default for `npm run dev`; demo login `admin1@nectarschools.com` / `password123`).

`npm test` runs a smoke test of the main user journeys against the mock API. It is a good model of the flows your API must support.

---

## 9. Production notes

- **Same origin (recommended).** Serve `dist/` and proxy `/api` and `/uploads` to the API. A sample nginx block is in the README.
- **Different origins.** Build with `VITE_API_BASE_URL=https://api.example.com/api` and `VITE_ASSET_BASE_URL=https://api.example.com`. The API must allow the frontend origin, methods `GET, POST, PUT, DELETE, OPTIONS`, and headers `Authorization, Content-Type`.
- **Security.** Enforce tenancy and permissions on the server for every endpoint; validate uploads (type and size); never trust client-side checks. Student health data is sensitive: encrypt in transit, restrict access, and log access.
- **Reset-password link.** It must point to the frontend route `/reset-password?token=...`.

---

## 10. Decisions to confirm with the client

1. **Role permissions.** The design has one app for all roles and a view-only roles table. Suggested defaults: `school_admin` and `principal` can edit the school profile; `school_nurse` and `school_admin` can change incident status; `teacher` can report incidents but not edit the profile. Tell the frontend developer if you return 403 for any action so buttons can be hidden.
2. **Onboarding.** "Get on board" and "Sign up" send an onboarding request to the Serene team; schools do not self-register. Confirm this is the intended flow.
3. **Parent notification.** Confirm the channel (email only, as designed) and where guardian contacts come from.
4. **Hygiene and sick-leave data.** The Reports screen shows a hygiene score and sick-leave days, but no screen collects them. Confirm where this data comes from (hygiene audits recorded as activities, an attendance integration, or manual entry).
5. **Emergency number.** The chatbot and incident form say "911" (from the design). Nigeria uses 112 or 199; confirm.
6. **Incident status workflow.** Statuses and the Incident Log dropdown are an addition (the design does not show how a case is closed).
7. **Extra screens not in Figma.** Incident Log, Get on board form, forgot/reset password, training calendar and course dialog, and the export dialog were built in the same style. Review them with the designer.
