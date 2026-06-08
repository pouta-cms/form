# Pouta Forms

A dynamic, high-performance, open-source Typeform alternative running entirely on the Cloudflare Edge network. Built with pure Cloudflare Workers (ES modules syntax), KV, D1, and the Workers Analytics Engine.

## Features

- **Dynamic Form Schemas**: Fetched instantly from Cloudflare KV (`FORM_SCHEMAS`) on public GET requests with zero cold starts.
- **Single-Table Submission Upserts**: Partial saves (checkpoints) and completed submissions reside in the exact same D1 SQL table (`submissions`), indexed on `(form_id, status)` to preserve query performance.
- **Submission Locking**: Completed submissions are locked and cannot be overwritten or altered.
- **High-Volume Telemetry**: Tracks form views (`viewed`) and initial engagements (`started`) via non-blocking, fire-and-forget Workers Analytics Engine data points.
- **Google OAuth Login**: Secure admin auth flow issuing stateless, cryptographically signed JWT sessions via Web Crypto APIs (stored as HTTP-only cookies).
- **Spam Protection**: Optional, configuration-backed verification hooks against Cloudflare Turnstile endpoints.

---

## Getting Started

### 1. Installation

Install dependencies:
```bash
npm install
```

### 2. Database Migrations

Initialize the local D1 database schema:
```bash
npx wrangler d1 execute DB --local --file=schema.sql
```

### 3. Generate TypeScript Bindings

Generate TypeScript types for all KV, D1, and Analytics bindings:
```bash
npx wrangler types
```

### 4. Running Locally

Create a `.dev.vars` file in the root directory with the following variables:
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
JWT_SECRET="your-jwt-signing-secret"
ALLOWED_ADMIN_EMAILS="admin@example.com,another@example.com"
# Optional Turnstile site verification secret
TURNSTILE_SECRET_KEY="your-turnstile-secret-key"
```

Start the local Wrangler development server:
```bash
npm run dev
```

---

## Google OAuth Client Configuration

To enable admin authentication, you must configure a Google OAuth 2.0 Client:

1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Create or select your Google Cloud project.
3. Click **Create Credentials** and select **OAuth client ID**.
4. Set the **Application type** to **Web application**.
5. Configure the OAuth origins and redirect URIs:
   - **Authorized JavaScript origins**:
     - `http://localhost:8787` (for local development)
     - `https://your-worker-name.your-subdomain.workers.dev` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:8787/admin/oauth/callback` (for local development)
     - `https://your-worker-name.your-subdomain.workers.dev/admin/oauth/callback` (for production)
6. Click **Create** to obtain your `Client ID` and `Client Secret`.
7. Configure these secrets in your environments:
   - **Locally**: Place them in your `.dev.vars` file.
   - **Production**: Set them as encrypted secrets on Cloudflare using Wrangler:
     ```bash
     npx wrangler secret put GOOGLE_CLIENT_ID
     npx wrangler secret put GOOGLE_CLIENT_SECRET
     npx wrangler secret put JWT_SECRET
     # For live Analytics Engine statistics:
     npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
     npx wrangler secret put CLOUDFLARE_API_TOKEN
     ```

> [!NOTE]
> To transition from mocked analytics to live analytics in the admin dashboard, you must define `CLOUDFLARE_ACCOUNT_ID` (your Cloudflare account identifier) and `CLOUDFLARE_API_TOKEN` (an API token with `Account Analytics: Read` permission) in your production secrets. Without these, the dashboard falls back to mocked view counts.

---

## Directory Layout

- `src/index.ts`: Application router, OAuth flow, telemetry, Turnstile validation, and D1 upsert logic.
- `src/types.ts`: TypeScript definition schemas for payloads, environment variables, and records.
- `schema.sql`: Database schema definition for Cloudflare D1.
- `wrangler.json`: Worker bindings and compatibility configuration.

For a deep dive into the inner workings, refer to [ARCHITECTURE.md](file:///Volumes/Backup/source/pouta-cms/form/ARCHITECTURE.md).
