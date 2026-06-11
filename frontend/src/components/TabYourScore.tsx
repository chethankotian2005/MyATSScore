"use client";
import { ScoreCard } from "./ScoreCard";
import { KeywordGaps } from "./KeywordGaps";
import { AlertTriangle, AlertCircle, Info, Sparkles, CheckSquare, Square } from "lucide-react";

interface MissingItem {
  id: string;
  severity: "critical" | "important" | "suggested";
  title: string;
  description: string;
  fix_template: string;
}

interface TabYourScoreProps {
  score: any;
  insights: any;
  onAutoFix: () => void;
  onAddJobDescription?: (jd: string) => void;
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: "bg-red-100", text: "text-red-700", label: "Critical" },
    important: { bg: "bg-amber-100", text: "text-amber-700", label: "Important" },
    suggested: { bg: "bg-blue-100", text: "text-blue-700", label: "Suggested" },
  };
  const { bg, text, label } = config[severity] || config.suggested;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${bg} ${text}`}>
      {label}
    </span>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case "critical":
      return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
    case "important":
      return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
    default:
      return <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
  }
}

export function TabYourScore({
  score,
  insights,
  onAutoFix,
  onAddJobDescription,
}: TabYourScoreProps) {
  const items: MissingItem[] = score?.critical_missing || [];

  const criticalCount = items.filter((i) => i.severity === "critical").length;
  const importantCount = items.filter((i) => i.severity === "important").length;
  const suggestedCount = items.filter((i) => i.severity === "suggested").length;

  const scrollToJD = () => {
    // The JD input usually has an id or we can just scroll to the top left
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const jdInput = document.querySelector('textarea[placeholder*="job description"]');
    if (jdInput instanceof HTMLElement) {
      setTimeout(() => jdInput.focus(), 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Score Card — kept as-is */}
      <ScoreCard score={score} />

      {/* Keyword Gaps — kept as-is */}
      <KeywordGaps score={score} insights={insights} onAddJobDescription={onAddJobDescription} />

      {/* Critical Issues */}
      {items.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <p className="text-green-700 font-medium text-lg">
            ✅ No critical issues found — your resume covers all the basics!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {criticalCount > 0 ? "🚨 Issues Found" : "💡 Improvements Found"}
              </h3>
              <div className="flex gap-3 text-sm mt-1">
                {criticalCount > 0 && (
                  <span className="text-red-600 font-medium">{criticalCount} critical</span>
                )}
                {importantCount > 0 && (
                  <span className="text-amber-600 font-medium">{importantCount} important</span>
                )}
                {suggestedCount > 0 && (
                  <span className="text-blue-600 font-medium">{suggestedCount} suggestions</span>
                )}
              </div>
            </div>
          </div>

          {/* Issue List */}
          <div className="space-y-3">
            {items.map((item) => {
              return (
                <div
                  key={item.id}
                  className="w-full text-left flex items-start gap-3 p-4 rounded-xl border bg-slate-50 border-slate-200"
                >
                  {/* Icon */}
                  <SeverityIcon severity={item.severity} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800">{item.title}</span>
                      <SeverityBadge severity={item.severity} />
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-Fix CTA */}
      <button
        onClick={onAutoFix}
        className="w-full flex items-center justify-center gap-2.5 bg-[#1D9E75] hover:bg-[#178a66] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-[#1D9E75]/20 transition-all duration-200 hover:shadow-xl hover:shadow-[#1D9E75]/30 hover:-translate-y-0.5 text-base"
      >
        <Sparkles className="w-5 h-5" />
        Auto-Fix & Download
      </button>

      {/* Subtle Link for General Mode */}
      {score?.mode === "general" && (
        <div className="text-center mt-4">
          <button
            onClick={scrollToJD}
            className="text-sm text-slate-500 hover:text-[#1D9E75] transition-colors"
          >
            Want a job-specific score? Add a Job Description ↑
          </button>
        </div>
      )}
    </div>
  );
}
