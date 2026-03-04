const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, source, topic, paperTitle, paperSummary, userThoughts } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'find_papers') {
      systemPrompt = `You are a Trust & Safety research expert. Find 3 real, notable academic papers related to "${topic || 'trust and safety'}" from the source category: "${source}". 
For each paper, provide:
- title (real paper title)
- authors
- year
- source (journal/conference)
- brief (2-sentence summary of the key finding)

Return ONLY valid JSON array with objects having keys: title, authors, year, source, brief. No markdown, no explanation.`;
      userPrompt = `Find 3 papers about trust and safety from: ${source}. ${topic ? `Focus on: ${topic}` : ''}`;
    } else if (action === 'review_paper') {
      systemPrompt = `You are a Trust & Safety research analyst. Provide a thorough but accessible review of this paper. Structure your review with these sections:
## Overview
A clear summary of what this paper is about and why it matters.

## Key Findings
The most important discoveries or arguments (use bullet points).

## Methodology
How the researchers approached this (brief).

## Implications for Trust & Safety
What this means for practitioners working in T&S.

## Strengths & Limitations
Balanced assessment.

## Key Quote or Takeaway
One powerful insight from the paper.

Write in an engaging, editorial tone. Use markdown formatting.`;
      userPrompt = `Review this trust & safety paper: "${paperTitle}"`;
    } else if (action === 'generate_article') {
      systemPrompt = `You are a senior Trust & Safety journalist and practitioner. Write a compelling, practical article (800-1200 words) that takes the theory from an academic paper and applies it to a real-world use case.

The article should:
- Have a catchy, editorial headline
- Open with a compelling real-world scenario or problem
- Reference the paper's theory and key findings
- Present a specific, actionable use case showing how to apply this theory
- Include practical steps or a framework
- End with forward-looking implications

Incorporate the reader's personal thoughts and reactions where relevant.

Write in a polished editorial style. Use markdown with proper headings, bold text, and clear structure.`;
      userPrompt = `Paper: "${paperTitle}"
      
Paper Summary: ${paperSummary}

Reader's thoughts and reactions: ${userThoughts}

Write a practical use-case article applying this paper's theory.`;
    } else {
      throw new Error('Invalid action');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Credits exhausted. Please add funds.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', response.status, t);
      throw new Error('AI gateway error');
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    console.error('ts-research error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
