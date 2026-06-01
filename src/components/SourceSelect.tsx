import { motion } from "framer-motion";
import { SOURCES } from "@/lib/sources";

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
