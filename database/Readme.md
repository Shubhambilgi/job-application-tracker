# Job Application Tracker — Database Documentation

> **Purpose:** This document is written as both **project documentation and a study/revision guide**.  
> It explains the database from the actual `schema.sql`, then connects each SQL concept to how the backend uses it.

---

## Table of Contents

1. [Database Overview](#1-database-overview)
2. [Database Architecture](#2-database-architecture)
3. [Database Structure](#3-database-structure)
4. [The `schema.sql` File](#4-the-schemasql-file)
5. [Creating the Database](#5-creating-the-database)
6. [The `users` Table](#6-the-users-table)
7. [The `applications` Table](#7-the-applications-table)
8. [The `interviews` Table](#8-the-interviews-table)
9. [Table Relationships](#9-table-relationships)
10. [Primary Keys](#10-primary-keys)
11. [Foreign Keys](#11-foreign-keys)
12. [`ON DELETE CASCADE`](#12-on-delete-cascade)
13. [Constraints](#13-constraints)
14. [`ENUM`](#14-enum)
15. [Date and Time Columns](#15-date-and-time-columns)
16. [`TEXT` Columns](#16-text-columns)
17. [Indexes](#17-indexes)
18. [Why the Indexes Matter](#18-why-the-indexes-matter)
19. [Database Query Concepts](#19-database-query-concepts)
20. [Backend → Database Flow](#20-backend--database-flow)
21. [Authentication Data Flow](#21-authentication-data-flow)
22. [Application Data Flow](#22-application-data-flow)
23. [Interview Data Flow](#23-interview-data-flow)
24. [Database Testing](#24-database-testing)
25. [Useful SQL Queries for Revision](#25-useful-sql-queries-for-revision)
26. [Common Database Problems](#26-common-database-problems)
27. [Important Concepts to Remember](#27-important-concepts-to-remember)
28. [Interview Revision](#28-interview-revision)
29. [Future Improvements](#29-future-improvements)
30. [Final Mental Model](#30-final-mental-model)

---

# 1. Database Overview

The Job Application Tracker uses **MySQL 8** as its relational database.

The database stores three main categories of information:

- Users
- Job applications
- Interviews

The database name is:

```sql
job_tracker
```

The system can be viewed as:

```text
User
 |
 | creates
 v
Application
 |
 | has
 v
Interview
```

This relationship is the core of the database design.

A user can have many applications.

An application can have many interview rounds.

Therefore:

```text
users       1 ─────────── N applications
applications 1 ────────── N interviews
```

---

## Why MySQL?

MySQL is a relational database management system.

It is useful here because the application has clearly structured relationships:

- A user owns applications.
- An application owns interview rounds.
- Applications have controlled status values.
- Interviews have controlled status and mode values.
- Foreign keys can enforce relationships.

The project therefore benefits from a relational database rather than storing everything inside one large JSON document.

---

## What should you understand as a developer?

Do not only memorize the SQL.

You should understand:

```text
Why was this table created?
Why does this column exist?
Why is this column NOT NULL?
Why is this column a foreign key?
Why do we need an index?
What happens if a user is deleted?
What happens if an application is deleted?
How does the backend identify the correct user's data?
```

These are the questions that matter in interviews and real development.

---

# 2. Database Architecture

The project has three main application layers:

```text
React Frontend
       |
       | HTTP / REST API
       v
Node.js + Express Backend
       |
       | SQL queries
       v
MySQL Database
```

The database should not be accessed directly by the frontend.

The frontend sends an API request.

The backend authenticates the request.

The backend runs a SQL query.

MySQL returns the data.

The backend sends a response to the frontend.

---

## Example

When a user opens their applications:

```text
Frontend
   |
   | GET /api/applications
   v
Express API
   |
   | authenticate user
   |
   | SELECT ... FROM applications
   | WHERE user_id = ?
   v
MySQL
   |
   | result
   v
Express API
   |
   | JSON response
   v
Frontend
```

This separation is important.

The frontend handles presentation.

The backend handles business logic and security.

The database handles persistent data storage and relational integrity.

---

# 3. Database Structure

The database contains:

```text
job_tracker
│
├── users
│
├── applications
│
└── interviews
```

Each table has a different responsibility.

| Table | Responsibility |
|---|---|
| `users` | Stores user accounts and roles |
| `applications` | Stores job applications |
| `interviews` | Stores interview rounds for applications |

---

## Relationship overview

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

This is a simple normalized relational structure.

Instead of storing all interviews inside the application row, interviews are stored separately.

That allows one application to have:

```text
HR Round
Technical Round
Managerial Round
Final Round
```

as separate database records.

---

# 4. The `schema.sql` File

The project's database definition is contained in:

```text
database/schema.sql
```

The schema is responsible for creating:

1. The database
2. The tables
3. Columns
4. Constraints
5. Foreign keys
6. Indexes

The actual schema is:

```sql
-- Job Application Tracker - Database Schema

CREATE DATABASE IF NOT EXISTS job_tracker;
USE job_tracker;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  job_title VARCHAR(150) NOT NULL,
  job_link VARCHAR(500),
  status ENUM('applied', 'interviewing', 'offer', 'rejected', 'withdrawn') NOT NULL DEFAULT 'applied',
  applied_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  round_name VARCHAR(150) NOT NULL,
  interview_date DATETIME NOT NULL,
  mode ENUM('online', 'offline', 'phone') NOT NULL DEFAULT 'online',
  status ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_interviews_application_id ON interviews(application_id);
```

---

# 5. Creating the Database

The first statement is:

```sql
CREATE DATABASE IF NOT EXISTS job_tracker;
```

## What does it do?

It creates a database named:

```text
job_tracker
```

if the database does not already exist.

---

## Why `IF NOT EXISTS`?

Without it:

```sql
CREATE DATABASE job_tracker;
```

MySQL can produce an error if the database already exists.

With:

```sql
CREATE DATABASE IF NOT EXISTS job_tracker;
```

the command becomes safer to run repeatedly.

This is useful during development.

---

## Selecting the database

Next:

```sql
USE job_tracker;
```

This tells MySQL:

> Use `job_tracker` as the database for the following SQL statements.

Without selecting the database, MySQL may not know where to create the tables.

---

## Important concept

Remember:

```text
CREATE DATABASE
        ↓
Select database using USE
        ↓
CREATE TABLE
```

---

# 6. The `users` Table

The users table stores account information.

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Column overview

| Column | Type | Purpose |
|---|---|---|
| `id` | INT | Unique user ID |
| `name` | VARCHAR(100) | User's name |
| `email` | VARCHAR(150) | Login email |
| `password_hash` | VARCHAR(255) | Hashed password |
| `role` | ENUM | User authorization role |
| `created_at` | TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | Last update time |

---

## `id`

```sql
id INT AUTO_INCREMENT PRIMARY KEY
```

This column identifies a user uniquely.

Example:

```text
id
---
1
2
3
4
```

`AUTO_INCREMENT` means MySQL automatically generates the next numeric ID.

The application does not need to manually choose:

```text
1
2
3
4
```

---

## Why is `id` the primary key?

A primary key uniquely identifies each row.

For example:

```text
User 1 → Shubham
User 2 → Rahul
```

Even if two users had the same name, their IDs would still be different.

---

## `name`

```sql
name VARCHAR(100) NOT NULL
```

This stores the user's name.

`VARCHAR(100)` means the column can store variable-length text up to 100 characters.

`NOT NULL` means the value must be provided.

---

## `email`

```sql
email VARCHAR(150) NOT NULL UNIQUE
```

The email is required.

It is also unique.

That means two users cannot have the same email.

For example:

```text
shubham@example.com
```

can belong to one user only.

---

## Why use `UNIQUE`?

Authentication commonly uses email as the login identifier.

Without `UNIQUE`, this could happen:

```text
id | email
---|-------------------
1  | user@example.com
2  | user@example.com
```

That would create ambiguity.

The unique constraint prevents this.

---

## `password_hash`

```sql
password_hash VARCHAR(255) NOT NULL
```

The database stores the **password hash**, not the original password.

Conceptually:

```text
User password
     |
     | bcrypt
     v
Password hash
     |
     v
Database
```

The original password should not be stored as plain text.

---

## Important security concept

Bad:

```text
password = "mypassword123"
```

stored directly.

Better:

```text
password_hash = "$2b$..."
```

The backend uses `bcryptjs` to hash passwords.

The database column is named `password_hash` to make its purpose explicit.

---

## `role`

```sql
role ENUM('user', 'admin') NOT NULL DEFAULT 'user'
```

The role determines the user's authorization level.

Possible values:

```text
user
admin
```

New users default to:

```text
user
```

This is important because a newly registered account should not automatically become an administrator.

---

## `created_at`

```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

When a row is created, MySQL automatically stores the current timestamp.

Example:

```text
2026-09-12 14:30:00
```

---

## `updated_at`

```sql
updated_at TIMESTAMP
DEFAULT CURRENT_TIMESTAMP
ON UPDATE CURRENT_TIMESTAMP
```

This records when the row was last updated.

The important part is:

```sql
ON UPDATE CURRENT_TIMESTAMP
```

When the row changes, MySQL updates the timestamp automatically.

---

## Interview point

A common interview question:

**What is the difference between `created_at` and `updated_at`?**

Answer:

> `created_at` records when the row was created, while `updated_at` records the most recent update to that row.

---

# 7. The `applications` Table

This table stores job applications.

```sql
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  job_title VARCHAR(150) NOT NULL,
  job_link VARCHAR(500),
  status ENUM('applied', 'interviewing', 'offer', 'rejected', 'withdrawn') NOT NULL DEFAULT 'applied',
  applied_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Column overview

| Column | Type | Purpose |
|---|---|---|
| `id` | INT | Unique application ID |
| `user_id` | INT | Owner of the application |
| `company_name` | VARCHAR | Company name |
| `job_title` | VARCHAR | Position applied for |
| `job_link` | VARCHAR | Job posting URL |
| `status` | ENUM | Current application status |
| `applied_date` | DATE | Date of application |
| `notes` | TEXT | Additional information |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

---

## `id`

```sql
id INT AUTO_INCREMENT PRIMARY KEY
```

Every application receives a unique ID.

Example:

```text
Application 101
Application 102
Application 103
```

---

## `user_id`

```sql
user_id INT NOT NULL
```

This identifies the user who owns the application.

Example:

```text
user_id = 1
```

means the application belongs to user 1.

This column is the key part of user data isolation.

---

## Why not store the user name?

Because the user ID is a stable identifier.

Instead of:

```text
company_name = Google
user_name = Shubham
```

the application stores:

```text
user_id = 1
```

The database can connect that ID to the `users` table.

This avoids unnecessarily duplicating user information.

---

## `company_name`

```sql
company_name VARCHAR(150) NOT NULL
```

Stores the company name.

Example:

```text
Google
Microsoft
Infosys
TCS
```

---

## `job_title`

```sql
job_title VARCHAR(150) NOT NULL
```

Stores the position.

Examples:

```text
Software Engineer
Backend Developer
Android Developer
Cybersecurity Intern
```

---

## `job_link`

```sql
job_link VARCHAR(500)
```

Stores the URL of the job posting.

It does not have `NOT NULL`.

Therefore the application can exist without a job link.

Example:

```text
https://example.com/jobs/software-engineer
```

---

## `status`

```sql
status ENUM(
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn'
) NOT NULL DEFAULT 'applied'
```

This represents the application's current state.

Possible states:

```text
applied
interviewing
offer
rejected
withdrawn
```

New applications default to:

```text
applied
```

---

## Application lifecycle

A typical lifecycle can look like:

```text
Applied
   |
   v
Interviewing
   |
   v
Offer
```

Or:

```text
Applied
   |
   v
Rejected
```

The schema allows these status values.

The actual business logic determines when the application changes state.

---

## `applied_date`

```sql
applied_date DATE NOT NULL
```

Stores the date on which the user applied.

Example:

```text
2026-09-12
```

`DATE` is appropriate because an application date does not require a time of day.

---

## `notes`

```sql
notes TEXT
```

This stores additional information.

Examples:

```text
Applied through company website.
Recruiter contacted me.
Waiting for assessment.
```

It is optional.

---

## `created_at` and `updated_at`

These work similarly to the users table.

```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

and:

```sql
updated_at TIMESTAMP
DEFAULT CURRENT_TIMESTAMP
ON UPDATE CURRENT_TIMESTAMP
```

---

# 8. The `interviews` Table

The interviews table stores individual interview rounds.

```sql
CREATE TABLE IF NOT EXISTS interviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  round_name VARCHAR(150) NOT NULL,
  interview_date DATETIME NOT NULL,
  mode ENUM('online', 'offline', 'phone') NOT NULL DEFAULT 'online',
  status ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
```

---

## Column overview

| Column | Type | Purpose |
|---|---|---|
| `id` | INT | Unique interview ID |
| `application_id` | INT | Application associated with the interview |
| `round_name` | VARCHAR | Interview round name |
| `interview_date` | DATETIME | Date and time |
| `mode` | ENUM | Interview method |
| `status` | ENUM | Interview state |
| `notes` | TEXT | Interview notes |
| `created_at` | TIMESTAMP | Creation timestamp |

---

## `application_id`

```sql
application_id INT NOT NULL
```

This identifies which application the interview belongs to.

Example:

```text
application_id = 10
```

means the interview belongs to application 10.

---

## `round_name`

```sql
round_name VARCHAR(150) NOT NULL
```

Examples:

```text
HR Round
Technical Round
Managerial Round
Final Round
```

---

## `interview_date`

```sql
interview_date DATETIME NOT NULL
```

Unlike `DATE`, `DATETIME` stores both date and time.

Example:

```text
2026-09-12 15:30:00
```

This is necessary because an interview is scheduled for a specific time.

---

## `mode`

```sql
mode ENUM('online', 'offline', 'phone')
DEFAULT 'online'
```

Possible modes:

```text
online
offline
phone
```

If no mode is provided, it defaults to:

```text
online
```

---

## `status`

```sql
status ENUM('scheduled', 'completed', 'cancelled')
DEFAULT 'scheduled'
```

Possible interview states:

```text
scheduled
completed
cancelled
```

---

## Interview lifecycle

```text
Scheduled
    |
    +----> Completed
    |
    +----> Cancelled
```

---

## `notes`

```sql
notes TEXT
```

This allows the application to store interview-specific information.

Examples:

```text
Focus on React and TypeScript.
Interviewer asked about REST APIs.
Prepare system design topics.
```

---

# 9. Table Relationships

The database has two important relationships.

---

## Relationship 1: Users → Applications

One user can have many applications.

```text
User
 |
 +---- Application 1
 |
 +---- Application 2
 |
 +---- Application 3
```

Therefore:

```text
users 1 : N applications
```

This is called a **one-to-many relationship**.

---

## Relationship 2: Applications → Interviews

One application can have many interviews.

```text
Application
 |
 +---- HR Round
 |
 +---- Technical Round
 |
 +---- Managerial Round
 |
 +---- Final Round
```

Therefore:

```text
applications 1 : N interviews
```

---

## Complete relationship

```text
users
  |
  | 1
  |
  | N
  v
applications
  |
  | 1
  |
  | N
  v
interviews
```

This is the most important diagram to remember.

---

# 10. Primary Keys

A **primary key** uniquely identifies a row.

The project uses:

```sql
id INT AUTO_INCREMENT PRIMARY KEY
```

in each table.

---

## Users

```sql
id INT AUTO_INCREMENT PRIMARY KEY
```

Identifies a user.

---

## Applications

```sql
id INT AUTO_INCREMENT PRIMARY KEY
```

Identifies an application.

---

## Interviews

```sql
id INT AUTO_INCREMENT PRIMARY KEY
```

Identifies an interview.

---

## Properties of a primary key

A primary key:

- uniquely identifies a row
- cannot contain duplicate values
- cannot be `NULL`
- provides a stable identifier for relationships

---

## Interview question

**Why do we need a primary key?**

Answer:

> A primary key uniquely identifies each row in a table and provides a reliable way to reference that row from queries and related tables.

---

# 11. Foreign Keys

A foreign key creates a relationship between tables.

The applications table contains:

```sql
FOREIGN KEY (user_id)
REFERENCES users(id)
```

This means:

```text
applications.user_id
        |
        v
users.id
```

---

The interviews table contains:

```sql
FOREIGN KEY (application_id)
REFERENCES applications(id)
```

This means:

```text
interviews.application_id
        |
        v
applications.id
```

---

## Why use foreign keys?

They protect referential integrity.

For example, an interview cannot logically belong to an application that does not exist.

The database helps enforce this relationship.

---

## Referential integrity

Referential integrity means relationships between tables remain valid.

Example:

```text
applications.application_id = 10
```

must reference an existing:

```text
applications.id = 10
```

when used by `interviews.application_id`.

---

# 12. `ON DELETE CASCADE`

The schema uses:

```sql
ON DELETE CASCADE
```

in two relationships.

---

## Users → Applications

```sql
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE
```

If a user is deleted, their applications are automatically deleted.

Conceptually:

```text
Delete User
     |
     v
Delete user's Applications
```

---

## Applications → Interviews

```sql
FOREIGN KEY (application_id)
REFERENCES applications(id)
ON DELETE CASCADE
```

If an application is deleted, its interviews are automatically deleted.

Conceptually:

```text
Delete Application
       |
       v
Delete related Interviews
```

---

## Complete cascade

```text
Delete User
    |
    v
Applications deleted
    |
    v
Interviews deleted
```

This prevents orphaned interview records.

---

## What is an orphan record?

An orphan record is a child record whose parent no longer exists.

For example:

```text
Interview
application_id = 10
```

but application 10 has been deleted.

Cascade deletion prevents this situation automatically.

---

## Interview question

**What is `ON DELETE CASCADE`?**

Answer:

> `ON DELETE CASCADE` automatically deletes dependent child rows when the referenced parent row is deleted.

---

# 13. Constraints

A constraint is a rule applied by the database.

The project uses several important constraints.

---

## `PRIMARY KEY`

Example:

```sql
id INT PRIMARY KEY
```

Guarantees row identity.

---

## `NOT NULL`

Example:

```sql
name VARCHAR(100) NOT NULL
```

The column must have a value.

---

## `UNIQUE`

Example:

```sql
email VARCHAR(150) UNIQUE
```

Prevents duplicate emails.

---

## `DEFAULT`

Example:

```sql
role ENUM('user', 'admin') DEFAULT 'user'
```

Provides a value when one is not supplied.

---

## `FOREIGN KEY`

Example:

```sql
FOREIGN KEY (user_id)
REFERENCES users(id)
```

Maintains a relationship between tables.

---

## `ON DELETE CASCADE`

Controls what happens to child records when the parent is deleted.

---

## Why constraints matter

Application code should validate data.

But the database should also protect itself.

This gives us multiple layers of protection:

```text
Frontend validation
        ↓
Backend validation
        ↓
Database constraints
```

Never assume the frontend alone is enough.

---

# 14. `ENUM`

The project uses `ENUM` for values with a controlled set of choices.

Example:

```sql
role ENUM('user', 'admin')
```

---

## Application status

```sql
ENUM(
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn'
)
```

---

## Interview mode

```sql
ENUM(
  'online',
  'offline',
  'phone'
)
```

---

## Interview status

```sql
ENUM(
  'scheduled',
  'completed',
  'cancelled'
)
```

---

## Why use ENUM here?

These values represent a small, controlled set.

It prevents arbitrary values such as:

```text
"banana"
"random_status"
"hello"
```

from being valid status values.

---

## Important tradeoff

`ENUM` is convenient for small fixed sets.

However, if the possible values change frequently or need to be managed dynamically, a lookup/reference table can be more flexible.

For this project, the current schema uses `ENUM`, and that is appropriate for the defined fixed states.

---

# 15. Date and Time Columns

The project uses:

```text
DATE
DATETIME
TIMESTAMP
```

They serve different purposes.

---

## `DATE`

Used for:

```sql
applied_date DATE NOT NULL
```

Example:

```text
2026-09-12
```

It stores only a calendar date.

---

## `DATETIME`

Used for:

```sql
interview_date DATETIME NOT NULL
```

Example:

```text
2026-09-12 15:30:00
```

It stores date and time.

---

## `TIMESTAMP`

Used for:

```sql
created_at TIMESTAMP
updated_at TIMESTAMP
```

These are useful for record lifecycle timestamps.

---

## Quick comparison

| Type | Example | Purpose |
|---|---|---|
| `DATE` | `2026-09-12` | Date only |
| `DATETIME` | `2026-09-12 15:30:00` | Date + time |
| `TIMESTAMP` | `2026-09-12 15:30:00` | Record timestamps |

---

# 16. `TEXT` Columns

The schema uses `TEXT` for notes.

Examples:

```sql
notes TEXT
```

This appears in:

```text
applications
interviews
```

---

## Why `TEXT`?

Notes can contain variable-length content.

For example:

```text
Recruiter contacted me.
Need to revise SQL before the next round.
Interviewer asked about React hooks.
```

Using `TEXT` avoids forcing a short fixed character limit.

---

# 17. Indexes

The schema creates three indexes:

```sql
CREATE INDEX idx_applications_user_id
ON applications(user_id);

CREATE INDEX idx_applications_status
ON applications(status);

CREATE INDEX idx_interviews_application_id
ON interviews(application_id);
```

Indexes are extremely important for database performance.

---

## What is an index?

Think about a book.

Without an index:

```text
Search every page
      ↓
Slow
```

With an index:

```text
Look up topic
      ↓
Jump to relevant page
      ↓
Faster
```

A database index works similarly.

---

# 18. Why the Indexes Matter

## Index 1: `applications.user_id`

```sql
CREATE INDEX idx_applications_user_id
ON applications(user_id);
```

The backend frequently needs to find applications belonging to a particular user.

Conceptually:

```sql
SELECT *
FROM applications
WHERE user_id = ?;
```

The index helps MySQL find matching rows efficiently as the table grows.

---

## Index 2: `applications.status`

```sql
CREATE INDEX idx_applications_status
ON applications(status);
```

This supports queries that filter applications by status.

Example:

```sql
SELECT *
FROM applications
WHERE status = 'interviewing';
```

---

## Index 3: `interviews.application_id`

```sql
CREATE INDEX idx_interviews_application_id
ON interviews(application_id);
```

This supports finding interviews for a specific application.

Example:

```sql
SELECT *
FROM interviews
WHERE application_id = ?;
```

---

## Important tradeoff

Indexes improve read performance.

But indexes also have a cost.

When rows are inserted, updated, or deleted, indexes may also need to be maintained.

Therefore:

> Do not blindly index every column.

Create indexes for columns that are commonly used for:

- filtering
- joining
- searching
- ordering

based on actual query patterns.

---

## Interview question

**Do indexes always make a database faster?**

Good answer:

> Indexes usually improve reads for queries that can use them, but they also consume storage and add maintenance overhead during inserts, updates, and deletes. Therefore indexes should be chosen based on query patterns.

---

# 19. Database Query Concepts

The backend communicates with MySQL using SQL queries.

Some common operations are:

```text
INSERT
SELECT
UPDATE
DELETE
```

These correspond to CRUD.

---

## Create → INSERT

Example:

```sql
INSERT INTO applications
(user_id, company_name, job_title, status, applied_date)
VALUES (?, ?, ?, ?, ?);
```

Creates a new application.

---

## Read → SELECT

Example:

```sql
SELECT *
FROM applications
WHERE user_id = ?;
```

Reads applications for a user.

---

## Update → UPDATE

Example:

```sql
UPDATE applications
SET status = ?
WHERE id = ?;
```

Updates an application.

---

## Delete → DELETE

Example:

```sql
DELETE FROM applications
WHERE id = ?;
```

Deletes an application.

---

# Parameterized Queries

The backend uses parameterized SQL.

Instead of constructing:

```text
SELECT ... WHERE email = 'user input'
```

directly with string concatenation, the query uses placeholders:

```sql
SELECT *
FROM users
WHERE email = ?;
```

and passes the value separately.

---

## Why?

This helps protect against SQL injection and keeps query construction safer.

---

## SQL injection concept

Unsafe pattern:

```text
SQL query + raw user input
```

Safer pattern:

```text
SQL statement with placeholders
        +
separate parameters
```

---

## Interview question

**What is SQL injection?**

Answer:

> SQL injection is a security vulnerability where attacker-controlled input changes the intended SQL statement. Parameterized queries help prevent this by keeping SQL structure separate from data values.

---

# 20. Backend → Database Flow

The backend uses a MySQL connection pool.

Conceptually:

```text
Express Controller
       |
       v
Database Pool
       |
       v
MySQL
```

---

## Why use a connection pool?

Opening a completely new database connection for every request is inefficient.

A connection pool maintains reusable database connections.

Conceptually:

```text
             +----------------+
Request ---->| Connection Pool|
             +----------------+
              |   |   |   |
              v   v   v   v
             MySQL connections
```

The application can acquire a connection, execute the query, and release it.

---

## Typical request

```text
HTTP Request
     |
     v
Route
     |
     v
Authentication
     |
     v
Controller
     |
     v
SQL Query
     |
     v
MySQL
     |
     v
Result
     |
     v
JSON Response
```

---

# 21. Authentication Data Flow

Registration:

```text
User enters email/password
          |
          v
Frontend
          |
          v
POST /auth/register
          |
          v
Backend
          |
          | hash password
          v
       bcrypt
          |
          v
INSERT users
          |
          v
MySQL
```

The database stores the password hash.

---

## Login

```text
Email + Password
       |
       v
Backend
       |
       | SELECT user
       v
MySQL
       |
       v
Password hash
       |
       v
bcrypt comparison
       |
       v
JWT created
```

The database is responsible for persistence.

The backend is responsible for authentication logic.

---

# 22. Application Data Flow

When creating an application:

```text
Frontend
   |
   | POST request
   v
Express route
   |
   v
Authentication
   |
   v
Application controller
   |
   | INSERT
   v
applications table
   |
   v
MySQL
```

The important security relationship is:

```text
authenticated user ID
        |
        v
applications.user_id
```

---

## Reading applications

Conceptually:

```sql
SELECT *
FROM applications
WHERE user_id = ?;
```

The `?` represents the authenticated user's ID.

This is essential for data isolation.

---

# 23. Interview Data Flow

Creating an interview:

```text
Frontend
   |
   | POST interview
   v
Backend
   |
   | verify application ownership
   v
Application
   |
   | INSERT
   v
Interviews
```

An interview belongs to an application through:

```sql
application_id
```

---

## Reading interviews

Conceptually:

```sql
SELECT *
FROM interviews
WHERE application_id = ?;
```

---

## Deleting an application

Because the schema contains:

```sql
ON DELETE CASCADE
```

deleting the application also deletes its interviews.

```text
DELETE Application
       |
       v
Application removed
       |
       v
Related Interviews removed
```

This is a useful example of database-level referential integrity.

---

# 24. Database Testing

Do not consider a database "working" only because the application starts.

Test the actual behavior.

---

## Test 1 — Database exists

```sql
SHOW DATABASES;
```

Confirm:

```text
job_tracker
```

exists.

---

## Test 2 — Tables exist

```sql
USE job_tracker;

SHOW TABLES;
```

Expected:

```text
applications
interviews
users
```

---

## Test 3 — Inspect table structure

```sql
DESCRIBE users;
```

Then:

```sql
DESCRIBE applications;
```

Then:

```sql
DESCRIBE interviews;
```

---

## Test 4 — Check users

```sql
SELECT * FROM users;
```

---

## Test 5 — Check applications

```sql
SELECT * FROM applications;
```

---

## Test 6 — Check interviews

```sql
SELECT * FROM interviews;
```

---

## Test 7 — Verify foreign keys

You can inspect table definitions:

```sql
SHOW CREATE TABLE applications;
```

and:

```sql
SHOW CREATE TABLE interviews;
```

Look for:

```text
FOREIGN KEY
```

and:

```text
ON DELETE CASCADE
```

---

# 25. Useful SQL Queries for Revision

These queries are useful for understanding the project's data.

---

## Show all users

```sql
SELECT * FROM users;
```

---

## Show all applications

```sql
SELECT * FROM applications;
```

---

## Show all interviews

```sql
SELECT * FROM interviews;
```

---

## Applications for one user

```sql
SELECT *
FROM applications
WHERE user_id = ?;
```

---

## Applications by status

```sql
SELECT *
FROM applications
WHERE status = 'interviewing';
```

---

## Interviews for one application

```sql
SELECT *
FROM interviews
WHERE application_id = ?;
```

---

## Count applications

```sql
SELECT COUNT(*)
FROM applications;
```

---

## Count applications by status

```sql
SELECT status, COUNT(*)
FROM applications
GROUP BY status;
```

This is especially useful for dashboard statistics.

---

## Join users and applications

```sql
SELECT
  users.name,
  users.email,
  applications.company_name,
  applications.job_title,
  applications.status
FROM users
JOIN applications
  ON users.id = applications.user_id;
```

This demonstrates a relational join.

---

## Join applications and interviews

```sql
SELECT
  applications.company_name,
  applications.job_title,
  interviews.round_name,
  interviews.interview_date,
  interviews.status
FROM applications
JOIN interviews
  ON applications.id = interviews.application_id;
```

---

# 26. Common Database Problems

Understanding failures is part of being a developer.

---

## Problem 1 — MySQL is not running

Symptom:

```text
Connection refused
```

Possible cause:

```text
MySQL server is stopped.
```

The backend cannot connect until MySQL is available.

---

## Problem 2 — Wrong credentials

The backend configuration contains database credentials.

If they do not match the MySQL user:

```text
Authentication failed
```

---

## Problem 3 — Wrong database name

Backend:

```text
job_tracker
```

MySQL:

```text
another_database
```

The application will fail to find the expected tables.

---

## Problem 4 — Port conflict

MySQL commonly uses:

```text
3306
```

If another MySQL instance is already using that port, Docker may fail to start its MySQL container.

---

## Problem 5 — Missing table

If the database exists but tables do not:

```text
Table 'job_tracker.users' doesn't exist
```

The schema needs to be executed.

---

## Problem 6 — Foreign key failure

If you try to create an interview for an application ID that does not exist, the foreign key relationship can reject the operation.

Conceptually:

```text
application_id = 999
```

but:

```text
applications.id = 999
```

does not exist.

---

## Problem 7 — Duplicate email

Because:

```sql
email VARCHAR(150) NOT NULL UNIQUE
```

the database does not allow duplicate emails.

---

## Problem 8 — Invalid ENUM value

If a value outside the allowed set is supplied, it does not match the column's defined values.

For example, application status is limited to:

```text
applied
interviewing
offer
rejected
withdrawn
```

The backend should ideally validate such values before sending them to the database.

---

# 27. Important Concepts to Remember

If you are revising this project for an interview, understand these concepts first.

---

## 1. Relational database

Data is organized into related tables.

```text
users
applications
interviews
```

---

## 2. Primary key

Uniquely identifies a row.

```sql
PRIMARY KEY
```

---

## 3. Foreign key

Connects one table to another.

```sql
FOREIGN KEY
REFERENCES
```

---

## 4. One-to-many relationship

One user:

```text
many applications
```

One application:

```text
many interviews
```

---

## 5. Cascade deletion

```sql
ON DELETE CASCADE
```

Automatically removes dependent child records.

---

## 6. Constraints

Examples:

```text
PRIMARY KEY
NOT NULL
UNIQUE
DEFAULT
FOREIGN KEY
```

---

## 7. ENUM

Restricts a column to defined values.

---

## 8. Indexes

Improve lookup performance for suitable queries.

---

## 9. Parameterized queries

Use:

```sql
WHERE id = ?
```

instead of concatenating raw user input into SQL.

---

## 10. Connection pooling

Allows the backend to reuse database connections efficiently.

---

# 28. Interview Revision

This section is intentionally short.

If you can explain these questions clearly, you understand the important database concepts used by this project.

---

## Q1. Which database does the project use?

**Answer:**

> MySQL 8, using a relational schema with users, applications, and interviews tables.

---

## Q2. What is the relationship between users and applications?

**Answer:**

> One user can have many applications, so it is a one-to-many relationship.

---

## Q3. What is the relationship between applications and interviews?

**Answer:**

> One application can have multiple interview rounds, so it is also a one-to-many relationship.

---

## Q4. What is a primary key?

**Answer:**

> A primary key uniquely identifies each row in a table.

---

## Q5. What is a foreign key?

**Answer:**

> A foreign key references a key in another table and is used to maintain relationships and referential integrity.

---

## Q6. Why is `user_id` present in applications?

**Answer:**

> It identifies which user owns the application and allows the backend to retrieve and enforce access to that user's applications.

---

## Q7. Why is `application_id` present in interviews?

**Answer:**

> It identifies the application to which an interview round belongs.

---

## Q8. Why use `ON DELETE CASCADE`?

**Answer:**

> It automatically removes dependent child records when their parent record is deleted, preventing orphaned records.

---

## Q9. Why is email unique?

**Answer:**

> Email is used as a unique login identifier, so duplicate accounts with the same email should not be allowed.

---

## Q10. Why store `password_hash` instead of `password`?

**Answer:**

> Passwords should not be stored as plaintext. The backend hashes the password and stores the resulting hash.

---

## Q11. Why use `ENUM`?

**Answer:**

> It is useful when a column has a small, predefined set of valid values, such as application or interview status.

---

## Q12. Why use indexes?

**Answer:**

> Indexes can improve query performance for frequently filtered or joined columns, although they also add storage and write-maintenance overhead.

---

## Q13. What is SQL injection?

**Answer:**

> SQL injection occurs when untrusted input changes the intended SQL query. Parameterized queries help prevent this.

---

## Q14. What is a connection pool?

**Answer:**

> A connection pool manages reusable database connections so the application does not need to create a new database connection for every request.

---

## Q15. What happens when an application is deleted?

**Answer:**

> Because the interviews table references applications with `ON DELETE CASCADE`, the application's related interviews are automatically deleted.

---

# 29. Future Improvements

The current schema supports the project's current functionality.

Possible future improvements could include:

---

## Stronger validation

The backend could explicitly validate:

- application status
- interview status
- interview mode
- dates
- URLs
- required strings

before executing SQL.

---

## More indexes

Indexes should only be added when query patterns justify them.

Possible future indexes would depend on actual application usage and performance measurements.

---

## Additional tables

If the project grows, separate tables could eventually be considered for concepts such as:

```text
companies
skills
job_sources
application_tags
```

However, these should only be introduced when the application actually needs them.

Do not add tables just to make the schema look more complex.

---

## Audit/history tables

A future version could track application status changes:

```text
Applied
   ↓
Interviewing
   ↓
Offer
```

with timestamps for each transition.

That would allow the application to answer questions such as:

```text
When did the application enter interviewing?
How long did it remain in each status?
```

This is not part of the current schema.

---

## Database migrations

As the application grows, a migration system can be introduced so schema changes can be versioned and applied consistently across environments.

The current `schema.sql` remains a straightforward way to initialize the project's database.

---

# 30. Final Mental Model

If you remember only one diagram from this README, remember this:

```text
                    ┌──────────────┐
                    │    USERS     │
                    ├──────────────┤
                    │ id           │
                    │ name         │
                    │ email        │
                    │ password_hash│
                    │ role         │
                    └──────┬───────┘
                           │
                           │ 1
                           │
                           │ N
                           ▼
                 ┌──────────────────┐
                 │   APPLICATIONS   │
                 ├──────────────────┤
                 │ id               │
                 │ user_id          │
                 │ company_name     │
                 │ job_title        │
                 │ job_link         │
                 │ status           │
                 │ applied_date     │
                 │ notes            │
                 └────────┬─────────┘
                          │
                          │ 1
                          │
                          │ N
                          ▼
                 ┌──────────────────┐
                 │    INTERVIEWS    │
                 ├──────────────────┤
                 │ id               │
                 │ application_id   │
                 │ round_name       │
                 │ interview_date   │
                 │ mode             │
                 │ status           │
                 │ notes            │
                 └──────────────────┘
```

The relationships are:

```text
users.id
   ↑
   |
applications.user_id
```

and:

```text
applications.id
   ↑
   |
interviews.application_id
```

With cascade deletion:

```text
Delete User
     ↓
Delete Applications
     ↓
Delete Interviews
```

---

# Teacher's Revision Checklist

Before saying that you understand this database, make sure you can explain these without looking at the README:

- [ ] What is a relational database?
- [ ] Why are there three tables?
- [ ] What is a primary key?
- [ ] What is a foreign key?
- [ ] What is a one-to-many relationship?
- [ ] Why does `applications` contain `user_id`?
- [ ] Why does `interviews` contain `application_id`?
- [ ] What does `ON DELETE CASCADE` do?
- [ ] What does `NOT NULL` do?
- [ ] What does `UNIQUE` do?
- [ ] What does `DEFAULT` do?
- [ ] Why is the password stored as a hash?
- [ ] Why use `ENUM`?
- [ ] Difference between `DATE`, `DATETIME`, and `TIMESTAMP`
- [ ] What is an index?
- [ ] Why are these three indexes present?
- [ ] What is SQL injection?
- [ ] Why use parameterized queries?
- [ ] What is a connection pool?
- [ ] How does the backend retrieve only a user's applications?
- [ ] What happens when an application is deleted?
- [ ] What happens when a user is deleted?

---

# One-Minute Interview Explanation

If an interviewer asks:

> **"Explain the database design of your Job Application Tracker."**

A strong answer would be:

> "I used MySQL with three main tables: users, applications, and interviews. Users have a one-to-many relationship with applications, and applications have a one-to-many relationship with interviews. Each table has an auto-increment primary key. Applications reference users through `user_id`, and interviews reference applications through `application_id`. I used foreign keys with `ON DELETE CASCADE` so dependent records are cleaned up automatically. I also used ENUMs for controlled values such as application status, interview status, and interview mode. Indexes were added on frequently queried relationship and filtering columns such as `user_id`, `status`, and `application_id`. The backend uses parameterized SQL queries and a connection pool to communicate with MySQL."

That answer demonstrates that you understand the design rather than simply memorizing the schema.

---

# Final Rule

Do not try to memorize every SQL statement.

Understand this chain:

```text
Requirement
    ↓
Database design
    ↓
Tables
    ↓
Columns
    ↓
Primary keys
    ↓
Foreign keys
    ↓
Relationships
    ↓
Constraints
    ↓
Indexes
    ↓
Backend queries
    ↓
Application behavior
```

That is how you should learn the database as a software developer.

---

**Project:** Job Application Tracker  
**Database:** MySQL 8  
**Schema file:** `database/schema.sql`  
**Documentation purpose:** Project reference + developer learning + interview revision
