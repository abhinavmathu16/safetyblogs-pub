import { motion } from "framer-motion";
import { BookOpen, Search, MessageSquare, FileText, ChevronRight } from "lucide-react";

const steps = [
  { icon: Search, label: "Select Source" },
  { icon: BookOpen, label: "Find Paper" },
  { icon: BookOpen, label: "Review" },
  { icon: MessageSquare, label: "Your Thoughts" },
  { icon: FileText, label: "Article" },
];

interface StepIndicatorProps {
  currentStep: number;
}

export const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-6">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        return (
          <div key={i} className="flex items-center gap-1 sm:gap-2">
            <motion.div
              animate={{
                scale: isActive ? 1.1 : 1,
              }}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-display font-semibold transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : isDone
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{step.label}</span>
            </motion.div>
            {i < steps.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
};
