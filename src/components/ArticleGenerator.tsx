import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { generateArticle } from "@/lib/api/ts-research";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { Paper } from "@/components/PaperFinder";

interface ArticleGeneratorProps {
  paper: Paper;
  review: string;
  userThoughts: string;
  onRestart: () => void;
}

export const ArticleGenerator = ({ paper, review, userThoughts, onRestart }: ArticleGeneratorProps) => {
  const [article, setArticle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let accumulated = "";
    generateArticle(paper.title, review, userThoughts, {
      onDelta: (text) => {
        accumulated += text;
        setArticle(accumulated);
      },
      onDone: () => setLoading(false),
    }).catch((e) => {
      toast.error(e.message || "Failed to generate article");
      setLoading(false);
    });
  }, [paper.title, review, userThoughts]);

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
        <h2 className="text-3xl font-display font-bold mb-2">
          Practical Application
        </h2>
        <p className="text-muted-foreground font-body">
          Based on "{paper.title}" and your insights.
        </p>
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
            <p className="text-muted-foreground italic font-body">
              Crafting your article...
            </p>
          </div>
        )}

        {loading && article && (
          <div className="flex items-center gap-2 mt-6 text-accent">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-mono">Writing...</span>
          </div>
        )}
      </motion.div>

      <div className="text-center mt-8">
        <Button variant="editorial" onClick={onRestart} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Start Over with New Paper
        </Button>
      </div>
    </motion.div>
  );
};
