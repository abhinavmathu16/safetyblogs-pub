import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { StepIndicator } from "@/components/StepIndicator";
import { SourceSelect } from "@/components/SourceSelect";
import { PaperFinder, type Paper } from "@/components/PaperFinder";
import { PaperReview } from "@/components/PaperReview";
import { UserThoughts } from "@/components/UserThoughts";
import { ArticleGenerator } from "@/components/ArticleGenerator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LibraryBig, LogOut, LogIn } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [sourceId, setSourceId] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [review, setReview] = useState("");
  const [userThoughts, setUserThoughts] = useState("");
  const [article, setArticle] = useState("");

  const handleRestart = () => {
    setStep(0);
    setSourceId("");
    setSourceName("");
    setSelectedPaper(null);
    setReview("");
    setUserThoughts("");
    setArticle("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-end gap-2 mb-4">
            <Link to="/library">
              <Button variant="editorial-outline" size="sm" className="gap-2">
                <LibraryBig className="w-4 h-4" /> My Library
              </Button>
            </Link>
            {user ? (
              <Button
                variant="editorial-outline"
                size="sm"
                onClick={() => supabase.auth.signOut()}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="editorial-outline" size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" /> Sign in
                </Button>
              </Link>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight">
              Platform Integrity Research <span className="text-accent">Companion</span>
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
                setSourceId(id);
                setSourceName(name);
                setStep(1);
              }}
            />
          )}

          {step === 1 && (
            <PaperFinder
              key="finder"
              sourceId={sourceId}
              sourceName={sourceName}
              onSelect={(paper) => {
                if (paper.title !== selectedPaper?.title) {
                  setReview("");
                  setArticle("");
                  setUserThoughts("");
                }
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
              initialReview={review}
              onReviewChange={setReview}
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
              review={review}
              initialThoughts={userThoughts}
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
              sourceName={sourceName}
              review={review}
              userThoughts={userThoughts}
              initialArticle={article}
              onArticleChange={setArticle}
              onRestart={handleRestart}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
