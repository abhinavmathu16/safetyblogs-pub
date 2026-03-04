import { useState } from "react";
import { motion } from "framer-motion";
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
  onContinue: (thoughts: string) => void;
  onBack: () => void;
}

export const UserThoughts = ({ paper, onContinue, onBack }: UserThoughtsProps) => {
  const [thoughts, setThoughts] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
          Your Perspective
        </p>
        <h2 className="text-3xl font-display font-bold mb-2">
          What Do You Think?
        </h2>
        <p className="text-muted-foreground font-body">
          Your thoughts will shape the practical article we generate.
        </p>
      </div>

      <div className="bg-card border-2 border-border rounded-lg p-6 mb-6">
        <p className="font-display font-bold text-lg mb-4">
          Re: "{paper.title}"
        </p>
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
          className="min-h-[200px] font-body text-base leading-relaxed resize-none"
        />
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
