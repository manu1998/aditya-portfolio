const SYSTEM = `You are AI News Scout for Aditya Shrivastav, a product operator selling websites, CRMs, WhatsApp agents and voice agents in India and the Gulf (Delhi NCR, Nagpur, Dubai).

Write one daily HTML-email briefing from the candidate list only. Do not invent URLs, dates, funding amounts, or companies.

Rules:
- VERIFIED: official company/government URL in the candidates.
- REPORTED: named publication URL in the candidates.
- UNCONFIRMED: exclude unless material; then label it.
- ANALYST VIEW: only in opportunities.
- Include only items inside the lookback window. Deduplicate the same announcement.
- Keep funding buckets separate. A venture-fund close is never a startup raise.
- India watchlist baseline: Sarvam AI, Neysa, Yellow.ai, Krutrim Cloud, CoRover, Qure.ai, Gnani.ai. If no verified change, say "No material verified change this cycle".
- If nothing clears the bar, still return JSON with empty story arrays and a shortVersion note that no material change cleared the evidence bar.
- 2-3 analyst ideas grounded in today's verified signals, with buyer, pain, wedge, timing, 7-day test, safety constraint.
- Return JSON only, no markdown.`;

function toStory(item, status = "REPORTED") {
  const summary = String(item.summary || item.title || "")
    .replace(/^Article URL:\s+\S+\s+/i, "")
    .replace(/Comments URL:.*$/i, "")
    .trim();
  return {
    headline: item.title,
    status,
    summary: summary || item.title,
    why: "A public feed listed this inside the lookback window; open the source before acting.",
    sourceName: item.sourceName,
    sourceUrl: item.url,
    publishedAt: item.published || "",
  };
}

function fallbackIssue(candidates, { since, until, gaps }) {
  const rank = { official: 0, governance: 1, india: 2, press: 3, research: 4 };
  const sorted = [...candidates].sort((a, b) => (rank[a.group] ?? 9) - (rank[b.group] ?? 9));
  const frontier = sorted.filter((item) => item.group === "official" || item.group === "press").slice(0, 4).map((item) => toStory(item, "REPORTED"));
  const governance = sorted.filter((item) => item.group === "governance").slice(0, 3).map((item) => toStory(item, "REPORTED"));
  const picks = [...frontier, ...governance].slice(0, 6);
  return {
    subject: `AI News Scout — ${istDateLabel(until)}`,
    shortVersion: picks.length
      ? picks.slice(0, 4).map((item) => item.headline)
      : ["No material change cleared the evidence bar in this lookback window."],
    frontier,
    governance,
    indiaStartups: [
      "Sarvam AI", "Neysa", "Yellow.ai", "Krutrim Cloud", "CoRover", "Qure.ai", "Gnani.ai",
    ].map((name) => ({
      name,
      status: "REPORTED",
      summary: "No material verified change this cycle.",
      sourceUrl: "",
      publishedAt: "",
    })),
    funding: { confirmed: [], strategic: [], ipo: [], reported: [], fundClosure: [], none: true },
    opportunities: [],
    watchNext: [],
    coverageGaps: gaps,
    lookback: { since: since.toISOString(), until: until.toISOString() },
  };
}

export function istDateLabel(date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;
  const models = [
    process.env.GEMINI_MODEL,
    "gemini-3.6-flash",
    "gemini-flash-latest",
  ].filter(Boolean);
  let lastError = "";
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4000 },
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n") || "";
    }
    lastError = `Gemini ${model} HTTP ${response.status}`;
  }
  throw new Error(lastError);
}

async function callOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJson(text) {
  const trimmed = String(text || "").trim();
  const match = trimmed.match(/\{[\s\S]*\}$/);
  return JSON.parse(match ? match[0] : trimmed);
}

export async function writeIssue({ candidates, since, until, gaps, previousUrls }) {
  const payload = {
    lookbackIST: {
      since: since.toISOString(),
      until: until.toISOString(),
    },
    previousUrls: previousUrls || [],
    coverageGaps: gaps,
    candidates: candidates.slice(0, 40).map((item) => ({
      headline: item.title,
      url: item.url,
      published: item.published,
      source: item.sourceName,
      group: item.group,
      summary: item.summary,
    })),
    jsonShape: {
      subject: "AI News Scout — date",
      shortVersion: ["bullet"],
      frontier: [{ headline: "", status: "VERIFIED|REPORTED", summary: "", why: "", sourceName: "", sourceUrl: "", publishedAt: "" }],
      governance: [{ headline: "", status: "", summary: "", why: "", sourceName: "", sourceUrl: "", publishedAt: "" }],
      indiaStartups: [{ name: "", status: "", summary: "", sourceUrl: "", publishedAt: "" }],
      funding: { confirmed: [], strategic: [], ipo: [], reported: [], fundClosure: [], none: true },
      opportunities: [{ title: "", buyer: "", pain: "", wedge: "", timing: "", test: "", safety: "" }],
      watchNext: [{ item: "", sourceUrl: "" }],
      coverageGaps: [],
    },
  };

  const prompt = `${SYSTEM}\n\nLookback window ${payload.lookbackIST.since} to ${payload.lookbackIST.until}. Previous issue URLs to avoid repeating: ${JSON.stringify(payload.previousUrls)}\n\nCandidates:\n${JSON.stringify(payload.candidates, null, 2)}\n\nReturn JSON matching jsonShape: ${JSON.stringify(payload.jsonShape)}`;

  let text = "";
  try {
    text = (await callGemini(prompt)) || "";
    if (!text) text = (await callOpenAI(prompt)) || "";
  } catch (error) {
    gaps.push(`writer: ${error instanceof Error ? error.message : "model failed"}`);
  }

  if (!text) return fallbackIssue(candidates, { since, until, gaps });

  try {
    const issue = parseJson(text);
    issue.coverageGaps = [...new Set([...(issue.coverageGaps || []), ...gaps])];
    issue.lookback = payload.lookbackIST;
    if (!issue.subject) issue.subject = `AI News Scout — ${istDateLabel(until)}`;
    if (!Array.isArray(issue.indiaStartups) || !issue.indiaStartups.length) {
      issue.indiaStartups = fallbackIssue(candidates, { since, until, gaps }).indiaStartups;
    }
    return issue;
  } catch {
    gaps.push("writer: JSON parse failed");
    return fallbackIssue(candidates, { since, until, gaps });
  }
}
