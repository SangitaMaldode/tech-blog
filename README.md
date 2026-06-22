# TechBlog — Technical Blogging Platform

A full-stack technical blog application built with **Node.js**, **Express**, and **SQLite**.  
Supports two roles (Admin & Reader), Markdown posts, Docker containerization, and a Jenkins CI/CD pipeline.

---

## Features

- **Public Blog** — Landing page with all published posts, search, and category filter
- **Single Post View** — Markdown rendered to HTML with related posts
- **Role-Based Login** — Admin and Reader (User) roles with separate dashboards
- **Admin Dashboard** — Create, edit, delete, publish/draft posts with stats
- **User Dashboard** — Personalized reading view with search and category filter
- **Session Auth** — Secure sessions with bcrypt password hashing
- **SQLite Database** — Zero-config, file-based database, auto-seeded on first run
- **Docker Support** — Production-ready Dockerfile using Node.js Alpine image
- **Jenkins CI/CD** — 9-stage pipeline with manual production approval gate

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Runtime     | Node.js v20+                      |
| Framework   | Express.js v4                     |
| Database    | SQLite (via better-sqlite3)       |
| Templates   | EJS (Embedded JavaScript)         |
| Auth        | express-session + bcryptjs        |
| Markdown    | marked                            |
| Styling     | Bootstrap 5 + Custom CSS          |
| Container   | Docker (node:20-alpine)           |
| CI/CD       | Jenkins (Declarative Pipeline)    |

---

## Prerequisites

Make sure the following are installed before running the project:

| Tool        | Version   | Download                          |
|-------------|-----------|-----------------------------------|
| Node.js     | v18+      | https://nodejs.org                |
| npm         | v9+       | Comes with Node.js                |
| Git         | Any       | https://git-scm.com               |
| Docker      | v24+      | https://www.docker.com (optional) |
| Jenkins     | LTS       | https://www.jenkins.io (optional) |

---

## Project Structure

```
tech-blog/
├── src/
│   ├── app.js                    # Main entry point — Express setup
│   ├── config/
│   │   └── database.js           # SQLite connection + auto-seed
│   ├── routes/
│   │   ├── authRoutes.js         # /auth/login, /auth/logout
│   │   ├── blogRoutes.js         # / , /post/:slug  (public)
│   │   ├── userRoutes.js         # /dashboard       (any logged-in user)
│   │   └── adminRoutes.js        # /admin/*          (admin only)
│   ├── middleware/
│   │   └── authMiddleware.js     # isAuthenticated, isAdmin
│   └── views/
│       ├── partials/             # head, navbar, footer (shared)
│       ├── auth/
│       │   └── login.ejs         # Login page
│       ├── blog/
│       │   ├── home.ejs          # Public blog landing page
│       │   └── post.ejs          # Single post page
│       ├── user/
│       │   └── dashboard.ejs     # Reader dashboard
│       ├── admin/
│       │   ├── dashboard.ejs     # Admin dashboard with stats
│       │   ├── posts.ejs         # Manage all posts
│       │   ├── post-form.ejs     # Create / edit post form
│       │   └── sidebar.ejs       # Admin sidebar navigation
│       └── error.ejs             # 404 / error page
├── public/
│   ├── css/style.css             # Dark professional theme
│   └── js/main.js               # Client-side JS
├── data/                         # SQLite database file (auto-created)
├── .env                          # Environment variables (do not commit)
├── .env.example                  # Environment variable template
├── .gitignore                    # Files excluded from Git
├── .dockerignore                 # Files excluded from Docker build
├── .npmrc                        # npm config (do not commit)
├── Dockerfile                    # Docker image definition
├── Jenkinsfile                   # Jenkins CI/CD pipeline (9 stages)
├── package.json                  # Project metadata and dependencies
└── requirements.txt              # System and package requirements
```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd tech-blog
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the example file
copy .env.example .env       # Windows
cp .env.example .env         # Mac / Linux
```

Open `.env` and update values as needed:

```env
PORT=30001
NODE_ENV=development
SESSION_SECRET=change-this-to-a-long-random-string

DATABASE_PATH=./data/blog.db

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@techblog.com
ADMIN_PASSWORD=Admin@123

USER_USERNAME=user
USER_EMAIL=user@techblog.com
USER_PASSWORD=User@123
```

### 4. Run the Application

```bash
# Development (auto-restart on code changes)
npm run dev

# Production
npm start
```

---

## Running with Docker

### Build the Image

```bash
docker build -t tech-blog .
```

### Run the Container

```bash
docker run -d \
  --name tech-blog \
  -p 30001:30001 \
  --env-file .env \
  -v tech-blog-data:/app/data \
  tech-blog
```

### Stop the Container

```bash
docker stop tech-blog
docker rm tech-blog
```

---

## CI/CD with Jenkins

The `Jenkinsfile` defines a 9-stage pipeline:

| Stage | Description |
|-------|-------------|
| 1. Checkout | Pull latest code from Git |
| 2. Install | `npm ci` — install dependencies |
| 3. Lint & Test | Run tests and linting |
| 4. Build Image | `docker build` |
| 5. Security Scan | Trivy vulnerability scan |
| 6. Push to Registry | Push image to Docker Hub (main branch only) |
| 7. Deploy Staging | Deploy container on port 3001 |
| 8. Smoke Test | `curl` health check on staging |
| 9. Deploy Production | Manual approval gate → go live |

**Jenkins Credentials Required:**

| Credential ID | Type |
|---|---|
| `docker-registry-creds` | Username + Password (Docker Hub) |

---

## Access URLs

```
Blog (public)     →  http://localhost:30001
Login             →  http://localhost:30001/auth/login
User Dashboard    →  http://localhost:30001/dashboard
Admin Panel       →  http://localhost:30001/admin
```

---

## Default Accounts

| Role  | Username | Password  | Access |
|-------|----------|-----------|--------|
| Admin | `admin`  | `Admin@123` | Full CRUD + Admin Dashboard |
| User  | `user`   | `User@123`  | Read posts + User Dashboard |

> Change these in `.env` before deploying to production.

---

## Role-Based Access

| Route | No Login | User | Admin |
|-------|----------|------|-------|
| `/` (blog) | ✅ | ✅ | ✅ |
| `/post/:slug` | ✅ | ✅ | ✅ |
| `/auth/login` | ✅ | ✅ | ✅ |
| `/dashboard` | ❌ | ✅ | ✅ |
| `/admin` | ❌ | ❌ | ✅ |
| `/admin/posts/create` | ❌ | ❌ | ✅ |

---

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `SESSION_SECRET` | Secret key for session encryption | — |
| `DATABASE_PATH` | Path to SQLite database file | `./data/blog.db` |
| `ADMIN_USERNAME` | Default admin username | `admin` |
| `ADMIN_EMAIL` | Default admin email | `admin@techblog.com` |
| `ADMIN_PASSWORD` | Default admin password | `Admin@123` |
| `USER_USERNAME` | Default user username | `user` |
| `USER_EMAIL` | Default user email | `user@techblog.com` |
| `USER_PASSWORD` | Default user password | `User@123` |

---

## Files NOT Committed to Git

```
.env              # Contains passwords — never commit
.npmrc            # Machine-specific npm config
node_modules/     # Install with npm install
data/             # SQLite database (runtime data)
*.db              # Database files
```

---

## License

This project is for educational purpose and DevOps learning purposes.
