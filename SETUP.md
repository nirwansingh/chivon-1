# Setup Instructions

These instructions are for setting up the Chivon Mechanical CRM/ERP on a fresh Windows or macOS machine.

## Prerequisites
1. **Node.js**: Install Node.js `v24.21.0` (as pinned in `.nvmrc`).
2. **Git**: Install Git for your platform.
3. **PostgreSQL**: Install PostgreSQL locally (do not use Docker). Ensure it is running on port `5432`.

## Step-by-Step Installation

1. **Clone the repository**:
   Pull the code from GitHub. (For ongoing work, always pull before starting, and remember only one person works at a time. Commits are made locally and pushed manually with GitHub Desktop).

2. **Create the Database**:
   Open your PostgreSQL tool (pgAdmin, psql, or similar) and create an empty database named `chivon_dev`.

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`.
   Update the `DATABASE_URL` in `.env` to match your local PostgreSQL credentials. For example:
   `DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/chivon_dev?schema=public"`
   Set `DEV_USER_SWITCH="true"` for easy dev user switching.

4. **Install Dependencies**:
   ```bash
   npm install
   ```

5. **Run Migrations**:
   ```bash
   npm run db:migrate
   ```

6. **Seed the Database**:
   ```bash
   npm run db:seed
   ```

7. **Start the Application**:
   ```bash
   npm run dev
   ```

8. **Login**:
   Open `http://localhost:3000` in your browser. You can use the "Quick login" buttons, or log in manually using one of the dev-only demo accounts:
   - **Super Admin**: super.admin@chivon.local
   - **Sales Manager**: sales.manager@chivon.local
   - **Sales Exec**: sales.exec@chivon.local
   - **Finance Manager**: finance.manager@chivon.local
   - **Accountant**: accountant@chivon.local
   - **Procurement**: procurement@chivon.local
   - **Viewer**: viewer@chivon.local
   - *Password for all*: `password123`
   
   > **Note**: These demo accounts are dev-only and must never be used in production.

## Troubleshooting

- **Wrong DB password**: Check the `DATABASE_URL` in your `.env` file and ensure the username and password match your PostgreSQL setup.
- **Port 5432 busy**: Ensure no other PostgreSQL instances or Docker containers are using port 5432. You can change the port in `DATABASE_URL` if you run PostgreSQL on a different port.
- **Migration errors**: If `npm run db:migrate` fails, ensure the `chivon_dev` database exists and your user has sufficient privileges.
- **Node version mismatch**: Ensure you are using exactly Node.js `v24.21.0`. Use `nvm` or `nvm-windows` to switch versions.
- **Prisma client not generated**: The postinstall script should generate the client. If it doesn't, manually run `npx prisma generate`.

## Git Workflow
Commits are made locally after every verified task. **NEVER run `git push` from the command line**. Push your local commits manually using GitHub Desktop before ending your session.
