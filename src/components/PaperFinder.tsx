import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { findPapers } from "@/lib/api/ts-research";
import { getTopicsForSource } from "@/lib/sources";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface Paper {
  title: string;
  authors: string;
  year: string | number;
  source: string;
  brief: string;
  url?: string;
}

interface PaperFinderProps {
  sourceId: string;
  sourceName: string;
  onSelect: (paper: Paper) => void;
  onBack: () => void;
}

export const PaperFinder = ({ sourceId, sourceName, onSelect, onBack }: PaperFinderProps) => {
  const topics = getTopicsForSource(sourceId);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [parseError, setParseError] = useState(false);

  // Reset when source changes
  useEffect(() => {
    setSelectedTopic("");
    setCustomTopic("");
    setPapers([]);
    setParseError(false);
  }, [sourceId]);

  const effectiveTopic =
    selectedTopic === "custom"
      ? customTopic
      : topics.find((t) => t.value === selectedTopic)?.label || "";

  const handleSearch = async () => {
    setLoading(true);
    setPapers([]);
    setParseError(false);

    let accumulated = "";

    try {
      await findPapers(sourceId, sourceName, effectiveTopic, {
        onDelta: (text) => {
          accumulated += text;
        },
        onDone: () => {
          try {
            const jsonMatch = accumulated.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              setPapers(parsed);
            } else {
              setParseError(true);
            }
          } catch (e) {
            console.error("Failed to parse papers:", e);
            setParseError(true);
            toast.error("Failed to parse paper results. Please try again.");
          }
          setLoading(false);
        },
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to find papers");
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
          Searching: {sourceName}
        </p>
        <h2 className="text-3xl font-display font-bold mb-2">Find a Paper</h2>
        <p className="text-muted-foreground font-body">
          Topics curated for {sourceName}.
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-8 space-y-3">
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="font-body">
            <SelectValue placeholder="Choose a topic..." />
          </SelectTrigger>
          <SelectContent>
            {topics.map((t) => (
              <SelectItem key={t.value} value={t.value} className="font-body">
                {t.label}
              </SelectItem>
            ))}
            <SelectItem value="custom" className="font-body font-semibold">
              ✏️ Custom topic...
            </SelectItem>
          </SelectContent>
        </Select>

        {selectedTopic === "custom" && (
          <Input
            placeholder="Type your custom topic..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="font-body"
            autoFocus
          />
        )}

        <Button
          variant="editorial"
          onClick={handleSearch}
          disabled={loading || (!selectedTopic || (selectedTopic === "custom" && !customTopic.trim()))}
          className="w-full"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search Papers"}
        </Button>
      </div>

      {loading && papers.length === 0 && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground font-body italic">
            Fetching live papers from {sourceName}...
          </p>
        </div>
      )}

      {!loading && parseError && (
        <div className="max-w-xl mx-auto text-center py-8 px-6 rounded-lg border-2 border-dashed border-border bg-card">
          <p className="font-display font-bold text-lg mb-2">No recent papers found</p>
          <p className="text-sm text-muted-foreground font-body">
            We couldn't find papers on <span className="italic">{effectiveTopic}</span> at {sourceName}. Try a broader topic or a different source.
          </p>
        </div>
      )}

      {papers.length > 0 && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest text-center mb-6">
            Select a paper to review
          </p>
          {papers.map((paper, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelect(paper)}
              className="group w-full text-left p-6 rounded-lg border-2 border-border bg-card hover:border-accent hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-mono text-accent mb-1">
                    {paper.source} · {paper.year}
                  </p>
                  <h3 className="font-display font-bold text-lg mb-1 group-hover:text-accent transition-colors">
                    {paper.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{paper.authors}</p>
                  <p className="text-sm font-body leading-relaxed">{paper.brief}</p>
                  {paper.url && (
                    <p className="text-xs font-mono text-accent/70 mt-2 truncate">{paper.url}</p>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <div className="text-center mt-8">
        <Button variant="editorial-outline" onClick={onBack}>
          ← Back to Sources
        </Button>
      </div>
    </motion.div>
  );
};
