# Bakery Shop Fullstack Service

Ingress-Nginx Server + Kubernetes with persistent volume + Docker minikube high available cluster with round-robin balancing which contains ReactJS SPA with Redux and Vite Web Frontend + React Native with Expo Mobile+ExpressJS Backend[ with MySQL 3NF Database] + Python Fast API Nutrition Tracker Service [with PostgreSQL 3NF Database]

Manual Tests videos show latest versions of service

Screenshots of web version show first versions of app

## Manual Tests videos

https://drive.google.com/drive/folders/1dsEt2c7almzm1bwLIdj7N55EChgjuDhk?usp=sharing

## Screenshots

<table>
 <tr>
  <td><img src="screenshots/screenshot_1.jpg" alt="Screenshot 1"></td>
  <td><img src="screenshots/screenshot_2.jpg" alt="Screenshot 2"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_3.jpg" alt="Screenshot 3"></td>
  <td><img src="screenshots/screenshot_4.jpg" alt="Screenshot 4"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_5.jpg" alt="Screenshot 5"></td>
  <td><img src="screenshots/screenshot_6.jpg" alt="Screenshot 6"></td>
 </tr>
    <tr>
  <td><img src="screenshots/screenshot_7.jpg" alt="Screenshot 7"></td>
  <td><img src="screenshots/screenshot_8.jpg" alt="Screenshot 8"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_9.jpg" alt="Screenshot 9"></td>
  <td><img src="screenshots/screenshot_10.jpg" alt="Screenshot 10"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_11.jpg" alt="Screenshot 11"></td>
  <td><img src="screenshots/screenshot_12.jpg" alt="Screenshot 12"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_13.jpg" alt="Screenshot 13"></td>
  <td><img src="screenshots/screenshot_14.jpg" alt="Screenshot 14"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_15.jpg" alt="Screenshot 15"></td>
  <td><img src="screenshots/screenshot_16.jpg" alt="Screenshot 16"></td>
 </tr>
</table>



Stack:
- MySQL (database)
- Node.js + Express (backend API)
- React + Redux + Vite (web SPA Frontend)
- React Native mobile Expo app

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

Metrics activity tables (3NF) are created automatically on backend startup via `database/add_metrics_tables.sql`, or can be applied manually:

```powershell
Get-Content "c:\bakery_shop\database\add_metrics_tables.sql" | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
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

## 4) Mobile (React Native / Expo)

```powershell
cd c:\bakery_shop\mobile
npm install
npm start
```

There is no admin UI on mobile. Orders placed from the app appear in web `/admin/orders`. Activity events are logged with `platform=MOBILE` and visible in web `/admin/metrics`.

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
- JWT auth with role-based authorization (cookie for web, Bearer token for mobile)
- Redis cache for product listing endpoint
- User activity metrics (3NF MySQL) shared by web and mobile

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
