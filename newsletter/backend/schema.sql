-- Paste into LoudFaintSection Postgres. Safe to re-run. Do not start Replit Agent.
-- Matches the live subscribers table (serial id, subscriber_status enum).

begin;

create extension if not exists pgcrypto;

alter table subscribers add column if not exists unsubscribe_token text;
alter table subscribers add column if not exists unsubscribed_at timestamptz;

create unique index if not exists subscribers_unsubscribe_token_idx
  on subscribers (unsubscribe_token)
  where unsubscribe_token is not null;

update subscribers
set unsubscribe_token = encode(gen_random_bytes(24), 'hex')
where unsubscribe_token is null;

create table if not exists scout_issues (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  issue_date_ist date not null unique,
  subject text not null,
  html_body text not null,
  text_body text not null,
  status text not null default 'ready',
  source_records jsonb not null default '[]'::jsonb,
  run_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists scout_deliveries (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references scout_issues(id) on delete cascade,
  email text not null,
  status text not null default 'queued',
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (issue_id, email)
);

commit;
