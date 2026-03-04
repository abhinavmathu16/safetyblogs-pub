import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { reviewPaper } from "@/lib/api/ts-research";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Paper } from "@/components/PaperFinder";

interface PaperReviewProps {
  paper: Paper;
  onContinue: (review: string) => void;
  onBack: () => void;
}

export const PaperReview = ({ paper, onContinue, onBack }: PaperReviewProps) => {
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let accumulated = "";
    reviewPaper(paper.title, {
      onDelta: (text) => {
        accumulated += text;
        setReview(accumulated);
      },
      onDone: () => setLoading(false),
    }).catch((e) => {
      toast.error(e.message || "Failed to review paper");
      setLoading(false);
    });
  }, [paper.title]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
          Paper Review
        </p>
        <h2 className="text-3xl font-display font-bold mb-2">{paper.title}</h2>
        <p className="text-muted-foreground font-body">
          {paper.authors} · {paper.year}
        </p>
      </div>

      <div className="bg-card border-2 border-border rounded-lg p-8">
        {review ? (
          <div className="prose-editorial">
            <ReactMarkdown>{review}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
            <p className="text-muted-foreground italic">Generating review...</p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="editorial-outline" onClick={onBack}>
          ← Back
        </Button>
        <Button variant="editorial" onClick={() => onContinue(review)} disabled={loading}>
          Share Your Thoughts →
        </Button>
      </div>
    </motion.div>
  );
};
