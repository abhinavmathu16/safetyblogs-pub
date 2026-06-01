import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Paper } from "@/components/PaperFinder";

const PROMPTS = [
  "What surprised you most about this paper's findings?",
  "How does this relate to challenges you've seen in your own work?",
  "What practical applications come to mind?",
  "Do you agree or disagree with the methodology? Why?",
  "What questions does this paper leave unanswered?",
];

interface UserThoughtsProps {
  paper: Paper;
  review: string;
  initialThoughts?: string;
  onContinue: (thoughts: string) => void;
  onBack: () => void;
}

export const UserThoughts = ({ paper, review, initialThoughts = "", onContinue, onBack }: UserThoughtsProps) => {
  const [thoughts, setThoughts] = useState(initialThoughts);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto"
    >
      <div className="text-center mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
          Your Perspective
        </p>
        <h2 className="text-3xl font-display font-bold mb-2">What Do You Think?</h2>
        <p className="text-muted-foreground font-body">
          Your thoughts will shape the practical article we generate.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Paper summary */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="bg-card border-2 border-border rounded-lg p-6 max-h-[70vh] overflow-y-auto">
            <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
              Paper Summary
            </p>
            <p className="font-display font-bold text-lg leading-tight mb-1">{paper.title}</p>
            <p className="text-xs text-muted-foreground font-body mb-4">
              {paper.authors} · {paper.year}
            </p>
            {review ? (
              <div className="prose-editorial prose-sm">
                <ReactMarkdown>{review}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No summary available.</p>
            )}
          </div>
        </div>

        {/* Right: Thoughts */}
        <div className="bg-card border-2 border-border rounded-lg p-6">
          <div className="space-y-2 mb-6">
            <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
              Consider these questions:
            </p>
            {PROMPTS.map((prompt, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-sm text-muted-foreground italic pl-4 border-l-2 border-accent/30"
              >
                {prompt}
              </motion.p>
            ))}
          </div>

          <Textarea
            placeholder="Share your thoughts, reactions, and ideas..."
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
            className="min-h-[260px] font-body text-base leading-relaxed resize-none"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="editorial-outline" onClick={onBack}>
          ← Back
        </Button>
        <Button
          variant="editorial"
          onClick={() => onContinue(thoughts)}
          disabled={!thoughts.trim()}
        >
          Generate Article →
        </Button>
      </div>
    </motion.div>
  );
};
