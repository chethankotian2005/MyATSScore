"use client";
import { useState } from "react";
import { Sparkles, ChevronDown, BrainCircuit, FileText } from "lucide-react";

interface TabAIImprovementsProps {
  insights: any;
  status: string;
  streamingText: string;
}

function formatSectionLabel(key: string): string {
  if (key === "formatting_issues") return "Formatting Feedback";
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) + " Feedback";
}

export function TabAIImprovements({ insights, status, streamingText }: TabAIImprovementsProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Still streaming — show live feed
  if (status === "streaming") {
    return (
      <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-[#1D9E75]" />
          <span className="text-sm font-semibold text-slate-200">AI is analyzing your resume…</span>
        </div>
        <div className="p-6 max-h-64 overflow-y-auto">
          <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
            {streamingText}
            <span className="inline-block w-1.5 h-4 bg-[#1D9E75] ml-0.5 animate-pulse rounded-sm" />
          </pre>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-400">AI insights will appear here once analysis is complete.</p>
      </div>
    );
  }

  const { top_3_improvements, rewritten_summary, section_feedback } = insights;

  return (
    <div className="space-y-6">
      {/* Top 3 Actionable Fixes */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Top 3 Actionable Fixes
        </h3>
        <div className="space-y-3">
          {top_3_improvements?.map((improvement: string, i: number) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100"
            >
              <div className="bg-amber-100 text-amber-700 w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">
                {i + 1}
              </div>
              <p className="text-slate-800 text-sm leading-relaxed">{improvement}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Rewritten Summary — prominently placed */}
      {rewritten_summary && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1D9E75] via-emerald-400 to-teal-300" />
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2 mt-1">
            <FileText className="w-5 h-5 text-[#1D9E75]" />
            AI Rewritten Summary
          </h3>
          <p className="text-slate-500 text-xs mb-3">
            This AI-optimized summary will be automatically applied when you download your resume.
          </p>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
            <p className="text-slate-700 leading-relaxed text-sm italic">
              &ldquo;{rewritten_summary}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Section Feedback Accordion */}
      {section_feedback && Object.keys(section_feedback).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 p-6 border-b border-slate-100">
            Section-by-Section Feedback
          </h3>
          <div className="divide-y divide-slate-100">
            {Object.entries(section_feedback).map(([section, feedback]: [string, any]) => {
              if (!feedback || section === "general") return null;
              const isOpen = openSection === section;
              return (
                <div key={section} className="w-full">
                  <button
                    onClick={() => setOpenSection(isOpen ? null : section)}
                    className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-semibold text-slate-800 text-sm">
                      {formatSectionLabel(section)}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 bg-slate-50 animate-slide-in">
                      <p className="text-slate-600 text-sm leading-relaxed border-l-4 border-[#1D9E75] pl-4">
                        {feedback}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
