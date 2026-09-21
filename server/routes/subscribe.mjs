import { Router } from 'express';
import { getPool } from '../db.mjs';

const router = Router();

const SUCCESS_MESSAGE = "Hey, we got you — don't worry, the news is on the way.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function isValidEmail(email) {
  return email.length >= 3 && email.length <= 254 && EMAIL_PATTERN.test(email);
}

router.post('/', async (req, res) => {
  try {
    const email = normalizeEmail(String(req.body?.email ?? ''));
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
    }

    const consentVersion = process.env.CONSENT_VERSION || '2026-09-21';
    const pool = getPool();
    const existing = await pool.query(
      'SELECT id, status FROM subscribers WHERE email = $1',
      [email],
    );

    if (existing.rowCount === 0) {
      await pool.query(
        `INSERT INTO subscribers (email, consent_version, source)
         VALUES ($1, $2, 'portfolio')`,
        [email, consentVersion],
      );
    } else {
      const row = existing.rows[0];
      if (row.status === 'unsubscribed' || row.status === 'suppressed') {
        await pool.query(
          `UPDATE subscribers
           SET status = 'pending',
               requested_at = NOW(),
               unsubscribed_at = NULL,
               consent_version = $2
           WHERE id = $1`,
          [row.id, consentVersion],
        );
      }
    }

    return res.json({ ok: true, message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error('Subscribe failed:', error);
    return res.status(500).json({
      ok: false,
      error: 'Something went wrong. Please try again in a moment.',
    });
  }
});

export default router;
