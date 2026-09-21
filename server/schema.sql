CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE CHECK (
    email = lower(btrim(email))
    AND length(email) BETWEEN 3 AND 254
    AND position('@' IN email) > 1
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'active', 'unsubscribed', 'suppressed')
  ),
  consent_version TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'portfolio',
  CHECK (status <> 'active' OR (confirmed_at IS NOT NULL AND unsubscribed_at IS NULL)),
  CHECK (status <> 'unsubscribed' OR unsubscribed_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS subscribers_status_idx ON subscribers (status);
