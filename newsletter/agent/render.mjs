import { istDateLabel } from "./write.mjs";

function esc(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tagColor(status) {
  if (status === "VERIFIED" || status === "OFFICIAL") return "#0f6b4c";
  if (status === "ANALYST VIEW") return "#6b3fa0";
  if (status === "UNCONFIRMED") return "#9a3412";
  return "#1d4ed8";
}

function card(item) {
  const status = esc(item.status || "REPORTED");
  const link = item.sourceUrl
    ? `<p style="margin:8px 0 0;font-size:13px;line-height:1.6;"><a href="${esc(item.sourceUrl)}" style="color:#1d4ed8;text-decoration:underline;">${esc(item.sourceName || "Source")}</a>${item.publishedAt ? ` · ${esc(item.publishedAt)}` : ""}</p>`
    : "";
  const why = item.why
    ? `<p style="margin:0 0 8px;font-size:16px;line-height:1.6;color:#1f2937;"><strong>Why it matters.</strong> ${esc(item.why)}</p>`
    : "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;border:1px solid #dbe3ef;border-radius:12px;background:#ffffff;"><tr><td style="padding:16px 18px;"><p style="margin:0 0 8px;font-size:11px;letter-spacing:1.1px;font-weight:700;color:${tagColor(item.status)};">${status}</p><h3 style="margin:0 0 10px;font-size:19px;line-height:1.35;color:#0f172a;">${esc(item.headline || item.name || item.title)}</h3><p style="margin:0 0 8px;font-size:16px;line-height:1.65;color:#334155;">${esc(item.summary || "")}</p>${why}${link}</td></tr></table>`;
}

function listOrNone(items, empty) {
  if (!items || !items.length) return `<p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#334155;">${esc(empty)}</p>`;
  return items.map(card).join("");
}

function fundingBlock(funding = {}) {
  const rows = [
    ["Confirmed startup round", funding.confirmed],
    ["Strategic investment", funding.strategic],
    ["IPO/SPAC", funding.ipo],
    ["Reported funding talks", funding.reported],
    ["Venture-fund closure", funding.fundClosure],
  ];
  if (funding.none && rows.every(([, items]) => !items || !items.length)) {
    return `<p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#334155;">No funding alert cleared the evidence bar this cycle.</p>`;
  }
  return rows.map(([label, items]) => {
    if (!items || !items.length) return `<p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#334155;"><strong>${esc(label)}.</strong> None verified.</p>`;
    return `<p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0f172a;">${esc(label)}</p>${items.map(card).join("")}`;
  }).join("");
}

function opportunityCard(item) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;border:1px solid #ddd6fe;border-radius:12px;background:#faf8ff;"><tr><td style="padding:16px 18px;"><p style="margin:0 0 8px;font-size:11px;letter-spacing:1.1px;font-weight:700;color:#6b3fa0;">ANALYST VIEW</p><h3 style="margin:0 0 10px;font-size:19px;line-height:1.35;color:#0f172a;">${esc(item.title)}</h3><p style="margin:0 0 8px;font-size:16px;line-height:1.65;color:#334155;"><strong>Buyer.</strong> ${esc(item.buyer)}</p><p style="margin:0 0 8px;font-size:16px;line-height:1.65;color:#334155;"><strong>Pain.</strong> ${esc(item.pain)}</p><p style="margin:0 0 8px;font-size:16px;line-height:1.65;color:#334155;"><strong>Wedge.</strong> ${esc(item.wedge)}</p><p style="margin:0 0 8px;font-size:16px;line-height:1.65;color:#334155;"><strong>Why now.</strong> ${esc(item.timing)}</p><p style="margin:0 0 8px;font-size:16px;line-height:1.65;color:#334155;"><strong>7-day test.</strong> ${esc(item.test)}</p><p style="margin:0;font-size:16px;line-height:1.65;color:#334155;"><strong>Safety.</strong> ${esc(item.safety)}</p></td></tr></table>`;
}

