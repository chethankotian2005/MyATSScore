"use client";
import { ResumeUploader } from "@/components/ResumeUploader";
import { JobDescInput } from "@/components/JobDescInput";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { ResultsTabs } from "@/components/ResultsTabs";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { useAnalyzeStore } from "@/store/analyzeStore";
import { useStreamAnalyze } from "@/hooks/useStreamAnalyze";
import { useProgressSteps } from "@/hooks/useProgressSteps";
import { AdminNav } from "@/components/AdminNav";
import { UserNav } from "@/components/UserNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Link from "next/link";
import { useCallback, useEffect, useState, useRef } from "react";

export default function AnalyzePage() {
  const { file, jobDescription, setJobDescription } = useAnalyzeStore();
  const stream = useStreamAnalyze();
  const progress = useProgressSteps();
  const [showResults, setShowResults] = useState(false);
  const [fadeProgress, setFadeProgress] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const isInProgress =
    stream.status === "uploading" ||
    stream.status === "scoring" ||
    stream.status === "streaming";

  // Sync real status → progress step activations
  useEffect(() => {
    if (stream.status === "scoring") progress.activateStep(5);
    if (stream.status === "streaming") progress.activateStep(6);
    if (stream.status === "done") {
      progress.completeAll();
      // Wait 600ms so user sees completed state + score, then transition
      const t = setTimeout(() => {
        setFadeProgress(true);
        setTimeout(() => {
          setShowResults(true);
          // Scroll to results
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }, 400);
      }, 600);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.status]);

  const handleAnalyze = useCallback(() => {
    if (!file) return;
    setShowResults(false);
    setFadeProgress(false);
    progress.startProgress();
    stream.startAnalysis(file, jobDescription);
  }, [file, jobDescription, progress, stream]);

  const handleRetry = useCallback(() => {
    progress.reset();
    stream.reset();
    setShowResults(false);
    setFadeProgress(false);
  }, [progress, stream]);



  const handleAddJobDescription = (jd: string) => {
    if (!file) return;
    setJobDescription(jd);
    setFadeProgress(false);
    setShowResults(false);
    stream.startAnalysis(file, jd);
    progress.startProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showProgressUI = isInProgress || (stream.status === "done" && !showResults);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight text-[#1D9E75]">
            myatsscore.app
          </Link>
          <nav className="flex gap-6 items-center">
            <AdminNav />
            <Link href="/#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 font-medium">How it Works</Link>
            <UserNav />
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 grid lg:grid-cols-12 gap-10">
        {/* Left Column: Inputs (hidden during progress) */}
        <div
          className={`lg:col-span-5 space-y-6 h-fit sticky top-10 transition-opacity duration-300 ${
            showProgressUI ? "opacity-40 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold mb-8">Scan Your Resume</h1>
            <ResumeUploader />
            <JobDescInput />
            <AnalyzeButton status={stream.status} onAnalyze={handleAnalyze} />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7">
          {/* Idle — empty state */}
          {stream.status === "idle" && !showResults && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white border border-slate-200 border-dashed rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Awaiting Analysis</h2>
              <p className="text-slate-500 max-w-sm">
                Upload your resume and paste a job description to instantly see how ATS systems score you.
              </p>
            </div>
          )}

          {/* Progress UI */}
          {showProgressUI && (
            <div
              className={`transition-opacity duration-400 ${
                fadeProgress ? "opacity-0" : "opacity-100"
              }`}
            >
              <AnalysisProgress
                status={stream.status}
                score={stream.score}
                completedSteps={progress.completedSteps}
                activeStep={progress.activeStep}
                error={stream.error}
                onRetry={handleRetry}
              />
            </div>
          )}

          {/* Error state (show in progress component, retry resets to idle) */}
          {stream.status === "error" && !showProgressUI && (
            <AnalysisProgress
              status={stream.status}
              completedSteps={progress.completedSteps}
              activeStep={progress.activeStep}
              error={stream.error}
              onRetry={handleRetry}
            />
          )}

          {/* Results — new 3-tab layout */}
          {showResults && (
            <div ref={resultsRef}>
              <ErrorBoundary>
                <ResultsTabs
                  score={stream.score}
                  insights={stream.insights}
                  parsedResume={stream.parsedResume}
                  streamingText={stream.streamingText}
                  status={stream.status}
                  onAddJobDescription={handleAddJobDescription}
                />
              </ErrorBoundary>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
