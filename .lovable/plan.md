## Goal

1. Stop losing generated content (review + article) when navigating Back.
2. Persist generated articles to a "Saved Articles" library backed by Lovable Cloud.
3. On the "What Do You Think?" step, show the generated paper summary on the left so the user can reference it while writing thoughts.

## Open question

Storage approach — pick one before I implement:
- **A. Browser only (localStorage)** — no login, device-local.
- **B. Cloud, no login** — shared across devices but public to anyone.
- **C. Cloud + email login** — private per user (adds an auth step).

Default if unspecified: **C** (most robust, future-proof).

---

## Changes

### 1. Stop progress loss on Back (state lifting)

`src/pages/Index.tsx` already holds `selectedPaper`, `review`, `userThoughts` at the page level — good. The bug is that `PaperReview` and `ArticleGenerator` re-trigger generation in `useEffect` on every mount, overwriting the previously-streamed text.

Fix:
- Pass `review` (and `setReview`) into `PaperReview` as a controlled value. If `review` is non-empty on mount, skip the API call and just render.
- Same for `ArticleGenerator`: pass `article` + `setArticle` from `Index`; skip generation if already populated.
- Add a small "Regenerate" button on both screens so the user can opt back into a fresh generation.

Result: Back/Forward through steps preserves everything.

### 2. Two-column layout on "What Do You Think?"

`src/components/UserThoughts.tsx`:
- Accept a new `review: string` prop (the generated summary from step 2).
- Switch the layout from single column to a responsive 2-column grid (`lg:grid-cols-2`, stacks on mobile).
  - **Left:** scrollable card titled "Paper Summary" rendering the `review` markdown (reuse `ReactMarkdown` + `prose-editorial`, sticky on `lg` so it stays visible while scrolling thoughts).
  - **Right:** existing prompts + textarea.
- Widen the page container from `max-w-2xl` to `max-w-6xl` on this step only.
- `Index.tsx` passes `review` down to `UserThoughts`.

### 3. Saved Articles library (assuming option C)

**DB migration** — new table `public.saved_articles`:
- `id uuid pk`, `user_id uuid not null`, `paper_title text`, `paper_authors text`, `paper_year text`, `paper_url text`, `source_name text`, `review text`, `user_thoughts text`, `article text`, `created_at timestamptz default now()`.
- `GRANT SELECT, INSERT, UPDATE, DELETE … TO authenticated; GRANT ALL … TO service_role;`
- Enable RLS + policies: users can select/insert/update/delete only their own rows (`auth.uid() = user_id`).

**Auth**:
- Add `/auth` route with email+password sign up / sign in (no email confirm for fast dev iteration unless user wants it).
- Add Google sign-in via `supabase.auth.signInWithOAuth({ provider: 'google' })` and call `configure_social_auth` for google.
- Header shows "Sign in" / user email + "Sign out".

**Save flow**:
- On `ArticleGenerator`'s `onDone`, if signed in, auto-save the row; otherwise show a "Sign in to save" button. Show a "Saved ✓" toast.

**Library page** at `/library`:
- Lists the current user's saved articles (title, authors, date, source) — card grid.
- Click → read-only view of the saved review + thoughts + article + link to original paper.
- Header link "My Library" next to the title in `Index` header.

### 4. Out of scope
- No changes to edge function or AI prompts.
- No changes to source registry.
- No public sharing of saved articles.

---

## Files touched

- `src/pages/Index.tsx` — lift `article` state, pass `review` to `UserThoughts`, add header auth links.
- `src/components/PaperReview.tsx` — controlled `review` prop, skip regen if present, Regenerate button.
- `src/components/ArticleGenerator.tsx` — controlled `article` prop, skip regen if present, auto-save on done, Regenerate button.
- `src/components/UserThoughts.tsx` — 2-column layout with sticky summary on the left.
- `src/pages/Auth.tsx` — new sign-in / sign-up page.
- `src/pages/Library.tsx` — new list + detail of saved articles.
- `src/App.tsx` — register `/auth` and `/library` routes.
- New migration: `saved_articles` table + RLS.

## Verification

- Walk the wizard to step 4, hit Back twice — review and article remain intact, no re-streaming.
- On step 3, confirm the summary renders on the left and is scrollable independently.
- Sign in, generate an article, see it in `/library`; sign out and confirm `/library` is gated.
