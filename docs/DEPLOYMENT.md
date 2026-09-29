# Deployment Guide

This guide explains how to deploy the Chivon Mechanical CRM & ERP to production.

## Architecture
- **Frontend / API:** Next.js deployed on Netlify (or Vercel).
- **Database:** PostgreSQL hosted on Supabase.
- **File Storage:** S3-compatible storage via Supabase Storage.

## 1. Supabase Setup
1. Create a new Supabase Project.
2. Obtain your `DATABASE_URL` from the database settings. **Make sure to use the connection pooling URL (Transaction mode) if deploying to a serverless environment like Vercel/Netlify.**
3. Navigate to Storage and create a new public bucket (e.g., `chivon-documents`).
4. Obtain your Project URL and Anon/Service Role keys.

## 2. Environment Variables
In your hosting provider (Netlify/Vercel), configure the following environment variables:

```env
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
AUTH_SECRET="<generate-with-openssl-rand-base64-32>"
AUTH_URL="https://crm.chivonmechanical.com" # Your production domain
STORAGE_URL="https://<your-project>.supabase.co"
STORAGE_KEY="<your-supabase-anon-key>"
STORAGE_SECRET="<your-supabase-service-role-key>"
DEV_USER_SWITCH="false" # Must be false in production
```

## 3. Database Migration & Seeding
Do **not** run the development seed (`npm run db:seed`) in production, as it generates fake customers, invoices, and test users with dummy passwords.

1. Run migrations against the production database:
   ```bash
   npx prisma migrate deploy
   ```
2. Manually insert the required base data (Roles, Permissions, CompanySettings). You can write a custom `prod-seed.ts` script or use `npx prisma studio` connected to the production DB.
3. Create your initial `SUPER_ADMIN` user manually in the database with a securely hashed password.

## 4. Next.js Deployment
Deploy the repository to Netlify:
1. Connect your GitHub repository to Netlify.
2. Build command: `npm run build` (or `next build`)
3. Publish directory: `.next`
4. Ensure all environment variables are populated.

## 5. Domain Configuration
Point your custom domain (e.g., `crm.chivonmechanical.com`) to your hosting provider via DNS (A/CNAME records). Ensure SSL/TLS is enabled.

## Security Considerations
- Ensure `DEV_USER_SWITCH` is completely disabled.
- Do not expose the `STORAGE_SECRET` to the client side.
- Supabase Free Tier projects pause after 1 week of inactivity. If this is for production, ensure you are on a paid tier or implement a keep-alive strategy.
