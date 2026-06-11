"use client";
import { useState } from 'react';
import { useAnalyzeStore } from '@/store/analyzeStore';
import { Search, FileText, ArrowRight } from 'lucide-react';

interface KeywordGapsProps {
  score?: any;
  insights?: any;
  onAddJobDescription?: (jd: string) => void;
}

export function KeywordGaps({ score: scoreProp, insights: insightsProp, onAddJobDescription }: KeywordGapsProps) {
  const { result } = useAnalyzeStore();
  const [localJd, setLocalJd] = useState('');
  const scoreData = scoreProp || result?.score;

  if (!scoreData) return null;

  const isGeneral = scoreData.mode === 'general';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localJd.trim() && onAddJobDescription) {
      onAddJobDescription(localJd);
    }
  };

  // In General Mode — show prompt card instead of keyword analysis
  if (isGeneral) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-8">
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Keyword Analysis Unavailable</h3>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Add a job description to see which keywords you're matching and which you're missing. 
            This enables a targeted, job-specific ATS analysis.
          </p>

          {/* Inline JD Input */}
          <form onSubmit={handleSubmit} className="w-full max-w-md relative flex items-center">
            <textarea
              value={localJd}
              onChange={(e) => setLocalJd(e.target.value)}
              placeholder="Paste a job description to unlock keyword matching..."
              className="w-full min-h-[52px] max-h-[150px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pr-14 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y transition-all"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!localJd.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // JD Mode — full keyword analysis
  const { matched_keywords, missing_keywords } = scoreData;
  const keyword_suggestions = insightsProp?.keyword_suggestions || result?.ai_analysis?.keyword_suggestions || [];

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-8">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Keyword Analysis</h3>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Keywords Found ({matched_keywords.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {matched_keywords.map((kw: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">
                {kw}
              </span>
            ))}
            {matched_keywords.length === 0 && <p className="text-sm text-slate-400">No matching keywords found.</p>}
          </div>
        </div>

        <div className="relative">
          <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Missing Keywords ({missing_keywords.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {missing_keywords.map((kw: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Suggestions block */}
      {keyword_suggestions && keyword_suggestions.length > 0 && (
        <div className="mt-8 pt-8 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Contextual Keyword Suggestions</h4>
          <ul className="space-y-2">
            {keyword_suggestions.map((suggestion: string, i: number) => (
              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-[#1D9E75] mt-0.5">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
