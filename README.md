# Chivon Mechanical CRM & ERP

Internal CRM + Sales + Basic Finance + Documents application for Chivon Mechanical.

## Prerequisites
- **Node.js** >= 24.21.0
- **npm** >= 10.8.0
- **PostgreSQL** (Local or Remote)

## Setup and Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd chivon-1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your specific `DATABASE_URL` and Auth/Storage secrets.

4. **Configure Database (PostgreSQL):**
   Ensure your local PostgreSQL instance is running. The default `.env` assumes a local DB.

5. **Run Migrations:**
   Apply the database schema to your database:
   ```bash
   npm run db:migrate
   ```

6. **Seed the Database:**
   Seed the database with initial roles, permissions, settings, and demo data:
   ```bash
   npm run db:seed
   ```
   *Note: This creates a `SUPER_ADMIN` and other test users. Use these for development. For production, see the Deployment section.*

7. **Run the Application:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Testing
- **Unit & Integration:** `npm run test` (Vitest)
- **E2E:** `npm run e2e` (Playwright)

## Deployment

Deploying requires a Node.js hosting provider (like Netlify, Vercel) and a PostgreSQL database provider (like Supabase, AWS RDS).

1. **Production Database & Storage:** 
   Provision your production Postgres database and S3-compatible storage (e.g. Supabase). Update the production environment variables.
2. **Migrations:** Run `npx prisma migrate deploy` in the production environment.
3. **Seed Production Data:** You should only seed essential data (Settings, Roles, Permissions). Do not seed demo users or data in production.
4. **Create Admin User:** You can insert a primary Super Admin directly into the DB using Prisma Studio (`npx prisma studio`) or via a custom admin script.
5. **Configure Domain:** Point your domain (`crm.chivonmechanical.com`) to your hosting provider.

## Backup and Restore

### Backup
Use `pg_dump` to create a backup of your PostgreSQL database:
```bash
pg_dump -U <username> -h <host> -d <database_name> -F c -f backup.dump
```

### Restore
Use `pg_restore` to restore the backup:
```bash
pg_restore -U <username> -h <host> -d <database_name> -1 backup.dump
```
