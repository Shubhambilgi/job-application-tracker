# Job Application Tracker — Backend

> A TypeScript + Express + MySQL REST API for managing job applications, interview rounds, authentication, and user profiles.

This document is designed for **two purposes**:

1. **GitHub documentation** — so another developer can understand and run the backend without guessing.
2. **Personal revision notes** — so I can revisit the project later and quickly remember the important backend concepts, implementation decisions, and interview points.

---

## Table of Contents

- [1. Backend Overview](#1-backend-overview)
- [2. Tech Stack](#2-tech-stack)
- [3. Backend Architecture](#3-backend-architecture)
- [4. Project Structure](#4-project-structure)
- [5. Prerequisites](#5-prerequisites)
- [6. Installation](#6-installation)
- [7. Environment Variables](#7-environment-variables)
- [8. Running the Backend](#8-running-the-backend)
- [9. How the Server Starts](#9-how-the-server-starts)
- [10. Database Connection](#10-database-connection)
- [11. Database Design](#11-database-design)
- [12. Authentication](#12-authentication)
- [13. JWT Implementation](#13-jwt-implementation)
- [14. Authentication Middleware](#14-authentication-middleware)
- [15. Authorization and Data Ownership](#15-authorization-and-data-ownership)
- [16. REST API Routes](#16-rest-api-routes)
- [17. Applications API](#17-applications-api)
- [18. Interviews API](#18-interviews-api)
- [19. Profile API](#19-profile-api)
- [20. Error Handling](#20-error-handling)
- [21. SQL Security](#21-sql-security)
- [22. TypeScript Types](#22-typescript-types)
- [23. Request Flow](#23-request-flow)
- [24. HTTP Status Codes Used](#24-http-status-codes-used)
- [25. Testing Checklist](#25-testing-checklist)
- [26. Common Problems and Fixes](#26-common-problems-and-fixes)
- [27. Backend Concepts to Remember](#27-backend-concepts-to-remember)
- [28. Interview Revision](#28-interview-revision)
- [29. Current Limitations and Future Hardening](#29-current-limitations-and-future-hardening)
- [30. Production Checklist](#30-production-checklist)

---

# 1. Backend Overview

The Job Application Tracker backend provides the API used by the React frontend.

The backend is responsible for:

- User registration
- User login
- JWT authentication
- Password hashing
- Returning the currently authenticated user
- Creating job applications
- Reading applications
- Updating applications
- Deleting applications
- Creating interview rounds
- Reading interview rounds
- Updating interview rounds
- Deleting interview rounds
- Updating user profile information
- Enforcing user ownership
- Supporting admin access to application data
- Connecting to MySQL
- Returning JSON responses
- Handling API errors

### High-level architecture

```text
React Frontend
      |
      | HTTP / REST API
      v
Axios
      |
      v
Express Server
      |
      +---- Authentication Middleware
      |
      +---- Routes
              |
              v
          Controllers
              |
              v
          MySQL Pool
              |
              v
           MySQL 8
```

---

# 2. Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | HTTP server and REST API |
| TypeScript | Static typing |
| MySQL 8 | Relational database |
| mysql2 | MySQL driver and connection pool |
| JWT | Authentication |
| bcryptjs | Password hashing |
| CORS | Cross-origin API access |
| dotenv | Environment variable loading |
| Nodemon | Development auto-restart |
| ts-node | Run TypeScript directly in development |

### Backend package versions

The project currently uses the versions defined in `package.json`.

Main dependencies:

```text
express
mysql2
jsonwebtoken
bcryptjs
cors
dotenv
```

Development dependencies:

```text
typescript
ts-node
nodemon
@types/...
```

---

# 3. Backend Architecture

The backend follows a simple layered structure:

```text
Request
  |
  v
Route
  |
  v
Middleware
  |
  v
Controller
  |
  v
Database
  |
  v
Response
```

### Why separate routes and controllers?

Routes answer:

> "Which function should handle this URL and HTTP method?"

Controllers answer:

> "What should actually happen when this endpoint is called?"

This keeps routing and business logic separate.

Example:

```ts
router.post("/", createApplication);
```

The route only connects the HTTP request to the controller.

The actual application creation happens inside:

```ts
createApplication()
```

---

# 4. Project Structure

```text
backend/
│
├── src/
│   │
│   ├── config/
│   │   └── db.ts
│   │
│   ├── controllers/
│   │   ├── applicationController.ts
│   │   ├── authController.ts
│   │   ├── interviewController.ts
│   │   └── profileController.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   │
│   ├── routes/
│   │   ├── applicationRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── interviewRoutes.ts
│   │   └── profileRoutes.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   ├── utils/
│   │   └── jwt.ts
│   │
│   └── index.ts
│
├── .env.example
├── package.json
├── package-lock.json
└── tsconfig.json
```

### Folder responsibilities

#### `config/`

Database and external configuration.

#### `controllers/`

Application logic for API endpoints.

#### `middleware/`

Reusable request-processing logic such as authentication.

#### `routes/`

Maps URLs and HTTP methods to controllers.

#### `types/`

TypeScript interfaces and union types.

#### `utils/`

Reusable helper functions such as JWT creation and verification.

#### `index.ts`

Application entry point.

---

# 5. Prerequisites

Install:

- Node.js
- npm
- MySQL 8

For the project's Docker-based local database setup, Docker Desktop is also useful.

Verify Node:

```bash
node --version
```

Verify npm:

```bash
npm --version
```

---

# 6. Installation

From the backend directory:

```bash
npm install
```

This installs the dependencies listed in `package.json`.

### Important

Do **not** commit:

```text
.env
node_modules/
dist/
```

These should remain ignored by Git.

---

# 7. Environment Variables

Create the local environment file:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

The example file contains:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=jat_user
DB_PASSWORD=jat_password
DB_NAME=job_tracker

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

### Meaning of each variable

| Variable | Purpose |
|---|---|
| `PORT` | Express server port |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | JWT lifetime |
| `CORS_ORIGIN` | Allowed frontend origin |

### Security rule

Never put the real `.env` file on GitHub.

Use `.env.example` to document required variables without exposing secrets.

---

# 8. Running the Backend

## Development

```bash
npm run dev
```

The development script is:

```json
"dev": "nodemon --watch src --exec ts-node src/index.ts"
```

This means:

```text
Nodemon watches src/
        |
        v
Source changes
        |
        v
Restart server
```

## Build

```bash
npm run build
```

This runs TypeScript compilation:

```text
src/
  |
  v
TypeScript Compiler
  |
  v
dist/
```

## Production-style start

After building:

```bash
npm start
```

This runs:

```text
node dist/index.js
```

---

# 9. How the Server Starts

The entry point is:

```text
src/index.ts
```

The first important line is:

```ts
import "dotenv/config";
```

### What does this do?

It loads variables from `.env` into:

```ts
process.env
```

That is why the application can access:

```ts
process.env.PORT
process.env.DB_HOST
process.env.JWT_SECRET
```

---

## Express application

The application is created with:

```ts
const app = express();
```

### Disable Express technology disclosure

```ts
app.disable("x-powered-by");
```

This prevents Express from automatically exposing its `X-Powered-By` response header.

It is a small security-hardening measure.

---

## CORS

```ts
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
```

### What is CORS?

CORS means:

> Cross-Origin Resource Sharing.

The frontend and backend can run on different origins during development:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

The browser normally applies same-origin restrictions.

CORS tells the browser which frontend origin is allowed to communicate with the API.

---

## JSON body parser

```ts
app.use(express.json({ limit: "1mb" }));
```

This allows Express to parse JSON request bodies.

Example:

```json
{
  "company_name": "Example Company",
  "job_title": "Software Developer"
}
```

The data becomes available through:

```ts
req.body
```

The `1mb` limit prevents unnecessarily large JSON request bodies.

---

## Health endpoint

```ts
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Job Application Tracker API is running",
    timestamp: new Date().toISOString(),
  });
});
```

Test:

```text
GET /api/health
```

Expected response:

```json
{
  "status": "ok",
  "message": "Job Application Tracker API is running",
  "timestamp": "..."
}
```

This is useful for quickly checking whether the backend is running.

---

# 10. Database Connection

Database code is located at:

```text
src/config/db.ts
```

The project uses:

```ts
import mysql from "mysql2/promise";
```

A connection pool is created:

```ts
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "jat_user",
  password: process.env.DB_PASSWORD || "jat_password",
  database: process.env.DB_NAME || "job_tracker",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

---

## What is a connection pool?

Instead of creating a brand-new database connection for every request, a pool maintains reusable connections.

Conceptually:

```text
             MySQL
               |
       +-------+-------+
       |       |       |
    Conn 1  Conn 2  Conn 3 ...
       |
       v
   Connection Pool
       ^
       |
 Express Controllers
```

This is more efficient for applications that handle multiple requests.

### Important configuration

```ts
connectionLimit: 10
```

The pool can maintain up to 10 active connections.

---

## Testing the connection

The backend uses:

```ts
const connection = await pool.getConnection();
await connection.ping();
connection.release();
```

The connection is always released:

```ts
finally {
  connection?.release();
}
```

### Why `finally`?

Even if an error occurs, the connection should be returned to the pool.

---

# 11. Database Design

The backend uses three main entities:

```text
users
  |
  | 1-to-many
  v
applications
  |
  | 1-to-many
  v
interviews
```

## Users

Stores account information.

Important fields:

```text
id
name
email
password_hash
role
created_at
updated_at
```

Roles:

```text
user
admin
```

---

## Applications

Stores job applications.

Important fields:

```text
id
user_id
company_name
job_title
job_link
status
applied_date
notes
created_at
updated_at
```

Application statuses:

```text
applied
interviewing
offer
rejected
withdrawn
```

---

## Interviews

Stores interview rounds associated with an application.

Important fields:

```text
id
application_id
round_name
interview_date
mode
status
notes
created_at
```

Interview modes:

```text
online
offline
phone
```

Interview statuses:

```text
scheduled
completed
cancelled
```

---

## Foreign keys

Applications belong to users:

```text
applications.user_id
        |
        v
users.id
```

Interviews belong to applications:

```text
interviews.application_id
        |
        v
applications.id
```

The relationships allow the database to maintain referential integrity.

### Cascade deletion

The database uses `ON DELETE CASCADE` for child records.

Conceptually:

```text
Delete User
   |
   v
Delete user's Applications
   |
   v
Delete related Interviews
```

This prevents orphaned records.

---

# 12. Authentication

Authentication answers:

> Who is this user?

The backend uses:

```text
Email + Password
       |
       v
bcrypt password verification
       |
       v
JWT
       |
       v
Protected API requests
```

There are three authentication endpoints:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

---

# 13. JWT Implementation

JWT helper:

```text
src/utils/jwt.ts
```

The backend reads:

```ts
const secret = process.env.JWT_SECRET;
```

If the secret is missing:

```ts
if (!secret) {
  throw new Error("JWT_SECRET is not configured");
}
```

This is important because authentication should not silently operate without a signing secret.

---

## Creating a token

```ts
export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  });
};
```

The payload contains:

```ts
{
  id,
  email,
  role
}
```

The token lifetime comes from:

```env
JWT_EXPIRES_IN=7d
```

---

## Verifying a token

```ts
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
};
```

If the token is invalid or expired, verification throws an error.

---

## Important revision point

JWT is **signed**, not encrypted by default.

That means you should not put sensitive information such as:

```text
password
password_hash
credit-card information
```

inside the token.

---

# 14. Authentication Middleware

File:

```text
src/middleware/auth.ts
```

The middleware checks:

```ts
req.headers.authorization
```

Expected format:

```text
Authorization: Bearer <token>
```

The code checks:

```ts
if (!authHeader?.startsWith("Bearer ")) {
  res.status(401).json({ message: "No token provided" });
  return;
}
```

Then extracts the token:

```ts
const token = authHeader.slice("Bearer ".length).trim();
```

Then verifies it:

```ts
req.user = verifyToken(token);
```

Finally:

```ts
next();
```

allows the request to continue.

---

## Authentication flow

```text
Client
  |
  | Authorization: Bearer JWT
  v
authenticate()
  |
  +-- Missing token --> 401
  |
  +-- Invalid token --> 401
  |
  +-- Valid token
          |
          v
      req.user
          |
          v
       next()
          |
          v
      Controller
```

---

# 15. Authorization and Data Ownership

Authentication and authorization are different.

### Authentication

> Are you logged in?

### Authorization

> Are you allowed to access this resource?

The application protects ownership at the controller level.

Example:

```ts
if (application.user_id !== req.user!.id && req.user!.role !== "admin") {
  return res.status(403).json({ message: "Access forbidden" });
}
```

This means:

```text
User owns resource
      OR
User is admin
      |
      v
Allowed
```

Otherwise:

```text
403 Forbidden
```

---

## Interview ownership check

Interviews use a helper:

```ts
const assertOwnsApplication = async (
  applicationId,
  userId,
  role
) => {
  ...
};
```

The backend first finds the application.

Then checks:

```text
Does application.user_id == logged-in user ID?
                 |
        +--------+--------+
       Yes                No
        |                  |
     Allow            Is admin?
                           |
                    +------+------+
                   Yes           No
                    |             |
                 Allow          403
```

This is important because an interview belongs to an application, not directly to a user.

---

# 16. REST API Routes

## Authentication

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Current user | Yes |

## Applications

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/applications` | List applications | Yes |
| POST | `/api/applications` | Create application | Yes |
| GET | `/api/applications/:id` | Get application | Yes |
| PUT | `/api/applications/:id` | Update application | Yes |
| DELETE | `/api/applications/:id` | Delete application | Yes |

## Interviews

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/applications/:appId/interviews` | List interviews | Yes |
| POST | `/api/applications/:appId/interviews` | Create interview | Yes |
| PUT | `/api/interviews/:id` | Update interview | Yes |
| DELETE | `/api/interviews/:id` | Delete interview | Yes |

## Profile

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/profile` | Get profile | Yes |
| PUT | `/api/profile` | Update profile | Yes |

---

# 17. Applications API

File:

```text
src/controllers/applicationController.ts
```

---

## Get applications

```text
GET /api/applications
```

For a normal user, the backend queries:

```sql
SELECT *
FROM applications
WHERE user_id = ?
ORDER BY applied_date DESC
```

The `?` is replaced using a parameter value:

```ts
[req.user!.id]
```

So users only receive their own applications.

---

## Admin application listing

An admin can request:

```text
GET /api/applications?all=true
```

The backend checks:

```ts
const isAdminAll =
  req.user!.role === "admin" &&
  req.query.all === "true";
```

If true, it joins applications with users:

```sql
SELECT a.*, u.name AS applicant_name,
       u.email AS applicant_email
FROM applications a
JOIN users u ON a.user_id = u.id
ORDER BY a.applied_date DESC
```

This provides applicant information for administrative viewing.

---

## Create application

```text
POST /api/applications
```

Expected important fields:

```json
{
  "company_name": "Example",
  "job_title": "Software Developer",
  "job_link": "https://example.com/job",
  "status": "applied",
  "applied_date": "2026-09-12",
  "notes": "Applied through company portal"
}
```

Required fields:

```text
company_name
job_title
applied_date
```

Validation:

```ts
if (!company_name || !job_title || !applied_date) {
  return res.status(400).json({
    message: "company_name, job_title, and applied_date are required"
  });
}
```

Default status:

```text
applied
```

---

## Update application

```text
PUT /api/applications/:id
```

The backend first retrieves the existing application.

Then it checks ownership.

The update uses the existing value when a field is not supplied:

```ts
company_name ?? application.company_name
```

This allows partial-style updates.

---

## Delete application

```text
DELETE /api/applications/:id
```

The backend:

1. Finds the application.
2. Checks ownership.
3. Deletes the record.
4. Returns success.

```sql
DELETE FROM applications
WHERE id = ?
```

Because interviews belong to applications through a cascading foreign key, deleting an application can also remove its interviews.

---

# 18. Interviews API

File:

```text
src/controllers/interviewController.ts
```

Interview support is connected to applications.

---

## Create interview

```text
POST /api/applications/:appId/interviews
```

Example:

```json
{
  "round_name": "Technical Round",
  "interview_date": "2026-09-12T15:30:00",
  "mode": "online",
  "status": "scheduled",
  "notes": "Prepare JavaScript and REST API questions"
}
```

Required:

```text
round_name
interview_date
```

Defaults:

```text
mode   = online
status = scheduled
```

---

## Get interviews

```text
GET /api/applications/:appId/interviews
```

The backend first checks whether the current user owns the application.

Then:

```sql
SELECT *
FROM interviews
WHERE application_id = ?
ORDER BY interview_date ASC
```

This makes upcoming interview rounds appear chronologically.

---

## Update interview

```text
PUT /api/interviews/:id
```

The backend:

1. Finds the interview.
2. Finds its parent application.
3. Checks application ownership.
4. Updates the supplied fields.
5. Keeps existing values for omitted fields.

Supported fields:

```text
round_name
interview_date
mode
status
notes
```

This endpoint is what allows the frontend to provide an **Edit Interview** feature.

---

## Delete interview

```text
DELETE /api/interviews/:id
```

The backend verifies ownership through the parent application before deleting.

---

# 19. Profile API

File:

```text
src/controllers/profileController.ts
```

## Get profile

```text
GET /api/profile
```

The response excludes the password hash.

It selects:

```sql
id,
name,
email,
role,
created_at
```

This is important because password hashes should not be returned to the frontend.

---

## Update profile

```text
PUT /api/profile
```

The current implementation supports:

```text
name
password
```

If a password is supplied:

```ts
const passwordHash = await bcrypt.hash(password, 10);
```

The stored password is replaced with the new hash.

---

# 20. Error Handling

There are two layers of error handling in the current backend.

Most controllers use:

```ts
try {
  ...
} catch (err) {
  console.error(err);
  res.status(500).json({
    message: "..."
  });
}
```

There is also a global error handler:

```text
src/middleware/errorHandler.ts
```

It returns:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

The global handler is registered near the end of `index.ts`:

```ts
app.use(errorHandler);
```

### Why should error middleware be near the end?

Express middleware runs in order.

The error handler needs to be registered after the routes so that errors passed down the middleware chain can reach it.

---

# 21. SQL Security

The backend uses parameterized SQL queries.

Example:

```ts
await pool.query(
  "SELECT * FROM users WHERE email = ?",
  [email]
);
```

Instead of:

```ts
// Do NOT build SQL like this
`SELECT * FROM users WHERE email = '${email}'`
```

### Why?

String concatenation can create SQL injection vulnerabilities.

Parameterized queries separate:

```text
SQL structure
```

from:

```text
User-provided values
```

### Remember

```text
Bad:
SQL + user input

Good:
SQL with placeholders + parameters
```

---

# 22. TypeScript Types

File:

```text
src/types/index.ts
```

The backend defines interfaces such as:

```ts
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "user" | "admin";
}
```

---

## Union types

Application status is restricted to known values:

```ts
export type ApplicationStatus =
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn";
```

Interview mode:

```ts
export type InterviewMode =
  | "online"
  | "offline"
  | "phone";
```

Interview status:

```ts
export type InterviewStatus =
  | "scheduled"
  | "completed"
  | "cancelled";
```

### Why use union types?

They prevent accidental use of unsupported values inside TypeScript code.

Instead of:

```ts
status: string
```

the compiler understands:

```text
status can only be one of the allowed values
```

---

# 23. Request Flow

## Example: Creating an application

```text
Frontend
   |
   | POST /api/applications
   | Authorization: Bearer JWT
   | JSON body
   v
Express
   |
   v
applicationRoutes.ts
   |
   v
authenticate()
   |
   +---- Invalid token --> 401
   |
   v
createApplication()
   |
   v
Validate required fields
   |
   v
MySQL parameterized INSERT
   |
   v
Database
   |
   v
201 Created
   |
   v
Frontend
```

---

## Example: Updating an interview

```text
Frontend
   |
   | PUT /api/interviews/:id
   v
authenticate()
   |
   v
updateInterview()
   |
   v
Find interview
   |
   v
Find parent application
   |
   v
Check ownership/admin
   |
   +---- Not allowed --> 403
   |
   v
UPDATE interviews
   |
   v
200 OK
```

---

# 24. HTTP Status Codes Used

| Status | Meaning | Example |
|---|---|---|
| `200` | Success | Successful GET/PUT/DELETE |
| `201` | Created | Registration/application/interview created |
| `400` | Bad Request | Required fields missing |
| `401` | Unauthorized | Missing/invalid JWT |
| `403` | Forbidden | User does not own resource |
| `404` | Not Found | Application/interview/user not found |
| `409` | Conflict | Email already registered |
| `500` | Internal Server Error | Unexpected backend/database error |

### Important distinction

```text
401 = Authentication problem
403 = Authorization problem
```

Example:

```text
No/invalid token
      -> 401

Valid user trying to access another user's data
      -> 403
```

---

# 25. Testing Checklist

The backend was tested during development.

## Server

- [x] Backend starts successfully
- [x] MySQL connection succeeds
- [x] `/api/health` responds
- [x] CORS configuration works

## Authentication

- [x] Register
- [x] Login
- [x] JWT generated
- [x] `/auth/me`
- [x] Invalid/empty authentication rejected

## Applications

- [x] Create application
- [x] Read applications
- [x] Update application
- [x] Delete application
- [x] Dashboard reflects application changes
- [x] Refresh persists changes

## Interviews

- [x] Create interview
- [x] Read interviews
- [x] Backend update endpoint exists
- [x] Delete interview
- [x] Invalid/empty required data rejected
- [x] User data isolation verified

## Authorization

- [x] Users see their own applications
- [x] Users see their own interviews
- [x] Ownership checks exist for application operations
- [x] Ownership checks exist for interview operations
- [x] Admin role can access permitted application data

> Note: user-isolation was verified through the application behavior and the ownership checks in the backend. A direct manual cross-user PUT/DELETE attack against another user's interview ID was not separately executed during this checkpoint.

---

# 26. Common Problems and Fixes

## Problem: JWT_SECRET is not configured

Error:

```text
Error: JWT_SECRET is not configured
```

### Fix

Create `.env`:

```bash
copy .env.example .env
```

Then configure:

```env
JWT_SECRET=your_long_random_secret
```

Restart the backend.

---

## Problem: MySQL connection failed

Check:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

Also verify MySQL is running.

If using Docker:

```bash
docker compose up -d
```

Check:

```bash
docker ps
```

---

## Problem: Port 3306 already in use

Another MySQL service may already be running.

On Windows, check:

```bash
netstat -ano | findstr :3306
```

If the local MySQL service is running and the project is supposed to use Docker on the same port, stop the conflicting service.

Example:

```bash
net stop MySQL80
```

---

## Problem: Frontend gets CORS error

Check:

```env
CORS_ORIGIN=http://localhost:5173
```

The value must match the frontend origin.

After changing `.env`, restart the backend.

---

## Problem: Backend does not restart after code changes

Make sure development mode is running:

```bash
npm run dev
```

Nodemon watches:

```text
src/
```

---

# 27. Backend Concepts to Remember

This section is intentionally short for revision.

## Express

Framework used to build the HTTP API.

```text
Request
  -> Middleware
  -> Route
  -> Controller
  -> Response
```

---

## Middleware

Middleware runs between the request and the final response.

Example:

```ts
authenticate(req, res, next)
```

It can:

- inspect requests
- authenticate users
- modify requests
- reject requests
- pass control using `next()`

---

## REST

The API uses HTTP methods based on resource operations.

```text
GET    -> Read
POST   -> Create
PUT    -> Update
DELETE -> Delete
```

---

## Authentication

Verifies identity.

```text
JWT
```

---

## Authorization

Checks permissions.

```text
user owns resource
OR
user is admin
```

---

## bcrypt

Passwords are not stored as plaintext.

```text
Plain password
      |
      v
bcrypt.hash()
      |
      v
Password hash
      |
      v
Database
```

During login:

```text
Entered password
      |
      v
bcrypt.compare()
      |
      v
Match / No match
```

---

## JWT

Contains claims such as:

```text
user ID
email
role
```

It is signed using:

```text
JWT_SECRET
```

---

## Connection Pool

Allows the application to reuse database connections efficiently.

---

## Foreign Key

Maintains relationships between tables.

```text
users.id
   ^
   |
applications.user_id
   ^
   |
interviews.application_id
```

---

## Cascade Delete

Deleting a parent can delete dependent child records.

---

## Parameterized SQL

Use:

```ts
WHERE id = ?
```

with:

```ts
[id]
```

instead of concatenating user input into SQL.

---

# 28. Interview Revision

## Q1. Why did you use Express?

**Answer:**

I used Express because it provides a lightweight and straightforward way to build REST APIs in Node.js. It also provides middleware support for concerns such as authentication, CORS, and request parsing.

---

## Q2. What is middleware?

**Answer:**

Middleware is a function that runs during the request-response lifecycle. It can inspect or modify a request, reject it, or call `next()` to continue to the next middleware or route handler.

---

## Q3. How does authentication work in your project?

**Answer:**

The user registers or logs in using email and password. Passwords are hashed using bcrypt. After successful authentication, the backend generates a JWT containing the user's ID, email, and role. The frontend sends the JWT in the Authorization header for protected requests. The authentication middleware verifies the token and attaches the decoded user information to `req.user`.

---

## Q4. Authentication vs authorization?

**Answer:**

Authentication determines who the user is. Authorization determines whether that authenticated user is allowed to perform a particular operation or access a resource.

---

## Q5. Why bcrypt?

**Answer:**

Passwords should never be stored as plaintext. bcrypt is a password-hashing algorithm designed to make password cracking more expensive. The backend stores the resulting hash and uses `bcrypt.compare()` during login.

---

## Q6. Why use JWT?

**Answer:**

JWT provides a signed token that the client can send with subsequent requests. The backend can verify the token and obtain the user's identity and role without storing the authentication session in server memory.

---

## Q7. Where is the JWT secret stored?

**Answer:**

It is stored in the environment variable `JWT_SECRET`, not directly in source code or Git.

---

## Q8. How do you prevent users from accessing another user's applications?

**Answer:**

After authenticating the user, the backend compares the resource owner's `user_id` with the authenticated user's ID. If they do not match and the user is not an admin, the backend returns `403 Forbidden`.

---

## Q9. How do you protect interview records?

**Answer:**

An interview belongs to an application. Before reading, updating, or deleting an interview, the backend finds the interview's application and checks whether the authenticated user owns that application or has the admin role.

---

## Q10. How do you prevent SQL injection?

**Answer:**

I use parameterized SQL queries with placeholders such as `?` and pass user input separately as query parameters. This keeps user-controlled values separate from SQL syntax.

---

## Q11. Why use a connection pool?

**Answer:**

A connection pool manages reusable database connections. This avoids creating a new connection for every request and makes database access more efficient under multiple requests.

---

## Q12. Why use TypeScript?

**Answer:**

TypeScript provides static typing, which helps catch incorrect values and mismatched structures during development. In this project, interfaces and union types describe users, applications, interviews, JWT payloads, and allowed statuses.

---

## Q13. Why use `201` for creation?

**Answer:**

HTTP `201 Created` indicates that a new resource was successfully created. I use it for operations such as registration, application creation, and interview creation.

---

## Q14. Difference between 401 and 403?

**Answer:**

`401 Unauthorized` is used when authentication is missing or invalid. `403 Forbidden` means the request is authenticated, but the user does not have permission to access the resource.

---

# 29. Current Limitations and Future Hardening

The backend is **stable for the current feature scope**, but it is not being presented as a fully hardened production security system.

Potential future improvements:

### Stronger input validation

Current controllers perform basic required-field checks.

Future improvement:

```text
Zod
Joi
express-validator
```

for schema-based validation.

---

### Validate enum values

Application and interview statuses/modes should ideally be validated before sending them to MySQL.

For example:

```text
application status:
applied
interviewing
offer
rejected
withdrawn
```

Invalid values should return:

```text
400 Bad Request
```

rather than relying on database-level behavior.

---

### Email normalization

Registration/login could normalize emails:

```text
User@Example.com
```

to:

```text
user@example.com
```

before database lookup/storage.

---

### Password policy

Add requirements such as:

```text
minimum length
uppercase/lowercase
number
special character
```

depending on the application's security requirements.

---

### Password-change verification

The current profile endpoint can change a password when a new password is supplied.

A stronger production design would require the current password before changing it.

---

### Rate limiting

Authentication endpoints should eventually have rate limiting to reduce brute-force attacks.

Example:

```text
POST /api/auth/login
POST /api/auth/register
```

---

### Security headers

Production deployment could add security middleware such as:

```text
helmet
```

---

### Centralized error handling

The project has a global error handler, but several controllers currently handle errors individually.

A future refactor could standardize errors through one centralized approach.

---

### Role middleware

An `authorize()` middleware exists in `auth.ts`.

It can be used more consistently if the application grows and has more admin-only endpoints.

---

# 30. Production Checklist

Before production deployment:

- [ ] Use production `JWT_SECRET`
- [ ] Never expose `.env`
- [ ] Use production database credentials
- [ ] Restrict `CORS_ORIGIN`
- [ ] Use HTTPS
- [ ] Add stronger request validation
- [ ] Validate enum values
- [ ] Add rate limiting
- [ ] Add security headers
- [ ] Review password policy
- [ ] Review password-change flow
- [ ] Add structured logging
- [ ] Configure production error handling
- [ ] Build TypeScript with `npm run build`
- [ ] Test the production API
- [ ] Configure frontend API URL
- [ ] Verify database backups

---

# Final Revision Summary

If I forget how this backend works, remember this:

```text
                 JOB APPLICATION TRACKER BACKEND
                              |
                              v
                         Express API
                              |
              +---------------+---------------+
              |               |               |
           Auth API      Applications API   Profile API
              |               |
              |               v
              |           Interviews API
              |               |
              +-------+-------+
                      |
                      v
                 Auth Middleware
                      |
                      v
                    JWT
                      |
                      v
                  Controllers
                      |
                      v
               MySQL Connection Pool
                      |
                      v
                    MySQL
```

### The five things I should be able to explain in an interview

```text
1. How JWT authentication works
2. How ownership/authorization is enforced
3. How Express routes -> controllers -> database
4. How passwords are securely hashed
5. How parameterized SQL protects against SQL injection
```

If I can explain those five clearly, I understand the core of this backend rather than simply having written the code.

