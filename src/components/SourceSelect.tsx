import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const SOURCES = [
  {
    id: "jots",
    name: "Journal of Online Trust and Safety",
    org: "Stanford Internet Observatory",
    description: "Premier peer-reviewed journal covering content moderation, transparency, deepfakes, and misinformation.",
  },
  {
    id: "tspa",
    name: "TSPA Trust & Safety Library",
    org: "Trust and Safety Professional Association",
    description: "Curated white papers, podcasts, and journal articles for practitioners.",
  },
  {
    id: "arxiv",
    name: "ArXiv.org (CS.HC / CS.CY)",
    org: "arXiv",
    description: "Latest technical research on content moderation, algorithmic safety, and platform governance.",
  },
  {
    id: "stanford",
    name: "Stanford Internet Observatory",
    org: "Stanford University",
    description: "Rapid-response white papers on election integrity and platform abuse.",
  },
  {
    id: "berkman",
    name: "Berkman Klein Center",
    org: "Harvard University",
    description: "Technology, law, and society — digital child safety and social media reform.",
  },
  {
    id: "cltc",
    name: "Center for Long-Term Cybersecurity",
    org: "UC Berkeley",
    description: "AI risk management, digital harms, and public interest cybersecurity.",
  },
  {
    id: "csmap",
    name: "Center for Social Media and Politics",
    org: "NYU",
    description: "Data-heavy research on social media's impact on political discourse.",
  },
  {
    id: "tsrc",
    name: "Trust & Safety Research Conference",
    org: "Stanford (Annual)",
    description: "Cutting-edge findings presented annually, with archived proceedings.",
  },
  {
    id: "facct",
    name: "ACM FAccT Conference",
    org: "ACM",
    description: "Top-tier academic conference on algorithmic safety, fairness, and bias.",
  },
];

interface SourceSelectProps {
  onSelect: (sourceId: string, sourceName: string) => void;
}

export const SourceSelect = ({ onSelect }: SourceSelectProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display font-bold mb-2">Choose Your Source</h2>
        <p className="text-muted-foreground font-body">
          Select a research source to discover trust & safety papers.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SOURCES.map((source, i) => (
          <motion.button
            key={source.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            onClick={() => onSelect(source.id, source.name)}
            className="group text-left p-5 rounded-lg border-2 border-border bg-card hover:border-accent hover:shadow-lg transition-all duration-300"
          >
            <p className="text-xs font-mono uppercase tracking-widest text-accent mb-1">
              {source.org}
            </p>
            <h3 className="font-display font-bold text-lg mb-2 group-hover:text-accent transition-colors">
              {source.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {source.description}
            </p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
