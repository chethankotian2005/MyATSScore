"use client";
import { Sparkles, ChevronDown, BrainCircuit } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { StreamStatus } from '@/hooks/useStreamAnalyze';

interface AIInsightsProps {
  status: StreamStatus;
  streamingText: string;
  insights: any | null;
}

function StreamingText({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  if (!text && !isStreaming) return null;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
        <BrainCircuit className="w-4 h-4 text-[#1D9E75]" />
        <span className="text-sm font-semibold text-slate-200">AI is analyzing your resume…</span>
      </div>
      <div
        ref={containerRef}
        className="p-6 max-h-64 overflow-y-auto"
      >
        <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
          {text}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-[#1D9E75] ml-0.5 animate-pulse rounded-sm" />
          )}
        </pre>
      </div>
    </div>
  );
}

function InsightCards({ insights }: { insights: any }) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const { top_3_improvements, rewritten_summary, section_feedback } = insights;

  return (
    <div className="space-y-8">
      {/* Top 3 Improvements */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Top 3 Actionable Fixes
        </h3>
        <div className="space-y-4">
          {top_3_improvements?.map((improvement: string, i: number) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="bg-amber-100 text-amber-700 w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">
                {i + 1}
              </div>
              <p className="text-slate-800 text-sm leading-relaxed">{improvement}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rewritten Summary */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          AI Rewritten Summary
        </h3>
        <div className="text-slate-700 leading-relaxed">
          {rewritten_summary}
        </div>
      </div>

      {/* Section Feedback Accordion */}
      {section_feedback && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="text-xl font-bold text-slate-900 p-8 border-b border-slate-100">Section Feedback</h3>
          <div className="divide-y divide-slate-100">
            {Object.entries(section_feedback).map(([section, feedback]: [string, any]) => (
              <div key={section} className="w-full">
                <button 
                  onClick={() => setOpenSection(openSection === section ? null : section)}
                  className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-800 capitalize">{section}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSection === section ? 'rotate-180' : ''}`} />
                </button>
                {openSection === section && (
                  <div className="px-6 pb-6 pt-0 bg-slate-50">
                    <p className="text-slate-600 text-sm leading-relaxed border-l-4 border-[#1D9E75] pl-4">{feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AIInsights({ status, streamingText, insights }: AIInsightsProps) {
  if (status === "idle" || status === "uploading" || status === "scoring") {
    return null;
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Streaming text — visible while streaming */}
      {status === "streaming" && (
        <StreamingText text={streamingText} isStreaming={true} />
      )}

      {/* Final parsed insight cards — visible when done */}
      {status === "done" && insights && (
        <InsightCards insights={insights} />
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">AI analysis failed. Your ATS score and keywords are still available above.</p>
        </div>
      )}
    </div>
  );
}
