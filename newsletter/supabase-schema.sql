-- PREPARED ONLY. Not applied to any database.
-- Fresh private schema for AI News Scout; run later in the chosen Supabase project.
begin;

create schema if not exists newsletter;
revoke all on schema newsletter from public, anon, authenticated;
grant usage on schema newsletter to service_role;

create table if not exists newsletter.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email)) and length(email) between 3 and 254 and position('@' in email) > 1),
  status text not null default 'pending' check (status in ('pending','active','unsubscribed','suppressed')),
  consent_version text not null,
  requested_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text not null default 'portfolio',
  check (status <> 'active' or (confirmed_at is not null and unsubscribed_at is null)),
  check (status <> 'unsubscribed' or unsubscribed_at is not null)
);

create table if not exists newsletter.subscription_tokens (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references newsletter.subscribers(id) on delete cascade,
  purpose text not null check (purpose in ('confirm','unsubscribe')),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  used_at timestamptz,
  check (purpose <> 'confirm' or expires_at is not null),
  check (expires_at is null or expires_at > created_at)
);

create table if not exists newsletter.issues (
  id uuid primary key default gen_random_uuid(),
  issue_date_ist date not null unique,
  sender_email text not null default 'adityashrivastav2011@gmail.com' check (sender_email = 'adityashrivastav2011@gmail.com'),
  subject text not null,
  html_body text not null,
  text_body text not null,
  status text not null default 'draft' check (status in ('draft','ready','sending','sent','partial','failed')),
  source_records jsonb not null default '[]'::jsonb check (jsonb_typeof(source_records) = 'array'),
  run_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(run_metadata) = 'object'),
  research_from timestamptz,
  research_until timestamptz,
  created_at timestamptz not null default now(),
  researched_at timestamptz,
  completed_at timestamptz,
  check (research_until is null or research_from is null or research_until >= research_from)
);

create table if not exists newsletter.deliveries (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references newsletter.issues(id) on delete cascade,
  subscriber_id uuid not null references newsletter.subscribers(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','sending','sent','failed','unknown','skipped')),
  attempts integer not null default 0 check (attempts >= 0),
  provider_message_id text,
  queued_at timestamptz not null default now(),
  claimed_at timestamptz,
  accepted_at timestamptz,
  next_attempt_at timestamptz,
  error_category text,
  unique (issue_id, subscriber_id),
  check (status <> 'sent' or (provider_message_id is not null and accepted_at is not null))
);

create index if not exists newsletter_active_subscribers_idx on newsletter.subscribers(status) where status = 'active';
create index if not exists newsletter_delivery_queue_idx on newsletter.deliveries(status, next_attempt_at) where status in ('queued','failed');
create index if not exists newsletter_token_subscriber_idx on newsletter.subscription_tokens(subscriber_id);

alter table newsletter.subscribers enable row level security;
alter table newsletter.subscription_tokens enable row level security;
alter table newsletter.issues enable row level security;
alter table newsletter.deliveries enable row level security;

-- No public/browser policies. Server-side trusted code only.
revoke all on all tables in schema newsletter from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema newsletter to service_role;
alter default privileges in schema newsletter revoke all on tables from public, anon, authenticated;

commit;
