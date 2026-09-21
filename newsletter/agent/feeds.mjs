import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

function decode(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function stripTags(value) {
  return decode(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function firstTag(block, names) {
  for (const name of names) {
    const tagged = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (tagged) return decode(tagged[1]);
    const attr = block.match(new RegExp(`<${name}[^>]+href=["']([^"']+)["']`, "i"));
    if (attr) return decode(attr[1]);
  }
  return "";
}

function parseItems(xml) {
  const chunks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) || [];
  return chunks.map((chunk) => {
    const link = firstTag(chunk, ["link", "guid", "id"]);
    const title = stripTags(firstTag(chunk, ["title"]));
    const summary = stripTags(firstTag(chunk, ["description", "summary", "content"]));
    const published = firstTag(chunk, ["pubDate", "published", "updated", "dc:date"]);
    const source = stripTags(firstTag(chunk, ["source", "dc:creator"]));
    return { title, url: link.split(/\s/)[0], summary: summary.slice(0, 500), published, source };
  }).filter((item) => item.title && item.url && /^https?:\/\//i.test(item.url));
}

function inWindow(published, since, until) {
  const when = published ? Date.parse(published) : NaN;
  if (Number.isNaN(when)) return true;
  return when >= since.getTime() && when <= until.getTime();
}

export async function collectCandidates({ since, until }) {
  const config = JSON.parse(await readFile(path.join(here, "sources.json"), "utf8"));
  const gaps = [];
  const seen = new Set();
  const candidates = [];

  await Promise.all(config.groups.map(async (group) => {
    await Promise.all(group.feeds.map(async (feed) => {
      try {
        const response = await fetch(feed.url, {
          signal: AbortSignal.timeout(config.timeoutMs),
          headers: { "User-Agent": "AI-News-Scout/1.0 (+https://loud-faint-section.replit.app)" },
        });
        if (!response.ok) {
          gaps.push(`${feed.name}: HTTP ${response.status}`);
          return;
        }
        const xml = await response.text();
        const items = parseItems(xml)
          .filter((item) => inWindow(item.published, since, until))
          .slice(0, config.capPerFeed);
        for (const item of items) {
          const key = item.url.replace(/[?#].*$/, "").toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          candidates.push({
            ...item,
            group: group.id,
            sourceName: feed.name,
            sourceType: group.label,
          });
        }
        if (!items.length) gaps.push(`${feed.name}: NO_NEW_ITEMS`);
      } catch (error) {
        gaps.push(`${feed.name}: ${error instanceof Error ? error.message : "unavailable"}`);
      }
    }));
  }));

  candidates.sort((a, b) => Date.parse(b.published || 0) - Date.parse(a.published || 0));
  return { candidates, coverageGaps: [...new Set(gaps)] };
}
