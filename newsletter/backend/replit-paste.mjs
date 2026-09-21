import { Router } from "express";
import { randomBytes } from "node:crypto";
import pg from "pg";

const router = Router();
const { Pool } = pg;

function pool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL must be set");
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

function publicBase() {
  return process.env.PUBLIC_BASE_URL || "https://loud-faint-section.replit.app";
}

function tokenFor(existing) {
  return existing || randomBytes(24).toString("hex");
}

async function sendResend(to, subject, html, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY must be set");
  const from =
    process.env.MAIL_FROM ||
    process.env.FROM_EMAIL ||
    "Aditya Shrivastav <aditya@saros.in>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Resend HTTP ${response.status}`);
  return data.id;
}

router.post("/internal/issue", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const header = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!secret || header !== secret) {
    res.status(401).json({ ok: false, message: "Unauthorized" });
    return;
  }

  const {
    idempotencyKey,
    issueDateIst,
    subject,
    html,
    text,
    sourceRecords,
    runMetadata,
    dryRun,
  } = req.body || {};

  if (!idempotencyKey || !subject || !html || !text || !issueDateIst) {
    res.status(400).json({ ok: false, message: "Missing issue fields" });
    return;
  }

  const db = pool();
  try {
    const existing = await db.query("select id, status from scout_issues where idempotency_key = $1", [idempotencyKey]);
    if (existing.rows[0]) {
      res.json({ ok: true, status: "duplicate", deliveryId: existing.rows[0].id });
      return;
    }

    const inserted = await db.query(
      `insert into scout_issues (idempotency_key, issue_date_ist, subject, html_body, text_body, source_records, run_metadata, status)
       values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)
       returning id`,
      [
        idempotencyKey,
        issueDateIst,
        subject,
        html,
        text,
        JSON.stringify(sourceRecords || []),
        JSON.stringify(runMetadata || {}),
        dryRun ? "draft" : "sending",
      ],
    );
    const issueId = inserted.rows[0].id;

    const people = await db.query(
      `select email, unsubscribe_token
       from subscribers
       where status in ('pending', 'active')
         and unsubscribed_at is null`,
    );

    const owner = "aditya@saros.in";
    const recipients = new Map();
    recipients.set(owner, { email: owner, token: tokenFor() });
    for (const row of people.rows) {
      const email = String(row.email).toLowerCase().trim();
      const token = tokenFor(row.unsubscribe_token);
      if (!row.unsubscribe_token) {
        await db.query("update subscribers set unsubscribe_token = $1 where email = $2", [token, email]);
      }
      recipients.set(email, { email, token });
    }

    if (dryRun) {
      res.json({ ok: true, status: "draft stored", deliveryId: issueId, recipients: 0 });
      return;
    }

    let sent = 0;
    for (const { email, token } of recipients.values()) {
      const unsub = `${publicBase()}/api/unsubscribe?token=${encodeURIComponent(token)}`;
      const htmlBody = String(html).replaceAll("{{UNSUBSCRIBE_URL}}", unsub);
      const textBody = String(text).replaceAll("{{UNSUBSCRIBE_URL}}", unsub);
      try {
        const messageId = await sendResend(email, subject, htmlBody, textBody);
        await db.query(
          `insert into scout_deliveries (issue_id, email, status, provider_message_id, accepted_at)
           values ($1,$2,'sent',$3, now())
           on conflict (issue_id, email) do nothing`,
          [issueId, email, messageId],
        );
        sent += 1;
      } catch (error) {
        await db.query(
          `insert into scout_deliveries (issue_id, email, status, error)
           values ($1,$2,'failed',$3)
           on conflict (issue_id, email) do update set status = 'failed', error = excluded.error`,
          [issueId, email, error instanceof Error ? error.message : "send failed"],
        );
      }
    }

    await db.query("update scout_issues set status = $2 where id = $1", [issueId, sent ? "sent" : "failed"]);
    res.json({ ok: true, status: sent ? "sent" : "failed", deliveryId: issueId, sent });
  } catch (error) {
    res.status(500).json({ ok: false, message: error instanceof Error ? error.message : "Issue send failed" });
  } finally {
    await db.end();
  }
});

router.get("/unsubscribe", async (req, res) => {
  const token = String(req.query.token || "").trim();
  if (!token) {
    res.status(400).type("html").send("<p>Missing unsubscribe token.</p>");
    return;
  }
  if (!process.env.DATABASE_URL) {
    res.status(500).type("html").send("<p>Database is not configured.</p>");
    return;
  }
  const db = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await db.query(
      `update subscribers
       set status = 'unsubscribed', unsubscribed_at = now(), updated_at = now()
       where unsubscribe_token = $1
       returning email`,
      [token],
    );
    const ok = Boolean(result.rowCount);
    res.type("html").send(
      `<!doctype html><html><body style="font-family:Arial;padding:40px;"><h1>${ok ? "You've been unsubscribed." : "This link is invalid or already used."}</h1><p>AI News Scout will no longer email this address.</p></body></html>`,
    );
  } finally {
    await db.end();
  }
});

export default router;
