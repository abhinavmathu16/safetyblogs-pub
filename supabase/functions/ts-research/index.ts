// Edge function: ts-research
// Live paper fetching (arXiv API + Firecrawl), then Gemini-powered ranking/summarization.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type FetchConfig =
  | { type: "arxiv"; categories: string[] }
  | { type: "rss"; url: string }
  | { type: "firecrawl"; url: string; limit?: number };

const SOURCE_FETCH: Record<string, FetchConfig> = {
  jots: { type: "firecrawl", url: "https://tsjournal.org/index.php/jots/issue/current", limit: 20 },
  tspa: { type: "firecrawl", url: "https://www.tspa.org/library/", limit: 20 },
  arxiv: { type: "arxiv", categories: ["cs.CY", "cs.HC", "cs.CR"] },
  stanford: { type: "firecrawl", url: "https://cyber.fsi.stanford.edu/io/publications", limit: 20 },
  berkman: { type: "firecrawl", url: "https://cyber.harvard.edu/publications", limit: 20 },
  cltc: { type: "firecrawl", url: "https://cltc.berkeley.edu/publications/", limit: 20 },
  csmap: { type: "firecrawl", url: "https://csmapnyu.org/research/publications", limit: 20 },
  tsrc: { type: "firecrawl", url: "https://tsrc.stanford.edu/", limit: 20 },
  facct: { type: "firecrawl", url: "https://facctconference.org/2024/acceptedpapers", limit: 30 },
  usenix: { type: "firecrawl", url: "https://www.usenix.org/conference/usenixsecurity24/technical-sessions", limit: 30 },
  "ieee-sp": { type: "firecrawl", url: "https://www.ieee-security.org/TC/SP2024/program-papers.html", limit: 30 },
  ccs: { type: "firecrawl", url: "https://www.sigsac.org/ccs/CCS2024/program/accepted-papers.html", limit: 30 },
  ndss: { type: "firecrawl", url: "https://www.ndss-symposium.org/ndss2024/accepted-papers/", limit: 30 },
  "bot-research": { type: "firecrawl", url: "https://blog.cloudflare.com/tag/bots/", limit: 20 },
};

type RawPaper = {
  title: string;
  authors?: string;
  year?: string | number;
  url?: string;
  abstract?: string;
};

// ───────── arXiv ─────────
async function fetchArxiv(categories: string[], topic: string): Promise<RawPaper[]> {
  const catQuery = categories.map((c) => `cat:${c}`).join("+OR+");
  const topicQuery = topic ? `+AND+all:${encodeURIComponent(`"${topic}"`)}` : "";
  const url = `http://export.arxiv.org/api/query?search_query=(${catQuery})${topicQuery}&sortBy=submittedDate&sortOrder=descending&max_results=20`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`arXiv fetch failed: ${resp.status}`);
  const xml = await resp.text();

  // Simple regex-based Atom parsing — arXiv format is stable.
  const entries = xml.split("<entry>").slice(1);
  return entries.slice(0, 20).map((entry): RawPaper => {
    const pick = (tag: string) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return m ? m[1].trim() : "";
    };
    const title = pick("title").replace(/\s+/g, " ");
    const summary = pick("summary").replace(/\s+/g, " ");
    const published = pick("published");
    const year = published.slice(0, 4);
    const linkMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
    const url = linkMatch ? linkMatch[1].trim() : "";
    const authors = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)]
      .map((m) => m[1].trim())
      .slice(0, 5)
      .join(", ");
    return { title, authors, year, url, abstract: summary };
  });
}

// ───────── Firecrawl ─────────
const PAPER_SCHEMA = {
  type: "object",
  properties: {
    papers: {
      type: "array",
      description:
        "List of individual research papers, articles, or publications listed on this page. Do NOT include navigation links, issues, volumes, or section headings — only actual papers with a title and (ideally) author byline.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Full paper title" },
          authors: { type: "string", description: "Comma-separated author names exactly as shown on the page. Leave empty if not shown." },
          year: { type: "string", description: "Publication year if visible (e.g. 2024)" },
          url: { type: "string", description: "Absolute URL to the paper's landing page or PDF" },
          abstract: { type: "string", description: "Abstract or short description if shown on the page" },
        },
        required: ["title"],
      },
    },
  },
  required: ["papers"],
};

