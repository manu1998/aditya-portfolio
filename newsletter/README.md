# AI News Scout

Daily 11:00 AM IST brief for whoever subscribed on the portfolio. Cursor researches. Replit stores subscribers and sends mail. Never start Replit Agent.

## Split

| Piece | Where it lives |
| --- | --- |
| RSS sweep, Master Prompt writer, HTML email | `newsletter/agent/` in this repo |
| Schedule | GitHub Actions `30 5 * * *` |
| Subscribers, issues, deliveries | Replit Postgres |
| Send | Replit `POST /api/internal/issue` → Resend from `aditya@saros.in` |
| Signup | Existing `POST /api/subscribe` on `https://loud-faint-section.replit.app` |

This is not a 24/7 Autoscale scraper. The public site stays a quiet static page.

## Paste onto Replit

Follow `newsletter/backend/PASTE.md`. Human file copy in the Replit editor. Do not prompt Agent to rebuild the frontend.

## Local dry-run

```bash
npm run scout:dry
```

Writes `newsletter/issues/YYYY-MM-DD.html` and updates `newsletter/state.json`. Does not send.

## Live send

Requires Replit paste + Resend domain verification for `saros.in`. Then run **Actions → AI News Scout**. After that, 11:00 AM IST is automatic. Each day is idempotent (`ai-news-scout-YYYY-MM-DD`). `aditya@saros.in` always gets a copy.

## Sources

Bounded public RSS/Atom only (`newsletter/agent/sources.json`): official company blogs, research/product feeds, named press, India AI, governance. 8s timeout, 12 items per feed. Missing feeds are listed as coverage gaps, not invented.
