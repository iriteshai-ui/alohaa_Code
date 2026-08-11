# Hostinger PostgreSQL & Node.js Deployment Guide

This guide provides step-by-step instructions for deploying the **OptimaGodown** application to Hostinger using PostgreSQL and Node.js.

---

## 1. Prerequisites on Hostinger

1. **Node.js**: Ensure Node.js (version 20 or 22) is selected in the Hostinger Node.js Web App settings.
2. **PostgreSQL Database**: Provision a PostgreSQL database via Hostinger Database Manager (or external PostgreSQL instance like Supabase / ElephantSQL / AWS RDS).

---

## 2. Step 1: Provision Supabase PostgreSQL Database

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project or select an existing project.
3. Go to **Project Settings** → **Database** → **Connection String**.
4. Copy the connection string:
   - **Transaction Pooler** (Recommended for serverless/cloud Node apps): Port `6543`
     `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - **Session Pooler / Direct Connection**: Port `5432`
     `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

---

## 3. Step 2: Configure Environment Variables

In your Hostinger Application settings (or via `.env` file on the server), configure the following environment variables:

```env
# Supabase PostgreSQL Connection String
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Enable SSL for Supabase (Auto detected for *.supabase.co / *.supabase.com)
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# Production Security Secrets
SESSION_SECRET=create-a-secure-random-64-char-string-here
NODE_ENV=production
PORT=8080
COOKIE_SECURE=true
```

> [!IMPORTANT]
> - Never commit `.env` or real passwords to Git repository. `.env` is listed in `.gitignore`.
> - Always use a strong random string for `SESSION_SECRET`.

---

## 4. Step 3: Deployment, Migration & Seed Commands

Execute the following commands on the server terminal (via Hostinger SSH or build pipeline):

```bash
# 1. Install Workspace Dependencies
npm install # or pnpm install --frozen-lockfile

# 2. Run Database Migration to create tables, indexes, constraints, keys, sequences on Supabase
npm run migrate # or pnpm run migrate

# 3. Seed Default Admin User & Sample Products (Resets sequences automatically)
npm run seed # or pnpm run seed

# 4. (Optional) Transfer existing local database data to Supabase while preserving IDs
LOCAL_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_masters npm run db:migrate-data

# 5. Build Production Frontend & Backend Bundles
npm run build # or pnpm run build
```

---

## 5. Step 4: Configure Node.js Web App Start Command

In Hostinger hPanel → **Node.js Web App**:

- **Application Root**: `/`
- **Application Startup File**: `artifacts/api-server/dist/index.mjs`
- **Node Version**: `20.x` or `22.x`

Click **Save** and **Restart Application**.

---

## 6. Security & Architecture Checklist

- [x] **Backend Only Access**: The PostgreSQL database is queried exclusively by `@workspace/api-server` via server-side connection pool. The React frontend SPA never connects directly to PostgreSQL.
- [x] **Parameterized Queries & ORM**: All database queries use Drizzle ORM parameterized queries to prevent SQL injection.
- [x] **Bcrypt Hashing**: User passwords are securely hashed using bcrypt (`salt rounds = 10`). Plaintext passwords are never stored or logged.
- [x] **Environment Separation**: Local development uses local `.env` or Docker PostgreSQL; Hostinger production uses Hostinger `.env` environment variables.

---

## 7. Troubleshooting Build & Install Issues

### `[ERR_PNPM_IGNORED_BUILDS]` on Hostinger / CI
If Hostinger throws `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.27.3`, `.npmrc` and `package.json` have been updated with `onlyBuiltDependencies`.

If running commands via SSH on Hostinger:
```bash
pnpm approve-builds --all
# OR
pnpm install --no-frozen-lockfile
```
