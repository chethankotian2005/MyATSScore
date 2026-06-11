"use client";
import { useEffect, useRef, useState } from "react";
import type { StreamStatus } from "@/hooks/useStreamAnalyze";
import { Check, X, AlertCircle } from "lucide-react";

interface AnalysisProgressProps {
  status: StreamStatus;
  score?: any;
  completedSteps: number[];
  activeStep: number;
  error?: string | null;
  onRetry?: () => void;
}

const STEPS = [
  { id: 1, label: "Uploading resume" },
  { id: 2, label: "Parsing document" },
  { id: 3, label: "Checking ATS formatting" },
  { id: 4, label: "Extracting keywords" },
  { id: 5, label: "Calculating your score" },
  { id: 6, label: "Generating AI insights" },
];

function StepIcon({ state, isError }: { state: "pending" | "active" | "complete"; isError?: boolean }) {
  if (isError) {
    return (
      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
        <X className="w-3.5 h-3.5 text-red-500" />
      </div>
    );
  }
  if (state === "complete") {
    return (
      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5 text-green-600" />
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="w-6 h-6 rounded-full border-2 border-[#1D9E75] border-t-transparent animate-spin shrink-0" />
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0" />
  );
}

function ElapsedTimer() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, []);

  return <span className="text-xs text-[#1D9E75] tabular-nums ml-auto shrink-0">{elapsed}s…</span>;
}

function ScoreReveal({ score }: { score: any }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [showGrade, setShowGrade] = useState(false);
  const targetScore = score?.total_score ?? 0;
  const grade = score?.grade ?? "F";

  useEffect(() => {
    if (!targetScore) return;
    const duration = 1200;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * targetScore));
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setShowGrade(true);
      }
    }
    requestAnimationFrame(tick);
  }, [targetScore]);

  const colorClass = targetScore < 50
    ? "text-red-500"
    : targetScore < 70
    ? "text-amber-500"
    : "text-green-500";

  const gradeColorClass = targetScore < 50
    ? "bg-red-100 text-red-600 border-red-200"
    : targetScore < 70
    ? "bg-amber-100 text-amber-600 border-amber-200"
    : "bg-green-100 text-green-600 border-green-200";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mt-4 animate-slide-in text-center">
      <p className="text-sm font-medium text-slate-500 mb-2">Your ATS Score</p>
      <div className={`text-6xl font-extrabold tabular-nums animate-pulse-score ${colorClass}`}>
        {displayScore}
      </div>
      <p className="text-xs text-slate-400 mt-1">out of 100</p>
      {showGrade && (
        <div className="mt-4 flex justify-center" style={{ perspective: "200px" }}>
          <span
            className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold border animate-flip-in ${gradeColorClass}`}
          >
            Grade {grade}
          </span>
        </div>
      )}
    </div>
  );
}

export function AnalysisProgress({
  status,
  score,
  completedSteps,
  activeStep,
  error,
  onRetry,
}: AnalysisProgressProps) {
  const isDone = status === "done";
  const isError = status === "error";

  const progressPercent = isDone
    ? 100
    : isError
    ? Math.round(((activeStep - 1) / 6) * 100)
    : Math.round(((Math.max(activeStep - 1, 0) + 0.5) / 6) * 100);

  return (
    <div className="space-y-4">
      {/* Steps card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">
          Analyzing your resume
        </h3>

        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const isComplete = isDone || completedSteps.includes(step.id);
            const isActive = !isDone && !isError && activeStep === step.id;
            const isStepError = isError && activeStep === step.id;
            const state: "pending" | "active" | "complete" = isComplete
              ? "complete"
              : isActive
              ? "active"
              : "pending";
            const isVisible = isDone || isComplete || isActive || isStepError || activeStep > step.id;

            if (!isVisible && step.id > activeStep) return null;

            return (
              <div
                key={step.id}
                className="flex items-center gap-3 animate-slide-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <StepIcon state={isStepError ? "active" : state} isError={isStepError} />
                <span
                  className={`text-sm transition-all duration-200 ${
                    isActive
                      ? "font-bold text-[#1D9E75]"
                      : isStepError
                      ? "font-bold text-red-500"
                      : isComplete
                      ? "text-slate-400 line-through decoration-slate-300"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
                {isActive && <ElapsedTimer />}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Score reveal */}
      {score && !isError && <ScoreReveal score={score} />}

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center animate-slide-in">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-700 font-medium mb-1">Analysis failed</p>
          <p className="text-red-500 text-sm mb-4">{error || "Something went wrong. Please try again."}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
