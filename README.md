# Bakery Shop Fullstack App

Stack:
- MySQL (database)
- Node.js + Express (backend API)
- React + Redux + Vite (web SPA)
- React Native mobile app (planned)

## 1) Database

Schema and seed data are in `database/init.sql`.

Create dedicated app DB user (recommended):

1. Edit `database/create_app_user.sql` and change the default password.
2. Run it as MySQL root/admin:

```powershell
cd c:\bakery_shop
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < .\database\create_app_user.sql
```

Run (PowerShell example):

```powershell
cd c:\bakery_shop
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < .\database\init.sql
```

The script creates normalized tables (1NF/2NF/3NF), FK constraints, 30 bakery products, and product image URLs.

If your DB already exists and you only need image URLs, run migration:

```powershell
Get-Content "c:\bakery_shop\database\add_product_images.sql" | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

## 2) Backend

```powershell
cd c:\bakery_shop\server
copy .env.example .env
npm install
npm run dev
```

Run backend tests:

```powershell
cd c:\bakery_shop\server
npm test
```

## 3) Frontend

```powershell
cd c:\bakery_shop\client
npm install
npm run dev
```

Run frontend tests:

```powershell
cd c:\bakery_shop\client
npm test
```

Vite dev server runs at `http://localhost:5173` and proxies API requests to `http://localhost:4000`.

## Default Admin Login

- Email/Login: `Admin` via UI means use `admin@bakery.local`
- Password: `Ko1337Bra?`

The backend ensures this admin account exists at startup.

## Security Features Included

- Helmet
- CSRF protection
- Morgan logging
- Rate limiting + slowdown (DDoS mitigation baseline)
- Input validation for auth/admin/order requests
- JWT auth with role-based authorization
- Redis cache for product listing endpoint

## One-Command Bootstrap

Use this to initialize DB, install dependencies, and start both dev servers:

```powershell
cd c:\bakery_shop
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1 -MySqlUser root
```

Optional arguments:

- `-MySqlUser` for DB user
- `-MySqlExePath` if `mysql.exe` is not auto-detected
- `-SkipDbInit` to avoid re-running `database/init.sql`
- `-SkipInstall` to avoid reinstalling npm dependencies

## Daily Start (Recommended)

For normal day-to-day work, do not re-run DB init. Use:

```powershell
cd c:\bakery_shop
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
```

Why: `database/init.sql` drops and recreates tables, so running bootstrap without `-SkipDbInit` will reset data.
