"use client";
import { Sparkles, Check } from "lucide-react";

interface AutoFixOverlayProps {
  isVisible: boolean;
  currentStep: number;
}

const STEPS = [
  { id: 1, label: "Applying AI suggestions..." },
  { id: 2, label: "Optimizing for ATS formatting..." },
  { id: 3, label: "Generating your PDF..." },
];

export function AutoFixOverlay({ isVisible, currentStep }: AutoFixOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 flex flex-col items-center text-center animate-slide-in">
        {/* Animated Sparkle Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-[#1D9E75] rounded-full flex items-center justify-center mb-6 animate-autofix-pulse shadow-lg shadow-[#1D9E75]/30">
          <Sparkles className="w-9 h-9 text-white" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Upgrading Your Resume
        </h2>
        <p className="text-sm text-slate-500 mb-8">
          This takes about 5–10 seconds
        </p>

        {/* Step Indicators */}
        <div className="w-full space-y-4 mb-6">
          {STEPS.map((step) => {
            const isComplete = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 ${
                  isComplete
                    ? "bg-emerald-50 border border-emerald-200"
                    : isActive
                    ? "bg-slate-50 border border-slate-200"
                    : "bg-slate-50/50 border border-transparent"
                }`}
              >
                {/* Step Circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isComplete
                      ? "bg-[#1D9E75] text-white"
                      : isActive
                      ? "bg-white border-2 border-[#1D9E75] text-[#1D9E75]"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{step.id}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isComplete
                      ? "text-emerald-700"
                      : isActive
                      ? "text-slate-800"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>

                {/* Active spinner */}
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-5 h-5 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Complete checkmark label */}
                {isComplete && (
                  <span className="ml-auto text-xs font-semibold text-emerald-600">
                    Done
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#1D9E75] to-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min((currentStep / 4) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
