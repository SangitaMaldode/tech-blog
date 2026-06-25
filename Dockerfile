# ─────────────────────────────────────────────────────────────────
# Dockerfile for TechBlog — Node.js + SQLite application
# ─────────────────────────────────────────────────────────────────
#
# Build:   docker build -t sangitamaldode/tech-blog:1.1 .
# Run:     docker run -p 30001:30001 --env-file .env sangitamaldode/tech-blog:1.1
# ─────────────────────────────────────────────────────────────────

# STEP 1 — Use official Node.js LTS image (Alpine = tiny size ~50MB)
FROM node:20-alpine

# STEP 2 — Set the working directory inside the container
WORKDIR /app

# STEP 3 — Copy ONLY package files first.
# Docker caches this layer, so dependencies are re-installed
# only when package.json actually changes (faster rebuilds).
COPY package*.json ./

# STEP 4 — Install production dependencies only (no devDependencies)
RUN npm ci --omit=dev

# STEP 5 — Create the data directory for the SQLite database file
RUN mkdir -p /app/data

# STEP 6 — Copy the rest of the application source code
COPY . .

# STEP 7 — Run as a non-root user for better security.
# The node:alpine image already includes a 'node' user.
RUN chown -R node:node /app
USER node

# STEP 8 — Tell Docker which port the app uses
EXPOSE 30001

# STEP 9 — Set Node environment to production
ENV NODE_ENV=production

# STEP 10 — Start the application
CMD ["node", "src/app.js"]
