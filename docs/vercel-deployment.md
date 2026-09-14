# Deploying BhuvanGuard AI to Vercel

This guide explains how to deploy both the **FastAPI Backend** and the **React Vite Frontend** on Vercel.

---

## 1. Quick Deployment via Vercel Dashboard (Recommended)

Since the repository is already pushed to your GitHub:
👉 **`https://github.com/bhuvan1111/real-time-ai-interview-cheat-detection-system`**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..." ➔ "Project"**.
2. Select **`real-time-ai-interview-cheat-detection-system`** from your GitHub repositories and click **Import**.
3. In the project configuration:
   - **Framework Preset**: Other (automatically detected from `vercel.json`)
   - **Root Directory**: `./` (leave default)
4. Under **Environment Variables**, add:
   - `JWT_SECRET`: `super-secret-key-production-bhuvan-guard-2026`
   - `JWT_ALGORITHM`: `HS256`
   - `DATABASE_URL`: *(Optional)* If using remote PostgreSQL (such as [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com)), paste your connection string:
     `postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require`
     *(If omitted, the serverless function automatically falls back to an ephemeral SQLite database at `/tmp/cheat_detection.db`)*
5. Click **Deploy**.

Vercel will automatically:
- Build the React Vite frontend into `frontend/dist`
- Package the FastAPI application into serverless functions under `/api`
- Issue a live production URL (e.g., `https://real-time-ai-interview-cheat-detection-system.vercel.app`)

---

## 2. Deploying via Vercel CLI

You can also deploy directly from your command line:

```powershell
# 1. Authenticate with Vercel
vercel login

# 2. Deploy to Preview
vercel

# 3. Deploy to Production
vercel --prod
```

---

## 3. Architecture on Vercel

```
User Browser
   │
   ├── / (Web App) ────────► Vercel Edge Network (Vite Static HTML/JS/CSS)
   │
   └── /api/* (REST API) ──► Vercel Serverless Function (Python 3.12 / FastAPI)
                                ├── /api/auth (Login, Register, Me)
                                ├── /api/assessments (CRUD)
                                ├── /api/sessions (Start, Finish, Status)
                                ├── /api/events (Telemetry Ingestion)
                                ├── /api/submissions (Code Submission & Runner)
                                ├── /api/similarity (AST & Token Analysis)
                                └── /api/analytics (KPIs & Trends)
```

> **Important Note on WebSockets:**  
> Vercel Serverless Functions are stateless and terminate once an HTTP request completes, so persistent WebSocket connections (`/ws/*`) are not supported on Vercel.  
> The client monitoring engine in `useMonitoring.ts` is designed with an **automatic REST fallback**: if WebSockets are unavailable, all events (`TAB_SWITCH`, `WINDOW_BLUR`, `PASTE`, etc.) are seamlessly ingested via `POST /api/events`, and the evaluator dashboard continues to update via automatic polling.  
> If persistent WebSockets are strictly required for your deployment, you can deploy the `backend/` container on [Render](https://render.com) or [Railway](https://railway.app), and point `VITE_API_URL` to it.
