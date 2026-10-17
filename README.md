# Nalanda College Science Society (NCSS) Web Platform

The official web portal for the Nalanda College Science Society (Colombo 10, Sri Lanka), featuring dynamic event management, annual science publications, competitive quiz platforms, school registration forms, and an administrative CMS.

---

## Architecture & Tech Stack

* **Framework:** Next.js 16.3.4 (App Router)
* **Frontend:** React 19, TypeScript 5, Tailwind CSS v4, Framer Motion
* **Database:** PostgreSQL on Neon Serverless (`@neondatabase/serverless`)
* **Storage:** Cloudflare R2 via AWS S3 SDK (`@aws-sdk/client-s3`)
* **Authentication:** Custom JWT sessions (`jose` HS256) with secure HTTP-only cookies
* **Rich Content:** KaTeX mathematical formula rendering, Prism code syntax highlighting, and jsPDF export engines

---

## Environment Configuration

Copy the example environment template:
```bash
cp .env.example .env
```

Ensure the following variables are configured in `.env` (or in your hosting provider's environment settings):

```env
# PostgreSQL Database Connection
DATABASE_URL="postgresql://user:password@ep-sample-pooler.region.aws.neon.tech/neondb?sslmode=require"

# JWT Secret for Admin Sessions (32+ character random string)
# Generate with: openssl rand -base64 32
JWT_SECRET="your-strong-random-jwt-secret-at-least-32-chars"

# Cloudflare R2 Storage Bucket
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
R2_BUCKET_NAME="ncss-site"
R2_PUBLIC_URL="https://pub-xxxxxx.r2.dev"
```

---

## Development

Install dependencies:
```bash
npm install
```

Start the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Quality Gates & Verification

Run TypeScript compilation check:
```bash
npx tsc --noEmit
```

Run ESLint analysis:
```bash
npm run lint
```

Build for production:
```bash
npm run build
```

---

## Production Deployment

### 1. Vercel (Recommended)
This repository includes a CI workflow in `.github/workflows/deploy.yml` that builds and deploys automatically on push to `main`:
1. Connect the repository in the Vercel dashboard.
2. Configure all environment variables in **Project Settings > Environment Variables**.
3. Deployments build with `npm run build` and serve via Next.js serverless functions.

### 2. Standalone Node.js Runner (cPanel / VPS)
For traditional hosting environments with Node.js support:
1. Run `npm run build`.
2. Start the production listener:
```bash
node app.js
```
The server binds to `process.env.PORT` (defaults to `3000`).

---

## Health Check & Monitoring

A dedicated health check endpoint is available at:
```http
GET /api/health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2026-10-17T22:50:00.000Z",
  "database": "connected",
  "latencyMs": 42,
  "uptimeSeconds": 1420
}
```
If the database connection is interrupted, the endpoint returns HTTP `503 Service Unavailable` with `"status": "degraded"`.
