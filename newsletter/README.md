# AI News Scout — prepared setup

This folder contains the subscriber edition of Aditya's brief and the future database schema. It is **not a deployed newsletter backend**. No Supabase database was created or modified, no subscriber was added, no newsletter was sent, and no subscriber-delivery task was activated. A separate draft-only phase is scheduled as described below.

## Daily draft preparation

An AI News Scout Draft automation is enabled for **11:00 AM Asia/Kolkata daily**. It uses public research and the verified connected Gmail account to save one unsent HTML/plain-text draft with no recipients. It cannot send, read a subscriber database, or activate subscriptions. The first issue, dated 21 September 2026, was saved and verified as an unsent multipart HTML/plain-text Gmail draft with no recipients. It contains three clearly dated earlier updates and two validation ideas; no fresh funding or policy announcement was invented. Local copies are in `issues/`.

`draft-automation-prompt.txt` is the exact draft-phase brief. When the backend is ready, update this existing task instead of creating a second daily AI News Scout job.

## Current website

The newsletter form opens a subscription-request email to `adityashrivastav2011@gmail.com`. It explicitly says signup and automatic delivery are coming soon. A mailto request does not add a subscriber or prove control of an address entered in the form. The portfolio's separate personal contact email stays `aditya@saros.in`.

The connected Gmail profile was checked and matches the intended sender. That confirms the account connected to this conversation; it does not provide credentials to the static website or a future server.

## Prepared files

- `original-brief.txt`: the supplied AI News Scout brief, unchanged.
- `subscriber-editorial-prompt.txt`: adapted for confirmed subscribers, with all Aditya-only recipient restrictions replaced. Research, fact checking, funding labels and the India-first editorial focus are retained.
- `setup.json`: sender, 11:00 AM Asia/Kolkata schedule (05:30 UTC), active draft-task reference, and explicit inactive subscriber-delivery flags. This is a setup record; the native automation owns the running draft schedule.
- `supabase-schema.sql`: unapplied schema for subscribers, confirmation/unsubscribe tokens, issues and delivery records. No subscriber data is included.

## Connect Supabase later

1. Choose the Supabase project and apply the SQL in its trusted SQL editor. The private `newsletter` schema should stay outside the browser-facing Data API. Access it from a trusted backend using a server database connection or private server RPCs.
2. Implement a rate-limited server signup endpoint: validate and normalise the email, insert a pending subscriber, create a cryptographically random confirmation token, store only its SHA-256 hash, and email the confirmation. Return the same neutral response for existing and new addresses. The static site must not contain a service-role key, database password, or Gmail token.
3. Confirm email control through the token before activating a subscriber. Make confirmation a user action rather than a state-changing email-link GET, so link scanners do not subscribe people. Expire confirmation tokens, consume them once, and atomically invalidate competing tokens. Requests from an already active subscriber must not silently unsubscribe or duplicate the person.
4. Provide an easy unsubscribe flow in every issue. Mark the subscriber unsubscribed, invalidate relevant tokens and skip outstanding sends. Never expose an address list, even to ordinary signed-in users.
5. Connect authenticated Gmail delivery for `adityashrivastav2011@gmail.com`. Use the actual account, not an unverified From header. Keep OAuth credentials in server secrets. A separate production mail integration is required if the sender runs outside this conversation's connected Gmail tools.
6. Research and render one shared issue, then send one individually addressed message per confirmed active subscriber, each with its own unsubscribe link. Store HTML/plain text, source URLs, publication dates and funding status labels. Claim deliveries atomically; a unique issue/subscriber pair prevents duplicate jobs. Recheck suppression immediately before sending.
7. Treat a timeout with an uncertain provider result as `unknown`; reconcile it before another attempt. A successful provider response means accepted for sending, not proven inbox delivery. Keep failed issues as database drafts if Gmail draft permissions are unavailable.
8. Test the full flow using an owner-approved test address, including confirmation, unsubscribe, duplicates, failures and reduced-access database queries. Then connect the website to the real endpoint and update its visible status. Remove the mailto-only path only once the actual integration passes.
9. Verify live access to all required services, check for an existing AI News Scout automation, then update the existing AI News Scout draft task for subscriber delivery at **11:00 AM Asia/Kolkata**. For a UTC scheduler use **`30 5 * * *`**. Subscriber delivery is not active yet. Do not create a duplicate task or enable delivery that assumes missing connections will work later.

The schema is a preparation artifact and has not been executed against PostgreSQL. Review it alongside the chosen backend before applying it. The tables alone do not implement signup, email verification, unsubscribe, scheduling, research, sending or retries.

## Official integration references

- [Gmail sender identities](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.sendAs)
- [Gmail OAuth scopes](https://developers.google.com/workspace/gmail/api/auth/scopes): `gmail.send` for sending; draft management requires additional access.
- [Gmail sending limits](https://support.google.com/mail/answer/22839?hl=en): respect the account's limits; do not work around them.
- [Gmail subscription guidance](https://support.google.com/mail/answer/81126?hl=en)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase server secrets](https://supabase.com/docs/guides/functions/secrets)
