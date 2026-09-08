# Job Application Tracker

A full-stack web application to track job applications, interview stages, company details, and application status in a centralized dashboard. Built with **React + TypeScript** (frontend), **Node.js + Express + TypeScript** (backend), and **MySQL** (database, run via Docker).

## Features

- **Authentication** — JWT-based register/login, passwords hashed with bcrypt
- **Role-based access control** — `user` role manages their own data; `admin` role can view all users' applications
- **Protected API routes** — every data endpoint requires a valid token
- **CRUD for job applications** — company, job title, link, status, applied date, notes
- **Interview round tracking** — add/remove interview rounds per application (date, mode, status, notes)
- **Dashboard** — quick stats on application counts by status
- **Profile management** — update name / password

## Tech Stack

| Layer     | Tech                                              |
|-----------|----------------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, React Router, Axios    |
| Backend   | Node.js, Express, TypeScript, JWT, bcryptjs         |
| Database  | MySQL 8 (via Docker Compose)                        |

## Project Structure

```
job-application-tracker/
├── docker-compose.yml       # MySQL container
├── database/
│   └── schema.sql            # Tables: users, applications, interviews
├── backend/
│   ├── src/
│   │   ├── config/db.ts      # MySQL connection pool
│   │   ├── controllers/      # Route logic
│   │   ├── middleware/       # JWT auth + role guard, error handler
│   │   ├── routes/           # Express routers
│   │   ├── types/            # Shared TS types
│   │   └── index.ts          # App entry point
│   └── .env.example
└── frontend/
    └── src/
        ├── api/axios.ts      # Axios instance with auth interceptor
        ├── context/AuthContext.tsx
        ├── components/       # Navbar, ProtectedRoute
        ├── pages/             # Login, Register, Dashboard, Applications, ApplicationForm, Profile
        └── styles/index.css
```

## Prerequisites

- **Node.js** v18+ and npm
- **Docker Desktop** (for MySQL)
- **Git**

## 1. Start the database (Docker)

From the project root:

```bash
docker compose up -d
```

This starts a MySQL 8 container on `localhost:3306`, creates the `job_tracker` database, and automatically runs `database/schema.sql` to create the tables (`users`, `applications`, `interviews`).

Check it's running:

```bash
docker ps
```

To stop it later: `docker compose down` (add `-v` to also wipe the data volume).

## 2. Run the backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The `.env` defaults already match the Docker Compose credentials, so no changes are needed for local dev. The API runs on **http://localhost:5000**.

Verify it's up: `curl http://localhost:5000/api/health`

## 3. Run the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs on **http://localhost:5173**. Open it in your browser, register a new account, and start adding applications.

> To test role-based access control: register a normal user, then manually update that user's `role` to `admin` in the database (`UPDATE users SET role = 'admin' WHERE email = '...';`) and log back in. Admins get a "Show all users' applications" toggle on the Applications page.

## API Overview

| Method | Endpoint                              | Description                          | Auth |
|--------|-----------------------------------------|---------------------------------------|------|
| POST   | `/api/auth/register`                    | Create account                        | No   |
| POST   | `/api/auth/login`                       | Log in, get JWT                       | No   |
| GET    | `/api/auth/me`                          | Current user info                     | Yes  |
| GET    | `/api/applications`                     | List own applications (`?all=true` for admins) | Yes |
| POST   | `/api/applications`                     | Create application                    | Yes  |
| GET    | `/api/applications/:id`                 | Get one application                   | Yes  |
| PUT    | `/api/applications/:id`                 | Update application                    | Yes  |
| DELETE | `/api/applications/:id`                 | Delete application                    | Yes  |
| GET    | `/api/applications/:appId/interviews`   | List interview rounds                 | Yes  |
| POST   | `/api/applications/:appId/interviews`   | Add interview round                   | Yes  |
| PUT    | `/api/interviews/:id`                   | Update interview round                | Yes  |
| DELETE | `/api/interviews/:id`                   | Delete interview round                | Yes  |
| GET    | `/api/profile`                          | Get profile                           | Yes  |
| PUT    | `/api/profile`                          | Update name/password                  | Yes  |

## Connecting this project to GitHub

Since you don't have a repo yet, here's the full flow from your project folder:

**1. Create the repo on GitHub** — go to github.com → New repository → name it e.g. `job-application-tracker` → **do not** initialize with a README (you already have one) → Create repository.

**2. Initialize git locally and push:**

```bash
cd job-application-tracker
git init
git add .
git commit -m "Initial commit: full-stack job application tracker (React, TS, Node, MySQL)"
git branch -M main
git remote add origin https://github.com/<your-username>/job-application-tracker.git
git push -u origin main
```

**3. Keep a real work history** (important if this needs to show progression, not one giant commit). Suggested commit sequence if you want it to look like organic development:

```bash
git add database/ docker-compose.yml
git commit -m "Add MySQL schema and Docker setup"

git add backend/
git commit -m "Add backend: Express + TypeScript API with JWT auth and RBAC"

git add frontend/
git commit -m "Add frontend: React + TypeScript UI with dashboard and CRUD"

git add README.md .gitignore
git commit -m "Add documentation"

git push
```

**4. Going forward**, as you add features, commit in small logical chunks (`git add <files>` + `git commit -m "..."`) and `git push` regularly — that's what gives you a genuine, checkable work history on GitHub.

## Notes

- `.env` is git-ignored — never commit real secrets. `.env.example` shows the required variables.
- The JWT secret in `.env.example` is a placeholder — replace it with a long random string for anything beyond local dev.
- This is set up for **local development**. For production you'd add HTTPS, stronger secret management, input validation hardening, and rate limiting.
