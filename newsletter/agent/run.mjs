import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectCandidates } from "./feeds.mjs";
import { writeIssue } from "./write.mjs";
import { renderEmail } from "./render.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const dryRun = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

function istNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function parseStamp(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function issueDateIst(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function hasSource(story) {
  return Boolean(story?.sourceUrl && /^https?:\/\//i.test(story.sourceUrl));
}

function qualityGate(issue) {
  issue.frontier = (issue.frontier || []).filter(hasSource);
  issue.governance = (issue.governance || []).filter(hasSource);
  for (const bucket of ["confirmed", "strategic", "ipo", "reported", "fundClosure"]) {
    if (issue.funding?.[bucket]) issue.funding[bucket] = issue.funding[bucket].filter(hasSource);
  }
  return true;
}

async function loadState() {
  try {
    return JSON.parse(await readFile(path.join(root, "state.json"), "utf8"));
  } catch {
    return {};
  }
}

async function deliver(issue, html, text, meta) {
  const endpoint = process.env.REPLIT_ISSUE_URL || "https://loud-faint-section.replit.app/api/internal/issue";
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET is missing");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      idempotencyKey: meta.idempotencyKey,
      issueDateIst: meta.issueDateIst,
      subject: issue.subject,
      html,
      text,
      sourceRecords: meta.sourceRecords,
      runMetadata: meta.runMetadata,
      dryRun,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `Replit issue API HTTP ${response.status}`);
  }
  return body;
}

if (process.env.GITHUB_ACTIONS && !dryRun && !process.env.CRON_SECRET) {
  throw new Error("CRON_SECRET is required in GitHub Actions");
}

const until = new Date();
const state = await loadState();
const last = parseStamp(state.last_successful_run_at || state.last_successful_run_ist);
const since = last || new Date(until.getTime() - 48 * 60 * 60 * 1000);
const firstBaseline = !last;

const { candidates, coverageGaps } = await collectCandidates({ since, until });
const issue = await writeIssue({
  candidates,
  since,
  until,
  gaps: coverageGaps,
  previousUrls: state.included_canonical_urls || state.urls_used_recently || [],
});
if (firstBaseline) {
  issue.shortVersion = [
    "First baseline run: lookback is the previous 48 hours because LAST_SUCCESSFUL_RUN_AT was missing.",
    ...(issue.shortVersion || []),
  ];
}

qualityGate(issue);
const { html, text } = renderEmail(issue, { until });
const issueDate = issueDateIst(istNow());
const idempotencyKey = `ai-news-scout-${issueDate}`;

await mkdir(path.join(root, "issues"), { recursive: true });
await writeFile(path.join(root, "issues", `${issueDate}.html`), html);
await writeFile(path.join(root, "issues", `${issueDate}.json`), JSON.stringify(issue, null, 2));

const urls = [...(issue.frontier || []), ...(issue.governance || [])]
  .map((item) => item.sourceUrl)
  .filter(Boolean);

const nextState = dryRun
  ? {
      ...state,
      last_dry_run_at: until.toISOString(),
      last_dry_run_issue: issueDate,
      coverage_gaps: issue.coverageGaps || [],
      candidate_count: candidates.length,
      delivery_status: "not sent",
      idempotency_key: idempotencyKey,
    }
  : {
      last_successful_run_at: until.toISOString(),
      last_successful_run_ist: new Date(until).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      issue_date_ist: issueDate,
      included_canonical_urls: urls,
      coverage_gaps: issue.coverageGaps || [],
      candidate_count: candidates.length,
      delivery_status: "pending_replit",
      idempotency_key: idempotencyKey,
    };

let delivery = { status: "not sent" };
if (!dryRun && process.env.CRON_SECRET) {
  delivery = await deliver(issue, html, text, {
    idempotencyKey,
    issueDateIst: issueDate,
    sourceRecords: candidates.slice(0, 40),
    runMetadata: {
      lookbackSince: since.toISOString(),
      lookbackUntil: until.toISOString(),
      firstBaseline,
      coverageGaps: issue.coverageGaps || [],
      dryRun,
    },
  });
  nextState.delivery_status = delivery.status || "accepted";
  nextState.last_delivery_id = delivery.deliveryId || "";
} else {
  nextState.delivery_status = "not sent";
}

await writeFile(path.join(root, "state.json"), JSON.stringify(nextState, null, 2));

const highlights = (issue.shortVersion || []).slice(0, 5);
console.log(JSON.stringify({
  status: nextState.delivery_status === "not sent" || dryRun ? "not sent" : "sent pending verification",
  dryRun,
  highlights,
  coverageGaps: (issue.coverageGaps || []).slice(0, 8),
  issueDate,
  idempotencyKey,
  deliveryId: delivery.deliveryId || null,
}, null, 2));