export function renderEmail(issue, { until }) {
  const dateLabel = istDateLabel(until);
  const short = (issue.shortVersion || []).map((line) => `<li style="margin:0 0 10px;font-size:16px;line-height:1.6;color:#334155;">${esc(line)}</li>`).join("");
  const startups = (issue.indiaStartups || []).map(card).join("");
  const watch = (issue.watchNext || []).length
    ? `<ul style="padding-left:22px;margin:0;">${issue.watchNext.map((item) => `<li style="margin:0 0 10px;font-size:16px;line-height:1.6;color:#334155;">${esc(item.item)}${item.sourceUrl ? ` — <a href="${esc(item.sourceUrl)}" style="color:#1d4ed8;">source</a>` : ""}</li>`).join("")}</ul>`
    : `<p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">No sourced upcoming item cleared the evidence bar.</p>`;
  const opportunities = (issue.opportunities || []).length
    ? issue.opportunities.map(opportunityCard).join("")
    : `<p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">No analyst idea was grounded in today's verified signals.</p>`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(issue.subject)}</title></head><body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f7;"><tr><td align="center" style="padding:20px 10px;"><table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;"><tr><td style="padding:28px 26px;background:#102a6b;color:#ffffff;"><p style="margin:0 0 8px;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#bfdbfe;">AI News Scout · ${esc(dateLabel)} IST</p><h1 style="margin:0 0 8px;font-size:32px;line-height:1.15;color:#ffffff;">The brief I actually read.</h1><p style="margin:0;font-size:15px;line-height:1.5;color:#dbeafe;">New since last issue · India and Gulf operators</p></td></tr><tr><td style="padding:24px 26px 8px;"><h2 style="margin:0 0 12px;font-size:13px;letter-spacing:1.2px;text-transform:uppercase;color:#64748b;">The short version</h2><ul style="padding-left:20px;margin:0 0 8px;">${short}</ul></td></tr><tr><td style="padding:18px 26px;border-top:1px solid #e2e8f0;"><h2 style="margin:0 0 14px;font-size:22px;color:#0f172a;">Frontier AI, models, and products</h2>${listOrNone(issue.frontier, "No material model or product change cleared the evidence bar.")}</td></tr><tr><td style="padding:18px 26px;border-top:1px solid #e2e8f0;"><h2 style="margin:0 0 14px;font-size:22px;color:#0f172a;">AI governance, policy, and safety</h2>${listOrNone(issue.governance, "No enacted rule, proposal, or safety item cleared the evidence bar.")}</td></tr><tr><td style="padding:18px 26px;border-top:1px solid #e2e8f0;"><h2 style="margin:0 0 14px;font-size:22px;color:#0f172a;">India AI startups to watch</h2>${startups}</td></tr><tr><td style="padding:18px 26px;border-top:1px solid #e2e8f0;"><h2 style="margin:0 0 14px;font-size:22px;color:#0f172a;">India AI funding alerts</h2>${fundingBlock(issue.funding)}</td></tr><tr><td style="padding:18px 26px;border-top:1px solid #e2e8f0;"><h2 style="margin:0 0 14px;font-size:22px;color:#0f172a;">AI business opportunities</h2><p style="margin:0 0 14px;font-size:14px;color:#6b3fa0;font-weight:700;">ANALYST VIEW — ideas, not market facts.</p>${opportunities}</td></tr><tr><td style="padding:18px 26px;border-top:1px solid #e2e8f0;"><h2 style="margin:0 0 14px;font-size:22px;color:#0f172a;">What to watch next</h2>${watch}</td></tr><tr><td style="padding:20px 26px;background:#f8fafc;border-top:1px solid #e2e8f0;"><p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b;">You're receiving this because you subscribed on Aditya's portfolio. <a href="{{UNSUBSCRIBE_URL}}" style="color:#1d4ed8;">Unsubscribe</a></p><p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">Sent by Aditya Shrivastav · aditya@saros.in · no tracking pixels.</p></td></tr></table></td></tr></table></body></html>`;

  const text = [
    issue.subject,
    "",
    "THE SHORT VERSION",
    ...(issue.shortVersion || []),
    "",
    "Unsubscribe: {{UNSUBSCRIBE_URL}}",
  ].join("\n");

  return { html, text };
}
