# Student Management System

A system built for managing students, class streams, subjects, scores, and generating PDF report cards.

**Author:** Arnold Amani
**GitHub:** https://github.com/amanidy/ikonex-school-management-application-.git


---

## Live URLs

| Layer | URL |
|---|---|
| Frontend | https://elimu-bora.netlify.app/ |
| Backend API | https://ikonex-school-management-application-production.up.railway.app/api |

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [System Architecture](#system-architecture)
3. [Functional Requirements Covered](#functional-requirements-covered)
4. [Database Design](#database-design)
5. [Prerequisites](#prerequisites)
6. [Local Setup](#local-setup)
7. [Environment Variables](#environment-variables)
8. [Running the Application](#running-the-application)
9. [API Reference](#api-reference)
10. [Deployment Guide](#deployment-guide)
11. [Git Workflow](#git-workflow)
12. [Assumptions Made](#assumptions-made)
13. [Known Limitations](#known-limitations)

---

## Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript | Solid foundation, no build step needed |
| Backend | Node.js + Express.js | JavaScript full-stack, fast to develop |
| Database | MySQL | Relational data, strong constraint support |
| PDF Generation | jsPDF + AutoTable | Client-side, no extra server dependency |
| Version Control | Git + GitHub | Industry standard |
| Deployment | Railway (backend + DB) + Netlify (frontend) | Free tier, GitHub integration |

---

## System Architecture

```
┌─────────────────────────────────────┐
│         FRONTEND (Netlify)           │
│   HTML + CSS + Vanilla JS            │
│   ES Modules via Live Server/Netlify │
│   All API calls in js/api.js         │
└──────────────┬──────────────────────┘
               │ HTTP/JSON (REST API)
               │ fetch() calls
┌──────────────▼──────────────────────┐
│         BACKEND (Railway)            │
│   Node.js + Express.js               │
│   Pattern: Route → Controller → DB   │
│   cors() for cross-origin requests   │
└──────────────┬──────────────────────┘
               │ mysql2/promise
               │ connection pool
┌──────────────▼──────────────────────┐
│         DATABASE (Railway MySQL)     │
│   6 tables, FK constraints           │
│   UNIQUE KEY prevents duplicate scores│
│   Grading scale in grade_config table│
└─────────────────────────────────────┘
```

### Key Design Decisions

- **Connection pool** — reuses DB connections instead of opening a new one per request
- **UNIQUE KEY on scores(student_id, subject_id)** — duplicate score submissions blocked at DB level
- **total_score calculated by API** — avoids MySQL GENERATED column compatibility issues
- **grade_config table** — grading scale is data, not hardcoded logic; editable without code changes
- **ON DELETE CASCADE on scores** — deleting a student removes their scores automatically
- **ON DELETE RESTRICT on students FK** — cannot delete a stream that still has students
- **One shared modal** — all forms share a single modal; content injected dynamically

---

## Functional Requirements Covered

### Class Stream Management
- Create class streams (e.g. Form 1A, Form 1B)
- View all class streams
- View details of a single stream including student count
- Edit stream name
- Delete stream (blocked if students are enrolled)

### Student Management
- Register students and assign to a class stream
- Edit student information
- Delete student (scores deleted automatically via CASCADE)
- View a single student's details and scores
- View all students
- View students belonging to a specific class stream
- Search students by name or admission number

### Subject Management
- Create and manage subjects with unique codes
- Assign subjects to class streams
- View all subjects
- Edit and delete subject information
- Prevent duplicate subject-stream assignments

### Student Assessment and Scoring
- Record CAT (0–50) and Exam (0–50) scores per student per subject
- Edit and update student scores
- View individual student performance by subject
- View class performance for a selected subject
- Validate score entries (range 0–50)
- Prevent duplicate score submissions (UNIQUE KEY + 409 response)

### Results Processing
- Calculate total marks per student (CAT + Exam)
- Calculate average scores per student
- Determine grades based on configurable grading scale
- Calculate overall class positions
- Rank students within a class stream based on performance

### Reporting
- Generate individual PDF report cards showing:
  - Student details (name, admission number, stream)
  - Scores per subject (CAT, Exam, Total, Grade)
  - Overall total, average, grade, and class position
- Generate PDF class performance reports showing:
  - All students ranked by position
  - Total marks, average, and grade per student

---

## Database Design

### Entity Relationship Summary

```
streams (1) ──────── (many) students
students (1) ──────── (many) scores
subjects (many) ────── (many) streams  [via stream_subjects]
subjects (1) ──────── (many) scores
scores ──── grade_config [BETWEEN lookup, not FK]
```

### Tables

| Table | Purpose |
|---|---|
| `streams` | Class groups e.g. Form 1A |
| `students` | Student records, linked to one stream |
| `subjects` | School subjects with unique codes |
| `stream_subjects` | Junction table — which subjects belong to which stream |
| `scores` | CAT + Exam marks per student per subject |
| `grade_config` | Configurable grading scale |

### Default Grading Scale

| Grade | Range | Remarks |
|---|---|---|
| A | 80 – 100 | Excellent |
| B | 65 – 79 | Good |
| C | 50 – 64 | Average |
| D | 40 – 49 | Below Average |
| E | 0 – 39 | Fail |

---

## Prerequisites

Install these before starting:

| Tool | Download | Purpose |
|---|---|---|
| Node.js LTS | https://nodejs.org | Runs the backend |
| Git | https://git-scm.com | Version control |
| VS Code | https://code.visualstudio.com | Code editor |
| Live Server (VS Code extension) | Search in VS Code extensions | Serves the frontend |

Verify installation in terminal:
```bash
node -v       # v18 or higher
npm -v        # 9 or higher
git --version
```

---

## Local Setup

### Step 1 — Clone the repository
```bash
git clone https://github.com/amanidy/ikonex-school-management-application-.git
cd ikonex-school-management-application-
```

### Step 2 — Install backend dependencies
```bash
cd backend
npm install
```

This installs:
- `express` — web framework
- `mysql2` — MySQL database driver with promise support
- `cors` — allows frontend to call backend across different origins
- `dotenv` — loads environment variables from .env file
- `nodemon` — auto-restarts server on file changes (dev only)

### Step 3 — Create environment file
```bash
cp .env.example .env
```
Then open `.env` and fill in your values. See [Environment Variables](#environment-variables) below.

### Step 4 — Set up the database
Two options:

**Option A — Railway (recommended):**
Go to your Railway project → MySQL plugin → Query tab → paste and run `backend/db/schema.sql`

**Option B — Local MySQL:**
```bash
mysql -u root -p
```
Then paste the contents of `backend/db/schema.sql`

### Step 5 — Start the backend
```bash
cd backend
node server.js
```

You should see:
```
Server running on port 3000
```

Test it: open `http://localhost:3000` in your browser. You should see:
```json
{ "message": "School Management API  running" }
```

### Step 6 — Open the frontend

**IMPORTANT:** Do NOT open `index.html` by double-clicking it. ES Modules
are blocked by browsers when loaded from `file://`. You must use a web server.

**Recommended — VS Code Live Server:**
1. Install the **Live Server** extension by Ritwick Dey
2. Right-click `frontend/index.html`
3. Click **Open with Live Server**
4. Browser opens at `http://127.0.0.1:5500`

**Alternative — Terminal:**
```bash
cd frontend
npx serve . -p 8080
```
Then open `http://localhost:8080`

---

## Environment Variables

Create `backend/.env` with these values:

```env
# Database connection
MYSQLHOST=your-railway-host
MYSQLPORT=your-railway-port
MYSQLUSER=root
MYSQLPASSWORD=your-railway-password
MYSQL_DATABASE=railway

# Server
PORT=3000
```

For Railway deployment, these are set in the Railway dashboard under
your service's Variables tab.

**Never commit `.env` to GitHub.** It is listed in `.gitignore`.

---

## Running the Application

### Development
```bash
# Terminal 1 — keep this running
cd backend
node server.js

# Terminal 2 — for git commands and other work
# Open frontend/index.html with Live Server in VS Code
```

### With auto-restart on file changes
```bash
cd backend
npm run dev
```

---

## API Reference

### Base URL
- Local: `http://localhost:3000/api`
- Production: `https://ikonex-school-management-application-production.up.railway.app/api`

### Streams

| Method | Endpoint | Description |
|---|---|---|
| GET | `/streams` | Get all streams |
| GET | `/streams/:id` | Get one stream with student count |
| POST | `/streams` | Create a stream |
| PUT | `/streams/:id` | Update stream name |
| DELETE | `/streams/:id` | Delete stream (blocked if has students) |

**POST /streams body:**
```json
{ "name": "Form 1A" }
```

### Students

| Method | Endpoint | Description |
|---|---|---|
| GET | `/students` | Get all students |
| GET | `/students?stream=ID` | Filter students by stream |
| GET | `/students/:id` | Get one student |
| POST | `/students` | Register a student |
| PUT | `/students/:id` | Update student |
| DELETE | `/students/:id` | Delete student |

**POST /students body:**
```json
{
  "first_name": "Alice",
  "last_name": "Wanjiru",
  "admission_number": "IKX/2026/001",
  "stream_id": 1,
  "date_of_birth": "2010-03-15",
  "gender": "Female"
}
```

### Subjects

| Method | Endpoint | Description |
|---|---|---|
| GET | `/subjects` | Get all subjects |
| GET | `/subjects/stream/:streamId` | Get subjects assigned to a stream |
| POST | `/subjects` | Create a subject |
| PUT | `/subjects/:id` | Update subject |
| DELETE | `/subjects/:id` | Delete subject |
| POST | `/subjects/assign` | Assign subject to stream |

**POST /subjects body:**
```json
{ "name": "Mathematics", "code": "MAT101" }
```

**POST /subjects/assign body:**
```json
{ "stream_id": 1, "subject_id": 2 }
```

### Scores & Results

| Method | Endpoint | Description |
|---|---|---|
| GET | `/scores` | Health check |
| POST | `/scores` | Record a score |
| PUT | `/scores/:id` | Update a score |
| GET | `/scores/student/:studentId` | Get all scores for a student |
| GET | `/scores/results/:streamId` | Get class rankings |
| GET | `/scores/class/:streamId/subject/:subjectId` | Class scores for one subject |

**POST /scores body:**
```json
{
  "student_id": 1,
  "subject_id": 2,
  "cat_score": 42,
  "exam_score": 38
}
```

### HTTP Status Codes Used

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request — missing or invalid input |
| 404 | Not found |
| 409 | Conflict — duplicate entry |
| 500 | Server error |
| 502 | Bad Gateway - check on your ports or cors

---

## Deployment Guide

### Backend → Railway

1. Push code to GitHub
2. Go to **railway.app** → sign in with GitHub
3. **New Project** → **Deploy from GitHub repo** → select `ikonex-school-management-application-`
4. Set **Root Directory** to: `backend`
5. Click **+ Add Plugin** → **MySQL**
6. Go to MySQL plugin → **Variables** tab → copy all credentials
7. Go to your Node.js service → **Variables** tab → add all DB credentials
8. Go to MySQL plugin → **Query** tab → paste and run `backend/db/schema.sql`
9. Your backend URL will be something like:
   `https://ikonex-school-management-application-production.up.railway.app/`

### Frontend → Netlify

1. Open `frontend/js/api.js`
2. Change the `BASE` constant to your Railway URL:
```js
export const BASE = 'https://ikonex-school-management-application-production.up.railway.app/api';
```
3. Commit and push:
```bash
git add .
git commit -m "chore: update API base URL to Railway production"
git push
```
4. Go to **netlify.com** → **Add new site** → **Import from Git**
5. Select your `ikonex-sms` repo
6. Set:
   - Base directory: `frontend`
   - Build command: *(leave empty)*
   - Publish directory: `frontend`
7. Click **Deploy**
8. Your frontend URL: `https://ikonex-***.netlify.app`

---

## Git Workflow

### First push to GitHub
```bash
git init
git add .
git commit -m "chore: initialize project"
git branch -M main
git remote add origin https://github.com/amanidy/ikonex-school-management-application-.git
git push -u origin main
```

### Daily workflow
```bash
git status              # see what changed
git add .               # stage all changes
git commit -m "message" # commit
git push                # push to GitHub
```


---

## Project Structure

```
ikonex-sms/
├── backend/
│   ├── controllers/
│   │   ├── streamsController.js    # Stream CRUD logic
│   │   ├── studentsController.js   # Student CRUD logic
│   │   ├── subjectsController.js   # Subject + assignment logic
│   │   └── scoresController.js     # Score recording + results engine
│   ├── db/
│   │   ├── connection.js           # MySQL connection pool
│   │   ├── schema.sql              # All tables + seed data
│   │   └── fix_scores_table.sql    # Run this if upgrading from v1
│   ├── routes/
│   │   ├── streams.js              # Stream URL mappings
│   │   ├── students.js             # Student URL mappings
│   │   ├── subjects.js             # Subject URL mappings
│   │   └── scores.js               # Score URL mappings
│   ├── .env.example                # Template  copy to .env
│   ├── .gitignore                  # node_modules, .env excluded
│   ├── package.json                # Dependencies and scripts
│   └── server.js                   # Express app entry point
├── frontend/
│   ├── css/
│   │   └── style.css               
│   ├── js/
│   │   ├── api.js                  # All fetch() calls + modal + toast
│   │   ├── app.js                  # Navigation + dashboard
│   │   ├── streams.js              # Streams section UI
│   │   ├── students.js             # Students section UI
│   │   ├── subjects.js             # Subjects section UI
│   │   ├── scores.js               # Score entry table UI
│   │   ├── results.js              # Rankings + performance UI
│   │   └── reports.js              # PDF generation
│   └── index.html                  # Single page shell
|
└── README.md
```

---

## Assumptions Made

The following assumptions were made during development:

1. CAT score is out of 50 and Exam score is out of 50, giving a maximum total of 100
2. Each student belongs to exactly one class stream at a time
3. A subject can be assigned to multiple streams
4. A stream can have multiple subjects
5. Grading scale defaults are seeded into the database but can be edited directly
6. Authentication and login are out of scope for this  version(to be improved according to role base)
7. PDF generation is client-side using jsPDF  a production system would use server-side rendering
8. Duplicate score submissions are blocked at the database level via UNIQUE KEY constraint
9. Deleting a stream is blocked if students are still enrolled in it
10. Deleting a student automatically removes all their scores via ON DELETE CASCADE

---

## Known Limitations

- No authentication or role-based access control
- No pagination on large student lists
- PDF layout may vary across browsers due to client-side rendering
- No automated tests (unit or integration)
- Session state is not persisted  refreshing reloads data from the API

---

## Author

**Arnold Amani**
- GitHub: https://github.com/amanidy
