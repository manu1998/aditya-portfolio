# Paste into Replit by hand. Do not start Replit Agent.

Live app: `https://loud-faint-section.replit.app` (LoudFaintSection).
Verified 22 Sep 2026 from Cursor: homepage 200, `/api/healthz` ok, `/api/subscribe` ok. `/api/unsubscribe` and `/api/internal/issue` are **not deployed yet** (404).

Copy files in the Replit editor. Do not prompt Agent.

## 1. Postgres

Paste `newsletter/backend/schema.sql` in the LoudFaintSection database console. It ALTERs the live `subscribers` table (serial id, `pending`/`active`) and adds `scout_issues` / `scout_deliveries`.

## 2. Secrets (Replit Secrets UI)

Cursor cannot create Replit secrets. There is no secrets API, and Agent is blocked.

| Name | Status from live tests | Set to |
| --- | --- | --- |
| `DATABASE_URL` | present (`/api/healthz` ok) | leave |
| `PORT` | present (server listening) | leave |
| `CONSENT_VERSION` | present (subscribe 200) | leave `2026-09-21` |
| `RESEND_API_KEY` | used by welcome mail; cannot confirm from here | keep if already set |
| `MAIL_FROM` | used by live welcome mail | `Aditya Shrivastav <aditya@saros.in>` |
| `PUBLIC_BASE_URL` | missing, optional | `https://loud-faint-section.replit.app` |
| `CRON_SECRET` | missing (issue route not live) | long random string; same value in GitHub |

Verify `saros.in` in Resend or welcome/issue sends will fail.

## 3. Routes

Drop these next to `artifacts/api-server/src/routes/subscribe.ts`:

- `issue.ts` ← `newsletter/backend/issue.ts`
- `unsubscribe.ts` ← `newsletter/backend/unsubscribe.ts`
- replace `index.ts` with `newsletter/backend/routes-index.ts`

Do not replace the portfolio HTML.

## 4. Publish

Save and publish LoudFaintSection. Same URL. Then:

- `POST /api/subscribe` still 200
- `GET /api/unsubscribe?token=test` returns HTML
- `POST /api/internal/issue` without bearer returns 401

## 5. GitHub

Same `CRON_SECRET`, plus `GEMINI_API_KEY` or `OPENAI_API_KEY`.
