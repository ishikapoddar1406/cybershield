# CyberShield — Production Deployment Guide

This guide details how to deploy **CyberShield** to cloud platforms (Render, Railway, Fly.io, or VPS) directly from your GitHub repository:
`https://github.com/ishikapoddar1406/cybershield`

---

## 1. Prerequisites on GitHub

1. Open your browser and log into GitHub: [https://github.com/new](https://github.com/new)
2. Create a new repository named:
   - **Repository name:** `cybershield`
   - **Visibility:** Public (or Private)
   - **Do NOT check:** "Initialize with a README" or ".gitignore" (these are already configured)
3. Click **Create repository**.

---

## 2. Uploading Files to Your GitHub Repository

From your terminal in `C:\Users\ishika poddar\.gemini\antigravity-ide\scratch\cybershield`:

```bash
# Push the main branch to your GitHub repository
git push -u origin main
```

*(If prompted for GitHub credentials, sign in via browser or supply your GitHub Personal Access Token).*

---

## 3. Option A: Deploy to Render.com (Recommended Free Tier)

Render can build and run both the React frontend and Node backend together:

1. Sign up / Log in to [Render.com](https://render.com/).
2. Click **New +** &rarr; **Blueprint** (or **Web Service**).
3. Connect your GitHub repository: `ishikapoddar1406/cybershield`.
4. Render automatically reads `render.yaml` with the following configuration:
   - **Build Command:** `npm run install:all && npm run build`
   - **Start Command:** `node server/src/db/seed.js && node server/src/server.js`
   - **Environment Variables:**
     - `NODE_ENV`: `production`
     - `PORT`: `5000`
     - `SESSION_SECRET`: *(Auto-generated secure random string)*
     - `CSRF_SECRET`: *(Auto-generated secure random string)*
5. Click **Apply / Deploy**.
6. Once deployed, Render provides a public URL (e.g. `https://cybershield-platform.onrender.com`).

---

## 4. Option B: Deploy to Railway.app

1. Log in to [Railway.app](https://railway.app/).
2. Click **New Project** &rarr; **Deploy from GitHub repo**.
3. Select `ishikapoddar1406/cybershield`.
4. Railway automatically detects the root `Dockerfile`.
5. Add these environment variables under the **Variables** tab:
   - `SESSION_SECRET`: `super_secret_session_key_production_2026`
   - `CSRF_SECRET`: `super_secret_csrf_salt_production_2026`
6. Click **Generate Domain** under Settings to obtain your live URL.

---

## 5. Option C: Run Locally via Docker

To verify the production build container locally on any machine with Docker:

```bash
# Build production Docker container
docker build -t cybershield:latest .

# Run container on port 5000
docker run -p 5000:5000 --name cybershield-app cybershield:latest
```

Open: `http://localhost:5000`
