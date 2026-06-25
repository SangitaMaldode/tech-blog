# ─────────────────────────────────────────────────────────────────
# Dockerfile for TechBlog — Node.js + SQLite application
# ─────────────────────────────────────────────────────────────────
#
# Build:   docker build -t tech-blog .
# Run:     docker run -p 30001:30001 --env-file .env tech-blog
# ─────────────────────────────────────────────────────────────────

# STEP 1 — Use official Node.js LTS image (Alpine = tiny size ~50MB)
FROM node:20-alpine

# STEP 2 — Set the working directory inside the container
WORKDIR /app

# STEP 3 — Copy ONLY package files first.
# Docker caches this layer, so dependencies are only re-installed
# when package.json actually changes (makes rebuilds faster).
COPY package*.json ./

# STEP 4 — Install production dependencies only (no devDependencies)
RUN npm ci --only=production

# STEP 5 — Copy the rest of the application source code
COPY . .

# STEP 6 — Create the data directory for the SQLite database file
RUN mkdir -p /app/data

# STEP 7 — Tell Docker which port the app uses
EXPOSE 30001

# STEP 8 — Set Node environment to production
ENV NODE_ENV=production

# STEP 9 — Start the application
CMD ["node", "src/app.js"]