async function fetchFirecrawl(targetUrl: string, topic: string, limit = 20): Promise<RawPaper[]> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    throw new Error("FIRECRAWL_NOT_CONFIGURED");
  }

  // 1) Try structured JSON extraction first — captures authors/year/abstract.
  let structured: RawPaper[] = [];
  try {
    const jsonResp = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: [
          { type: "json", schema: PAPER_SCHEMA, prompt: "Extract every individual research paper or article listed on this page with title, authors, year, absolute URL, and abstract when available. Skip navigation, issue/volume listings, and section headers." },
          "markdown",
        ],
        onlyMainContent: true,
      }),
    });

    if (jsonResp.ok) {
      const jsonData = await jsonResp.json();
      const extracted =
        jsonData.data?.json?.papers ||
        jsonData.json?.papers ||
        jsonData.data?.extract?.papers ||
        [];
      if (Array.isArray(extracted)) {
        structured = extracted
          .filter((p: any) => p && typeof p.title === "string" && p.title.trim().length > 5)
          .map((p: any): RawPaper => ({
            title: String(p.title).trim(),
            authors: p.authors ? String(p.authors).trim() : undefined,
            year: p.year ? String(p.year).trim() : undefined,
            url: p.url ? String(p.url).trim() : undefined,
            abstract: p.abstract ? String(p.abstract).trim() : undefined,
          }));
      }

      // If structured extraction worked, rank by topic and return.
      if (structured.length > 0) {
        return rankByTopic(structured, topic, limit);
      }

      // Otherwise, fall through to markdown-link fallback using same response.
      const markdown: string = jsonData.data?.markdown || jsonData.markdown || "";
      const fromMarkdown = extractFromMarkdown(markdown, limit);
      if (fromMarkdown.length > 0) return rankByTopic(fromMarkdown, topic, limit);
    } else {
      const t = await jsonResp.text();
      console.error("Firecrawl json scrape failed:", jsonResp.status, t);
    }
  } catch (e) {
    console.error("Firecrawl json extraction error:", e);
  }

  // 2) Fallback: plain markdown scrape + link regex (legacy behavior).
  const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: targetUrl,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Firecrawl scrape failed: ${resp.status} ${t}`);
  }
  const data = await resp.json();
  const markdown: string = data.data?.markdown || data.markdown || "";
  return rankByTopic(extractFromMarkdown(markdown, limit), topic, limit);
}

function extractFromMarkdown(markdown: string, limit: number): RawPaper[] {
  const linkRe = /\[([^\]]{15,300})\]\((https?:\/\/[^\s)]+)\)/g;
  const candidates: RawPaper[] = [];
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(markdown)) !== null) {
    const title = m[1].trim();
    const url = m[2].trim();
    if (/^(home|about|contact|menu|skip|search|login|sign)/i.test(title)) continue;
    candidates.push({ title, url });
    if (candidates.length >= limit * 2) break;
  }
  return candidates;
}

function rankByTopic(papers: RawPaper[], topic: string, limit: number): RawPaper[] {
  const topicWords = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (topicWords.length === 0) return papers.slice(0, limit);
  const scored = papers.map((c) => {
    const t = (c.title + " " + (c.abstract || "")).toLowerCase();
    const score = topicWords.reduce((acc, w) => acc + (t.includes(w) ? 1 : 0), 0);
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.c);
}

// ───────── Gemini ranking + summarization (streamed JSON) ─────────
async function streamRankedPapers(
  rawPapers: RawPaper[],
  topic: string,
  sourceName: string,
  apiKey: string,
): Promise<Response> {
  const systemPrompt = `You are a research librarian covering online safety, abuse detection, platform integrity, content moderation, fraud, security, and related fields. From the JSON list of REAL papers below, pick the 5 most relevant to the topic "${topic || "online safety and platform integrity"}".

For each, output an object with keys: title, authors, year, source, brief, url.
- "source" must be: "${sourceName}"
- "brief" is a 1–2 sentence plain-English summary inferred from the abstract (if available) or the title.
- Preserve title, authors, year, and url EXACTLY as given in the input. Do NOT invent or rephrase authors or URLs.
- ONLY use "Unknown" for authors when the input field is missing or empty. If authors are present in the input, copy them verbatim.
- ONLY use "n.d." for year when the input field is missing or empty.

