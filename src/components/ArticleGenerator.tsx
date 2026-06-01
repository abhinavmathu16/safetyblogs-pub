import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { generateArticle } from "@/lib/api/ts-research";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink, Loader2, RotateCcw, BookmarkCheck, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { Paper } from "@/components/PaperFinder";

interface ArticleGeneratorProps {
  paper: Paper;
  sourceName: string;
  review: string;
  userThoughts: string;
  initialArticle?: string;
  onArticleChange?: (article: string) => void;
  onRestart: () => void;
}

export const ArticleGenerator = ({
  paper,
  sourceName,
  review,
  userThoughts,
  initialArticle = "",
  onArticleChange,
  onRestart,
}: ArticleGeneratorProps) => {
  const { user } = useAuth();
  const [article, setArticle] = useState(initialArticle);
  const [loading, setLoading] = useState(!initialArticle);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const runGenerate = () => {
    setArticle("");
    setSaved(false);
    setLoading(true);
    let accumulated = "";
    generateArticle(paper.title, review, userThoughts, {
      onDelta: (text) => {
        accumulated += text;
        setArticle(accumulated);
        onArticleChange?.(accumulated);
      },
      onDone: () => setLoading(false),
    }).catch((e) => {
      toast.error(e.message || "Failed to generate article");
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!initialArticle) runGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paper.title]);

  const handleSave = async () => {
    if (!user) {
      toast.error("Sign in to save");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("saved_articles").insert({
      user_id: user.id,
      paper_title: paper.title,
      paper_authors: paper.authors,
      paper_year: String(paper.year ?? ""),
      paper_url: paper.url,
      source_name: sourceName,
      review,
      user_thoughts: userThoughts,
      article,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setSaved(true);
    toast.success("Saved to library");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
          Your Article
        </p>
        <h2 className="text-3xl font-display font-bold mb-2">Practical Application</h2>
        <p className="text-muted-foreground font-body">
          Based on "{paper.title}" and your insights.
        </p>
        {paper.url && (
          <a
            href={paper.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs font-mono text-accent hover:underline"
          >
            View original paper <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <motion.div
        className="bg-card border-2 border-border rounded-lg p-8 md:p-12 shadow-sm"
        layout
      >
        {article ? (
          <article className="prose-editorial">
            <ReactMarkdown>{article}</ReactMarkdown>
          </article>
        ) : (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
            <p className="text-muted-foreground italic font-body">Crafting your article...</p>
          </div>
        )}

        {loading && article && (
          <div className="flex items-center gap-2 mt-6 text-accent">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-mono">Writing...</span>
          </div>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        {user ? (
          <Button
            variant="editorial-outline"
            onClick={handleSave}
            disabled={loading || saving || saved || !article}
            className="gap-2"
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {saved ? "Saved" : saving ? "Saving..." : "Save to library"}
          </Button>
        ) : (
          <Link to="/auth">
            <Button variant="editorial-outline" className="gap-2">
              <Bookmark className="w-4 h-4" />
              Sign in to save
            </Button>
          </Link>
        )}
        <Button
          variant="editorial-outline"
          onClick={runGenerate}
          disabled={loading}
          className="gap-2"
        >
          Regenerate
        </Button>
        <Button variant="editorial" onClick={onRestart} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Start Over
        </Button>
      </div>
    </motion.div>
  );
};
