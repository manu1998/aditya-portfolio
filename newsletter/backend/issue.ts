import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { pool } from "@workspace/db";

const router: IRouter = Router();

function publicBase() {
  return process.env.PUBLIC_BASE_URL || "https://loud-faint-section.replit.app";
}

function mailFrom() {
  return (
    process.env.MAIL_FROM ||
    process.env.FROM_EMAIL ||
    "Aditya Shrivastav <aditya@saros.in>"
  );
}

function tokenFor(existing?: string | null) {
  return existing || randomBytes(24).toString("hex");
}

async function sendResend(to: string, subject: string, html: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY must be set");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: mailFrom(), to: [to], subject, html, text }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Resend HTTP ${response.status}`);
  }
  return data.id as string;
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

  try {
    const existing = await pool.query(
      "select id, status from scout_issues where idempotency_key = $1",
      [idempotencyKey],
    );
    if (existing.rows[0]) {
      res.json({ ok: true, status: "duplicate", deliveryId: existing.rows[0].id });
      return;
    }

    const inserted = await pool.query(
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
    const issueId = inserted.rows[0].id as string;

    const people = await pool.query(
      `select email, unsubscribe_token
       from subscribers
       where status in ('pending', 'active')
         and unsubscribed_at is null`,
    );

    const owner = "aditya@saros.in";
    const recipients = new Map<string, { email: string; token: string }>();
    recipients.set(owner, { email: owner, token: tokenFor() });
    for (const row of people.rows) {
      const email = String(row.email).toLowerCase().trim();
      const token = tokenFor(row.unsubscribe_token);
      if (!row.unsubscribe_token) {
        await pool.query("update subscribers set unsubscribe_token = $1 where email = $2", [token, email]);
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
        await pool.query(
          `insert into scout_deliveries (issue_id, email, status, provider_message_id, accepted_at)
           values ($1,$2,'sent',$3, now())
           on conflict (issue_id, email) do nothing`,
          [issueId, email, messageId],
        );
        sent += 1;
      } catch (error) {
        await pool.query(
          `insert into scout_deliveries (issue_id, email, status, error)
           values ($1,$2,'failed',$3)
           on conflict (issue_id, email) do update set status = 'failed', error = excluded.error`,
          [issueId, email, error instanceof Error ? error.message : "send failed"],
        );
      }
    }

    await pool.query("update scout_issues set status = $2 where id = $1", [issueId, sent ? "sent" : "failed"]);
    res.json({ ok: true, status: sent ? "sent" : "failed", deliveryId: issueId, sent });
  } catch (error) {
    req.log?.error?.({ err: error }, "issue send failed");
    res.status(500).json({ ok: false, message: error instanceof Error ? error.message : "Issue send failed" });
  }
});

export default router;
