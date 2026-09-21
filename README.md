# Aditya Shrivastav — Product portfolio

A dependency-free static website. No install or build is needed.

## Use
- Deploy the contents of `dist/` to any static host.
- Or use `exports/index.html`, the self-contained single-file edition.
- The downloadable ZIP contains `index.html`, local `assets/`, this README, and a separate `newsletter/` preparation folder. Only the website files are needed for static hosting.
- Optional local preview: `npm run dev` uses only Node built-ins. It is not needed for hosting.

## Edit
Content, URLs, CSS and JavaScript are in `dist/index.html`. Update each project's `href` when a deployment is confirmed. Regenerate the exports after editing the main page.

## Links and capture status — 21 September 2026
The current destinations were supplied by Aditya: momspg.com, bellevie.rentok.com, alliancehomes.co.in, onboardhub.rentok.com, and demohub.rentok.com.

Actual public website screenshots were captured for Moms PG, Belle-Vie, Alliance Homes, Onboard Hub and Demo Hub. Alliance redirects to www.alliancehomes.co.in. Onboard Hub and Demo Hub require sign-in; their public entry screens are used and labelled. No authentication or form submission was performed.

Nyra Nest was removed at Aditya's request. The websites section now contains Moms PG, Belle-Vie and Alliance Homes.

The flagship GitHub links are retained as optional source links; earlier connected GitHub checks returned 404 and could not confirm access. Booking Agent and Support Agent have no outbound links.

## Content and visuals
Metrics come from the attached Aditya Shrivastav resume: AI vertical ARR Rs 25–30L, adoption 45% to 72%, and 10,000+ inbound AI sales leads. Demo Hub's expanded snapshot uses 1,500 demos and 200 paid conversions from the same resume.

All five product and website thumbnails use genuine website captures. Agent conversations remain clearly labelled examples, not a live chat interface. The original portrait and generated caricature are unchanged.

## Newsletter and share
The AI News Scout form opens a subscription-request email to adityashrivastav2011@gmail.com. It explicitly says automatic signup and delivery are coming soon. It never records a subscription, stores the email, or contacts an invented API. A visitor must send the request, and is not automatically subscribed. The separate personal Email contact remains aditya@saros.in.

The `newsletter/` folder contains the original brief, adapted subscriber editorial prompt, active draft-only task prompt, sender/setup record, and unapplied Supabase schema. Research creates unsent Gmail drafts with no recipients. Subscriber collection and delivery remain disabled until a later authorised integration. See `newsletter/README.md`.

Sharing uses the native Web Share API where available, falls back to clipboard, then a selectable link. Cancelling native share does not trigger a copy.

## Checks
The local static server loaded the page in the browser. Desktop, 320px and 390px mobile-frame, and 625px tablet-frame layouts were visually reviewed during the redesign. All seven current image instances loaded (seven unique local assets). Fragment links, unique IDs, SVG validity and JavaScript syntax passed. Mailto encoding, invalid input, native sharing, cancellation, clipboard and manual fallback branches passed focused checks. The snapshot disclosure and copy fallback were exercised in the browser. Reduced-motion styles disable movement. No email was sent during testing.

## Redesign — version 2
- Personal hero with a photo-based editorial caricature and the supplied original photo in About.
- Larger flagship product stories, handwriting-style annotations and lime accents.
- Brief entrance, underline, section and conversation animations, all disabled with prefers-reduced-motion. Content remains visible without JavaScript.
- Agent outbound URLs removed from the current page.
- Newsletter/share behavior retained; no-JS visitors receive a manual share instruction.
- Version 1 preserved in Git history and in `versions/v1/`.
- Portrait generated with the built-in image-generation tool from the supplied reference. Prompt: premium editorial ink-and-gouache caricature cutout preserving swept black hair, full beard, sunglasses, blue kurta and cream vest; subtle exaggeration, hand in pocket, transparent background, no scenery, lettering or props. The original photo remains unchanged.

## Redesign — version 3
- Replaced the soft editorial theme with oversized sans-serif type, bold framed compositions, cobalt, yellow and orange panels, and strong black outlines.
- Body text is 18–20px, navigation 16px, and meaningful secondary labels at least 14px (miniature illustrative UI and decorative stickers are exceptions).
- Main foreground/background pairs exceed WCAG AA contrast: white on cobalt 6.99:1, ink on orange 7.00:1, ink on warm white 17.02:1.
- Content stays fully opaque at all times. Brief entrance movement and portrait/card interactions respect reduced-motion preferences.
- The personal photos, products, accurate link labels, agent descriptions and newsletter behavior remain intact.
- Version 2 preserved in Git history and in `versions/v2/`; version 1 remains in `versions/v1/`.

## Update — version 4
- Replaced hobby numbers with labelled badminton, AI chip, gamepad and chair icons.
- Added LinkedIn, Email and My contact cards above the newsletter; phone links to +91-8296876536.
- Updated all six website URLs and installed five actual public-site captures.
- Nyra Nest's remaining concept thumbnail is explicitly identified; see capture status above.
- Preserved version 3 in `versions/v3/` and Git history.

## Update — version 5
- Removed Nyra Nest from the current portfolio.
- Directed subscription requests to the intended Gmail sender, with honest pending-subscription messaging.
- Prepared the future Supabase schema and subscriber workflow without connecting a database or enabling delivery.
- Configured a separate daily draft-only AI News Scout task with no recipients.
- Preserved version 4 in `versions/v4/` and Git history.

## Update — version 6
- Say hello opens WhatsApp at +91 8296876536.
- View résumé opens the supplied, unchanged one-page PDF in a new browser tab.
- Hero actions wrap on smaller screens.
- The PDF is a local asset; the single-file export embeds an offline copy using a PDF Blob URL.
- Version 5 is preserved in `versions/v5/` and Git history.
