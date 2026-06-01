## Goal

Two improvements to the **Find Paper** step:

1. **Dynamic topics per source** — the topic dropdown reflects what each venue actually publishes (T&S topics for JOTS/TSPA/etc., bot/fingerprinting/anti-scraping topics for USENIX/IEEE/NDSS/CCS/etc.).
2. **Live paper fetching** — instead of asking Gemini to recall papers (which hallucinates and goes stale), fetch real, current paper listings per source: **arXiv API** for arXiv, **Firecrawl** for everything else. Gemini is then used only to rank/summarize the real results.

## Architecture

```text
PaperFinder (UI)
   │ sourceId + topic
   ▼
ts-research edge function
   ├─ if source == arxiv   → arXiv Atom API (free, no key)
   ├─ if source has feed   → fetch RSS/Atom directly
   └─ otherwise            → Firecrawl search/scrape on the venue's
                             publications page, filtered by topic
   ▼
Real list of {title, authors, year, url, abstract}
   ▼
Gemini: pick top 5 most relevant to topic + write 1-line brief
   ▼
Stream back to UI
```

## Changes

### 1. Source registry with topics + fetch config — `src/components/SourceSelect.tsx`

Extend each entry in `SOURCES` with:
- `topics: { value, label }[]` — curated per source.
- `fetch: { type: "arxiv" | "rss" | "firecrawl"; ... }` — used by the edge function. (We export this so the edge function and UI share one source of truth via a small shared file, see step 2.)

Topic buckets:
- **T&S venues** (jots, tspa, stanford, berkman, csmap, tsrc, facct): content moderation, misinformation, deepfakes, election integrity, child safety, hate speech, algorithmic bias, transparency, platform governance, harassment, user wellbeing.
- **Security venues** (usenix, ieee-sp, ccs, ndss, bot-research): bot detection, browser fingerprinting, anti-scraping, CAPTCHA & challenges, account takeover, credential stuffing, automated traffic analysis, device intelligence, adversarial ML for abuse, web automation.
- **arxiv**: union of both, plus AI safety, ML robustness.
- **cltc**: AI risk, digital harms, cybersecurity policy, privacy.

Always include a "Custom topic…" option.

### 2. Shared source config — `src/lib/sources.ts` (new)

Move the `SOURCES` array here so both `SourceSelect.tsx` and the edge function can import the same definitions (the edge function will import via a copy under `supabase/functions/ts-research/sources.ts` to stay within Deno's module rules — small duplication, no runtime coupling).

Each fetch config:
- `arxiv`: `{ type: "arxiv", categories: ["cs.CY", "cs.HC", "cs.CR"] }`
- `rss`: `{ type: "rss", url: "https://..." }` for sources with known feeds (JOTS, SIO blog, Berkman, CLTC, Cloudflare blog, etc.)
- `firecrawl`: `{ type: "firecrawl", url: "https://...publications", limit: 20 }` for everything else (TSPA library, USENIX/IEEE/CCS/NDSS proceedings pages)

### 3. PaperFinder — `src/components/PaperFinder.tsx`

- Accept `sourceId` prop (in addition to existing `sourceName`).
- Replace the hardcoded `TOPICS` with `getTopicsForSource(sourceId)`.
- Reset `selectedTopic` whenever `sourceId` changes.
- Helper text becomes "Topics curated for {sourceName}".
- Pass `sourceId` (not just name) into `findPapers`.

### 4. Index page — `src/pages/Index.tsx`

Forward `sourceId` from `SourceSelect.onSelect` → `PaperFinder` (already tracked in state, just thread it through).

### 5. Edge function — `supabase/functions/ts-research/index.ts`

Add a `findPapers` action branch (or new action) that:
1. Reads `sourceId` + `topic` from request body (Zod-validated).
2. Looks up the source's fetch config.
3. Dispatches:
   - **arXiv**: `GET http://export.arxiv.org/api/query?search_query=cat:cs.CY+AND+all:"<topic>"&sortBy=submittedDate&sortOrder=descending&max_results=20`, parse Atom.
   - **RSS**: `fetch(url)`, parse with a tiny inline XML parser (or `npm:fast-xml-parser`).
   - **Firecrawl**: `POST https://api.firecrawl.dev/v2/search` (or `/scrape` of the publications URL with `formats: ["links", "markdown"]`) using `FIRECRAWL_API_KEY` from env, filtered by the topic string.
4. Normalizes results to `{ title, authors, year, url, abstract }[]`.
5. Sends the list + the topic to Gemini with a prompt: "From these N real papers, pick the 5 most relevant to '<topic>' and write a one-sentence brief for each. Return JSON: `[{title, authors, year, source, brief, url}]`. Do NOT invent papers."
6. Streams the JSON back (same streaming contract the UI already expects).

CORS, JWT-off, and the existing streaming response shape stay the same — only the data source changes.

### 6. Firecrawl connector

Firecrawl is required for the non-arXiv, non-RSS sources. **Action needed from you**: connect the Firecrawl connector (it's available in Lovable's connector catalog). Once connected, `FIRECRAWL_API_KEY` is auto-injected into the edge function env — no code changes needed beyond reading `Deno.env.get("FIRECRAWL_API_KEY")`. If the key is missing at runtime, the function falls back to "no results, please connect Firecrawl" rather than hallucinating.

### 7. Graceful failure

If a source's feed is unreachable or returns zero results for the topic, return a friendly empty state in the UI ("No recent papers found on {topic} at {source}. Try a broader topic or a different source.") instead of falling back to LLM recall — that's the whole point of this change.

## Out of scope (future)

- Caching results in a `papers` table with `pg_cron` nightly refresh (Option 3 from the earlier discussion).
- Saved searches / alerts when new matching papers appear.
- Multi-select topics.
- Pagination beyond top 5.

## Technical notes

- arXiv API is free, no key, polite rate limit (~1 req/3s) — fine for on-demand search.
- Firecrawl: use `/v2/search` with `query: "<topic> site:<venue-domain>"` for proceedings sites that lack clean indexes; use `/v2/scrape` with `formats: ["markdown", "links"]` for known publication index pages.
- All XML parsing stays in the edge function via `npm:fast-xml-parser` to keep the client bundle small.
- The Gemini call after fetching is short (titles + abstracts only) so streaming latency stays similar to today.
