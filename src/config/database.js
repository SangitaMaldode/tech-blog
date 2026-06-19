/**
 * database.js
 * Sets up the SQLite database connection, creates tables,
 * and seeds a default admin user + sample posts on first run.
 */

const Database = require('better-sqlite3');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const fs       = require('fs');

// ─── Resolve database file path from .env ────────────────────────────────────
const dbPath = path.resolve(process.env.DATABASE_PATH || './data/blog.db');

// Create the directory if it does not exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Open (or create) the SQLite database file
const db = new Database(dbPath);

// WAL mode = faster reads & writes for concurrent access
db.pragma('journal_mode = WAL');

// ─── Create Tables ────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    username   TEXT     NOT NULL UNIQUE,
    email      TEXT     NOT NULL UNIQUE,
    password   TEXT     NOT NULL,
    role       TEXT     NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id         INTEGER  PRIMARY KEY AUTOINCREMENT,
    title      TEXT     NOT NULL,
    slug       TEXT     NOT NULL UNIQUE,
    excerpt    TEXT,
    content    TEXT     NOT NULL,
    category   TEXT     DEFAULT 'General',
    tags       TEXT     DEFAULT '',
    status     TEXT     NOT NULL DEFAULT 'draft',
    author_id  INTEGER  NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
  );
`);

// ─── Seed Admin User (only on first run) ─────────────────────────────────────
const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();

if (!adminExists) {
  const hashedPassword = bcrypt.hashSync(
    process.env.ADMIN_PASSWORD || 'Admin@123',
    10  // salt rounds — higher = more secure but slower
  );

  db.prepare(`
    INSERT INTO users (username, email, password, role)
    VALUES (?, ?, ?, 'admin')
  `).run(
    process.env.ADMIN_USERNAME || 'admin',
    process.env.ADMIN_EMAIL    || 'admin@techblog.com',
    hashedPassword
  );

  console.log('✅ Default admin user created');
  console.log(`   Username : ${process.env.ADMIN_USERNAME || 'admin'}`);
  console.log(`   Password : ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
}

// ─── Seed Default Regular User (only on first run) ───────────────────────────
const userExists = db.prepare("SELECT id FROM users WHERE role = 'user'").get();

if (!userExists) {
  const hashedPassword = bcrypt.hashSync(
    process.env.USER_PASSWORD || 'User@123',
    10
  );

  db.prepare(`
    INSERT INTO users (username, email, password, role)
    VALUES (?, ?, ?, 'user')
  `).run(
    process.env.USER_USERNAME || 'user',
    process.env.USER_EMAIL    || 'user@techblog.com',
    hashedPassword
  );

  console.log('✅ Default user account created');
  console.log(`   Username : ${process.env.USER_USERNAME || 'user'}`);
  console.log(`   Password : ${process.env.USER_PASSWORD || 'User@123'}`);
}

// ─── Seed Sample Posts (only on first run) ───────────────────────────────────
const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get();

if (postCount.count === 0) {
  const admin = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();

  const samplePosts = [
    {
      title    : 'Getting Started with Docker',
      slug     : 'getting-started-with-docker',
      excerpt  : 'Learn the fundamentals of Docker containerization and how it simplifies your development workflow.',
      content  : `## What is Docker?\n\nDocker is a platform for developing, shipping, and running applications inside **containers**. A container bundles your app with all its dependencies so it runs identically on any machine.\n\n## Why Use Docker?\n\n- **Consistency** — works the same on every machine\n- **Isolation** — each app runs in its own environment\n- **Speed** — containers start in seconds\n\n## Basic Commands\n\n\`\`\`bash\n# Pull an image from Docker Hub\ndocker pull node:20-alpine\n\n# Run a container\ndocker run -p 3000:3000 my-app\n\n# List running containers\ndocker ps\n\n# Stop a container\ndocker stop <container-id>\n\`\`\`\n\n## Writing a Dockerfile\n\n\`\`\`dockerfile\nFROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nEXPOSE 3000\nCMD ["node", "src/app.js"]\n\`\`\`\n\nThis is just the beginning of your Docker journey!`,
      category : 'Docker',
      tags     : 'docker,containers,devops',
      status   : 'published'
    },
    {
      title    : 'CI/CD Pipeline with Jenkins',
      slug     : 'cicd-pipeline-with-jenkins',
      excerpt  : 'A complete guide to setting up a CI/CD pipeline using Jenkins for automated testing and deployment.',
      content  : `## What is CI/CD?\n\n**Continuous Integration (CI)** means developers merge code frequently and every merge triggers automated tests.\n\n**Continuous Deployment (CD)** means passing code is automatically deployed to production.\n\n## What is Jenkins?\n\nJenkins is an open-source automation server. It watches your repository and runs a **pipeline** every time you push code.\n\n## Pipeline Stages\n\n1. **Checkout** — Pull code from Git\n2. **Install** — Install dependencies\n3. **Test** — Run automated tests\n4. **Build** — Build Docker image\n5. **Deploy** — Push and run in target environment\n\n## Sample Jenkinsfile\n\n\`\`\`groovy\npipeline {\n    agent any\n    stages {\n        stage('Install') {\n            steps { sh 'npm ci' }\n        }\n        stage('Test') {\n            steps { sh 'npm test' }\n        }\n        stage('Build') {\n            steps { sh 'docker build -t my-app .' }\n        }\n    }\n}\n\`\`\`\n\nJenkins makes releases boring — and that's a good thing!`,
      category : 'DevOps',
      tags     : 'jenkins,cicd,automation',
      status   : 'published'
    },
    {
      title    : 'Introduction to Kubernetes',
      slug     : 'introduction-to-kubernetes',
      excerpt  : 'Understand core Kubernetes concepts and how it orchestrates containerized applications at scale.',
      content  : `## What is Kubernetes?\n\nKubernetes (K8s) automates deploying, scaling, and managing containerized applications. Think of it as a **container orchestrator** — it decides where containers run and keeps them healthy.\n\n## Core Concepts\n\n### Pod\nThe smallest deployable unit. A Pod wraps one or more containers that share network and storage.\n\n### Deployment\nTells Kubernetes: "I want 3 replicas of this app always running." If one crashes, K8s starts a new one automatically.\n\n### Service\nExposes Pods to network traffic with a stable address, even as Pods come and go.\n\n## Example Deployment YAML\n\n\`\`\`yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: tech-blog\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: tech-blog\n  template:\n    metadata:\n      labels:\n        app: tech-blog\n    spec:\n      containers:\n      - name: tech-blog\n        image: tech-blog:latest\n        ports:\n        - containerPort: 3000\n\`\`\`\n\nKubernetes handles the rest — scheduling, health checks, rolling updates.`,
      category : 'Kubernetes',
      tags     : 'kubernetes,k8s,containers,devops',
      status   : 'published'
    }
  ];

  const insertPost = db.prepare(`
    INSERT INTO posts (title, slug, excerpt, content, category, tags, status, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  samplePosts.forEach(p => {
    insertPost.run(p.title, p.slug, p.excerpt, p.content, p.category, p.tags, p.status, admin.id);
  });

  console.log('✅ Sample blog posts created');
}

module.exports = db;
