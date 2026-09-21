# Agent guardrails

**Cursor builds the product. Replit is backend and database only.**

Never start Replit Agent from Cursor. Do not call `update_app_using_prompt` or other Replit Agent tools; they wake Agent automatically and burn credits.

See `.cursor/rules/cursor-build-replit-backend.mdc`. Deploy Cursor-built files by hand in the Replit editor. Keep Replit for Postgres, secrets, `/api/subscribe`, `/api/unsubscribe`, and `/api/internal/issue`. Daily AI News Scout research runs in GitHub Actions, not as a 24/7 Replit scraper.
