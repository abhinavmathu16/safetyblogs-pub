import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SavedArticle {
  id: string;
  paper_title: string;
  paper_authors: string | null;
  paper_year: string | null;
  paper_url: string | null;
  source_name: string | null;
  review: string | null;
  user_thoughts: string | null;
  article: string | null;
  created_at: string;
}

export default function Library() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SavedArticle | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("saved_articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(error.message);
      } else {
        setItems(data as SavedArticle[]);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_articles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success("Deleted");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link to="/" className="text-xs font-mono uppercase tracking-widest text-accent">
            ← Back to wizard
          </Link>
          <h1 className="text-2xl font-display font-bold">My Library</h1>
          <span className="text-xs font-mono text-muted-foreground">{items.length} saved</span>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8">
        {selected ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button variant="editorial-outline" onClick={() => setSelected(null)} className="mb-6">
              ← Back to list
            </Button>
            <article className="bg-card border-2 border-border rounded-lg p-8 md:p-12">
              <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
                {selected.source_name}
              </p>
              <h2 className="text-3xl font-display font-bold mb-2">{selected.paper_title}</h2>
              <p className="text-muted-foreground font-body text-sm">
                {selected.paper_authors} · {selected.paper_year}
              </p>
              {selected.paper_url && (
                <a
                  href={selected.paper_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-mono text-accent hover:underline"
                >
                  View original paper <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {selected.review && (
                <section className="mt-8">
                  <h3 className="font-display font-bold text-xl mb-3">Paper Summary</h3>
                  <div className="prose-editorial">
                    <ReactMarkdown>{selected.review}</ReactMarkdown>
                  </div>
                </section>
              )}

              {selected.user_thoughts && (
                <section className="mt-8">
                  <h3 className="font-display font-bold text-xl mb-3">Your Thoughts</h3>
                  <p className="font-body whitespace-pre-wrap">{selected.user_thoughts}</p>
                </section>
              )}

              {selected.article && (
                <section className="mt-8">
                  <h3 className="font-display font-bold text-xl mb-3">Generated Article</h3>
                  <div className="prose-editorial">
                    <ReactMarkdown>{selected.article}</ReactMarkdown>
                  </div>
                </section>
              )}
            </article>
          </motion.div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-body">
            No saved articles yet. Generate one to see it here.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border-2 border-border rounded-lg p-5 hover:border-accent transition cursor-pointer group"
                onClick={() => setSelected(item)}
              >
                <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
                  {item.source_name || "Unknown source"}
                </p>
                <h3 className="font-display font-bold text-lg leading-tight mb-2 line-clamp-2">
                  {item.paper_title}
                </h3>
                <p className="text-sm text-muted-foreground font-body line-clamp-1">
                  {item.paper_authors} · {item.paper_year}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs font-mono text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
