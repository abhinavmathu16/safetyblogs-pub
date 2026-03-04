import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ts-research`;

type StreamCallbacks = {
  onDelta: (text: string) => void;
  onDone: () => void;
};

async function streamFromFunction(body: Record<string, unknown>, { onDelta, onDone }: StreamCallbacks) {
  const resp = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const errorData = await resp.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `Request failed with status ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') {
        onDone();
        return;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  onDone();
}

export async function findPapers(
  source: string,
  topic: string,
  callbacks: StreamCallbacks
) {
  return streamFromFunction({ action: 'find_papers', source, topic }, callbacks);
}

export async function reviewPaper(
  paperTitle: string,
  callbacks: StreamCallbacks
) {
  return streamFromFunction({ action: 'review_paper', paperTitle }, callbacks);
}

export async function generateArticle(
  paperTitle: string,
  paperSummary: string,
  userThoughts: string,
  callbacks: StreamCallbacks
) {
  return streamFromFunction({ action: 'generate_article', paperTitle, paperSummary, userThoughts }, callbacks);
}
