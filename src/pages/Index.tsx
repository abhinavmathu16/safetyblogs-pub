import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StepIndicator } from "@/components/StepIndicator";
import { SourceSelect } from "@/components/SourceSelect";
import { PaperFinder, type Paper } from "@/components/PaperFinder";
import { PaperReview } from "@/components/PaperReview";
import { UserThoughts } from "@/components/UserThoughts";
import { ArticleGenerator } from "@/components/ArticleGenerator";

const Index = () => {
  const [step, setStep] = useState(0);
  const [sourceName, setSourceName] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [review, setReview] = useState("");
  const [userThoughts, setUserThoughts] = useState("");

  const handleRestart = () => {
    setStep(0);
    setSourceName("");
    setSelectedPaper(null);
    setReview("");
    setUserThoughts("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight">
              T&S Research <span className="text-accent">Companion</span>
            </h1>
            <p className="text-muted-foreground font-body mt-2 text-lg">
              Discover papers. Form opinions. Generate practical articles.
            </p>
          </motion.div>
          <StepIndicator currentStep={step} />
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-5xl mx-auto px-4 py-8 pb-20">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <SourceSelect
              key="source"
              onSelect={(id, name) => {
                setSourceName(name);
                setStep(1);
              }}
            />
          )}

          {step === 1 && (
            <PaperFinder
              key="finder"
              sourceName={sourceName}
              onSelect={(paper) => {
                setSelectedPaper(paper);
                setStep(2);
              }}
              onBack={() => setStep(0)}
            />
          )}

          {step === 2 && selectedPaper && (
            <PaperReview
              key="review"
              paper={selectedPaper}
              onContinue={(rev) => {
                setReview(rev);
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && selectedPaper && (
            <UserThoughts
              key="thoughts"
              paper={selectedPaper}
              onContinue={(thoughts) => {
                setUserThoughts(thoughts);
                setStep(4);
              }}
              onBack={() => setStep(2)}
            />
          )}

          {step === 4 && selectedPaper && (
            <ArticleGenerator
              key="article"
              paper={selectedPaper}
              review={review}
              userThoughts={userThoughts}
              onRestart={handleRestart}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
