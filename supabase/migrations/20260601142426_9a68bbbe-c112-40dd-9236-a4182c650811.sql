
CREATE TABLE public.saved_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  paper_title TEXT NOT NULL,
  paper_authors TEXT,
  paper_year TEXT,
  paper_url TEXT,
  source_name TEXT,
  review TEXT,
  user_thoughts TEXT,
  article TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_articles TO authenticated;
GRANT ALL ON public.saved_articles TO service_role;

ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own saved articles"
ON public.saved_articles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own saved articles"
ON public.saved_articles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own saved articles"
ON public.saved_articles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own saved articles"
ON public.saved_articles FOR DELETE
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_saved_articles_updated_at
BEFORE UPDATE ON public.saved_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