Return ONLY a JSON array of 5 objects. No prose, no markdown.`;

  const userPrompt = `Topic: ${topic}\n\nReal papers:\n${JSON.stringify(rawPapers.slice(0, 20), null, 2)}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const t = await response.text();
    console.error("AI gateway error:", response.status, t);
    throw new Error("AI gateway error");
  }

  return new Response(response.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

// ───────── Helper: stream a static JSON array back as SSE deltas ─────────
function streamStaticJson(papers: RawPaper[], sourceName: string): Response {
  const json = JSON.stringify(
    papers.slice(0, 5).map((p) => ({
      title: p.title,
      authors: p.authors || "Unknown",
      year: p.year || "n.d.",
      source: sourceName,
      brief: p.abstract ? p.abstract.slice(0, 240) : "Live result from " + sourceName + ".",
      url: p.url || "",
    })),
  );
  const sse =
    `data: ${JSON.stringify({ choices: [{ delta: { content: json } }] })}\n\n` +
    `data: [DONE]\n\n`;
  return new Response(sse, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

// ───────── Server ─────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── find_papers: live fetch + Gemini rank ──
    if (action === "find_papers") {
      const { sourceId, source: sourceName, topic } = body as {
        sourceId?: string; source?: string; topic?: string;
      };
      if (!sourceId || !sourceName) {
        return new Response(JSON.stringify({ error: "sourceId and source are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const cfg = SOURCE_FETCH[sourceId];
      if (!cfg) {
        return new Response(JSON.stringify({ error: `Unknown source: ${sourceId}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let raw: RawPaper[] = [];
      try {
        if (cfg.type === "arxiv") {
          raw = await fetchArxiv(cfg.categories, topic || "");
        } else if (cfg.type === "firecrawl") {
          raw = await fetchFirecrawl(cfg.url, topic || "", cfg.limit);
        } else if (cfg.type === "rss") {
          // Not yet wired; fall through to empty
          raw = [];
        }
      } catch (e: any) {
        const msg = e?.message || String(e);
        console.error("fetch error:", msg);
        if (msg === "FIRECRAWL_NOT_CONFIGURED") {
          return new Response(
            JSON.stringify({
              error:
                "Live fetching for this source requires the Firecrawl connector. Connect Firecrawl in Lovable Cloud, or pick arXiv as the source.",
            }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        // Return empty results so UI shows graceful empty state
        return streamStaticJson([], sourceName);
      }

      if (raw.length === 0) {
        return streamStaticJson([], sourceName);
      }

      return await streamRankedPapers(raw, topic || "", sourceName, LOVABLE_API_KEY);
    }

    // ── review_paper / generate_article (unchanged) ──
    const { paperTitle, paperSummary, userThoughts } = body;
    let systemPrompt = "";
    let userPrompt = "";

    if (action === "review_paper") {
      systemPrompt = `You are a research analyst covering online safety, abuse detection, platform integrity, content moderation, fraud prevention, security, and related fields. Provide a thorough but accessible review of this paper. Structure your review with these sections:
## Overview
A clear summary of what this paper is about and why it matters.

## Key Findings
The most important discoveries or arguments (use bullet points).

## Methodology
How the researchers approached this (brief).

## Practical Implications
What this means for practitioners working on safety, integrity, abuse, fraud, security, or related platform/product challenges.

## Strengths & Limitations
Balanced assessment.

## Key Quote or Takeaway
One powerful insight from the paper.

Write in an engaging, editorial tone. Use markdown formatting.`;
      userPrompt = `Review this paper: "${paperTitle}"`;
    } else if (action === "generate_article") {
      systemPrompt = `You are a senior journalist and practitioner covering online safety, abuse detection, platform integrity, content moderation, fraud, security, and related fields. Write a compelling, practical article (800-1200 words) that takes the theory from an academic paper and applies it to a real-world use case.

The article should:
- Have a catchy, editorial headline
- Open with a compelling real-world scenario or problem
- Reference the paper's theory and key findings
- Present a specific, actionable use case showing how to apply this theory — this may span any relevant domain (safety, integrity, abuse, fraud, security, moderation, risk, etc.), not just trust & safety
- Include practical steps or a framework
- End with forward-looking implications

Incorporate the reader's personal thoughts and reactions where relevant.

Write in a polished editorial style. Use markdown with proper headings, bold text, and clear structure.`;
      userPrompt = `Paper: "${paperTitle}"
      
Paper Summary: ${paperSummary}

Reader's thoughts and reactions: ${userThoughts}

Write a practical use-case article applying this paper's theory.`;
    } else {
      throw new Error("Invalid action");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ts-research error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
