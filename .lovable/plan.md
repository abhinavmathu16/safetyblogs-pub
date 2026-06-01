## Goal

Replace the "Unknown" author placeholder with real metadata for Firecrawl-backed sources, and surface a clickable link to each paper throughout the flow.

## Changes

### 1. Edge function `supabase/functions/ts-research/index.ts`

- **Switch Firecrawl from markdown-link-scraping to structured JSON extraction.** Use Firecrawl's `formats: [{ type: "json", schema: {...} }]` to ask Firecrawl/its LLM to return an array of `{ title, authors, year, url, abstract }` objects directly from the page. This captures authors and abstracts the markdown regex can't.
- **Fix JOTS URL.** Change from `…/issue/archive` (lists issues) to `https://tsjournal.org/index.php/jots/issue/current` plus a fallback to the most recent issue's article page. The JSON-extraction prompt asks for individual article titles + author bylines.
- **Keep arXiv as-is** (already returns authors).
- **Looser fallback:** if JSON extraction returns nothing, fall back to the existing markdown-link extractor so we never regress to a worse state than today.
- **Tighten the Gemini prompt** so it preserves `authors` verbatim from the input and only writes "Unknown" when the input field is truly empty.

### 2. `src/components/PaperFinder.tsx`

- Render `paper.url` as a real `<a href target="_blank" rel="noreferrer">` with an external-link icon, styled in the editorial accent color. Stop the click from bubbling to the card's "select paper" handler.
- Keep the existing card click for "review this paper".

### 3. Carry the link through later steps

- `Paper` type already has `url`. Pass it into `PaperReview` and `ArticleGenerator` and show a small "View original paper ↗" link in both views so the user can always jump to the source while reviewing or reading the generated article.

## Out of scope

- No DB changes, no new tables, no auth changes.
- No new connectors — Firecrawl is already connected.
- No changes to the topic dropdown or source registry semantics.

## Verification

After edits I'll run a `find_papers` call for `jots` (topic: "online harassment") via the edge function and confirm the returned JSON has real author strings and per-article URLs, then check the preview to confirm the link is clickable.
