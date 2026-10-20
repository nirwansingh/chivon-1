# Deployment Guide

This guide explains how to run the Chivon Mechanical CRM & ERP with an online backend on free tiers.

## Architecture
- **Database:** PostgreSQL on **Supabase** (free tier).
- **API:** Express app in `backend/` on **Render** (free web service), defined in `render.yaml`.
- **Frontend:** Next.js app in `frontend/` (local for now; Netlify/Vercel later — see §5).
- **File Storage:** Supabase Storage.

## 1. Supabase (database)
1. Create a project at https://supabase.com (pick the region closest to UAE, e.g. Mumbai `ap-south-1`). Save the DB password.
2. Click **Connect** (top bar) → **Connection string** → **URI** → choose **Session pooler** (port `5432`, host `aws-0-<region>.pooler.supabase.com`, user `postgres.<project-ref>`).
   - Use the **Session pooler**, not the direct host `db.<ref>.supabase.co`: the direct host is IPv6-only and Render cannot reach it.
3. Put it in the repo-root `.env` (replace `[YOUR-PASSWORD]`; URL-encode special characters such as `@` → `%40`):
   ```env
   DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
   ```
4. Apply the schema and (optionally) seed:
   ```bash
   npm run db:deploy --prefix backend   # prisma migrate deploy
   npm run db:seed                      # dev/demo data — see warning below
   ```

> [!WARNING]
> The dev seed creates demo users with the password `password123`. Once the API is public, anyone who knows these emails can log in. Change the passwords (or deactivate the demo users) before sharing the URL, and finish Phase 21A (real auth) before real business data goes in.

## 2. Render (API)
1. Push the repo to GitHub (GitHub Desktop).
2. At https://dashboard.render.com → **New → Blueprint** → select the repo. Render reads `render.yaml`.
3. Fill the secret env vars when prompted:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Same Supabase Session-pooler URI as above |
   | `AUTH_SECRET` | **Exactly** the same value as in your local `.env` (frontend and API share it) |
   | `FRONTEND_ORIGIN` | `http://localhost:3000` (add the production frontend URL later, comma-separated) |
4. Deploy. The build runs `npm ci && npx prisma migrate deploy`; start runs `npm start`.
5. Check `https://<service>.onrender.com/api/health` returns 200.

## 3. Point the frontend at the online API
In the repo-root `.env`:
```env
API_URL="https://<service>.onrender.com"
```
Restart `npm run dev`. You no longer need local PostgreSQL or `npm run dev:api`.

## 4. Free-tier limits
- **Render free** sleeps after ~15 min idle; the first request after that takes ~30–60 s. 750 instance-hours/month.
- **Supabase free** pauses after 7 days of inactivity (restore from the dashboard); 500 MB DB; no automatic backups — take manual `pg_dump` backups.

## 5. Frontend hosting (later)
Deploy `frontend/` to Netlify/Vercel with `API_URL`, `AUTH_SECRET`, `AUTH_URL`, `DEV_USER_SWITCH=false`, then add that URL to Render's `FRONTEND_ORIGIN`.

## 6. Domain Configuration
Point your custom domain (e.g., `crm.chivonmechanical.com`) to your hosting provider via DNS (A/CNAME records). Ensure SSL/TLS is enabled.

## Security Considerations
- `DEV_USER_SWITCH` is `false` on Render (set in `render.yaml`). Keep it `false` in any public deployment.
- Do not expose `STORAGE_SECRET` or `DATABASE_URL` to the client side; never commit `.env`.
- Do not run the dev seed against a database holding real data.
