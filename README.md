# HackShastra Backend API

Backend service for the HackShastra community website built using **Node.js (ES Modules)**, **Express.js**, and **PostgreSQL (Supabase Direct Driver)**.

---

## Technical Stack & Architecture

- **Runtime & Framework:** Node.js (v18+) with Express.js (ESM `import`/`export`)
- **Database:** PostgreSQL (via `pg` direct connection pool, Prisma bypassed)
- **Authentication:** Firebase Admin SDK (Google OAuth ID Token verification) & JWT session tokens
- **Authorization:** Two-role access control (`ADMIN` vs `MEMBER`)
- **Storage:** Cloudflare Images direct upload URLs & metadata registration
- **Email Dispatch:** Nodemailer SMTP with HTML email templates and JSON stream fallback
- **Security:** `express-rate-limit`, Helmet HTTP headers, CORS origin restrictions, 10KB body size limits
- **Testing:** `supertest` integration suite and 10 req/s concurrency load testing

---

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure required environment variables in `.env`:
   - `DATABASE_URL`: PostgreSQL connection string (Supabase / local DB)
   - `JWT_SECRET`: Secret key for session token signing
   - `SMTP_*`: SMTP host, credentials, and sender configuration
   - `CLOUDFLARE_*`: Cloudflare Images API credentials
   - `FIREBASE_*`: Firebase Admin SDK credentials and `INITIAL_ADMIN_EMAILS`

---

## Database Initialization

Run the centralized SQL schema runner to initialize tables, unique constraints, foreign keys, and indexes:

```bash
npm run db:init
```

---

## Available NPM Scripts

- **`npm start`**: Runs production server (`node src/server.js`)
- **`npm run dev`**: Runs development server with live reload (`nodemon src/server.js`)
- **`npm run db:init`**: Executes database relational schema (`src/db/schema.sql`)
- **`npm test`**: Runs automated integration test suite & concurrency load test (`node tests/api.test.js && node tests/concurrency.test.js`)

---

## Key API Routes

### Public Endpoints
- `GET /api/health` — System health check
- `GET /api/events` — Published events list
- `GET /api/events/:slug` — Single event details by slug
- `POST /api/events/:eventId/register` — Event registration submission
- `GET /api/registrations/verify/:token` — Email verification link handler
- `GET /api/blogs` — Published blogs list
- `GET /api/blogs/:slug` — Single blog post details
- `GET /api/projects` — Approved community showcase projects
- `POST /api/projects` — Submit community project for review
- `POST /api/contact` — Visitor contact request submission
- `GET /api/content/:key` — Public site content section lookup

### Authentication Endpoints
- `POST /api/auth/google` — Authenticate via Firebase Google OAuth ID Token
- `GET /api/auth/me` — Authenticated profile lookup
- `POST /api/auth/logout` — Logout session

### Image Management (Authenticated Admin)
- `POST /api/images/upload-url` — Generate Cloudflare Images direct upload URL session
- `POST /api/images` — Register image metadata
- `DELETE /api/images/:id` — Delete image and purge CDN cache

### Admin CMS Endpoints (Protected: `ADMIN` Role)
- `GET/POST/PUT/DELETE /api/admin/events` — Admin event management & registration viewing
- `GET/POST/PUT/DELETE /api/admin/blogs` — Admin blog management
- `GET/PUT/DELETE /api/admin/projects` — Project moderation & approval
- `GET/PUT /api/admin/contact` — Contact requests tracking & resolution
- `GET/PUT /api/admin/content` — No-code site content section key-value editor

---

## License

ISC License — HackShastra Community
