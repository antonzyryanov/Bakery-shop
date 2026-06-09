# Bakery Shop Server

## Setup

1. Copy `.env.example` to `.env` and fill DB credentials.
2. Ensure MySQL database is created with `../database/init.sql`.
3. Install dependencies:

```powershell
cd .\server
npm install
```

4. Run:

```powershell
npm run dev
```

Server starts on `http://localhost:4000` by default.

## Security Included

- Helmet headers
- Morgan logging
- Rate limiting + slowdown (basic DDoS mitigation)
- CSRF protection (`csurf`)
- Cookie-based JWT auth
- Input validation (`express-validator`)
- Role-based authorization for admin routes
- Redis-backed caching for product list endpoint
