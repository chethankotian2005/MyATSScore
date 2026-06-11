"use client";
import { useAnalyzeStore } from '@/store/analyzeStore';
import { ClipboardPaste } from 'lucide-react';

export function JobDescInput() {
  const { jobDescription, setJobDescription } = useAnalyzeStore();

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJobDescription(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  return (
    <div className="w-full mt-8">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">2. Job Description</h2>
          <p className="text-xs text-slate-400 mt-0.5">Optional — paste for job-specific analysis</p>
        </div>
        <button 
          onClick={handlePaste}
          className="text-xs flex items-center gap-1 text-[#1D9E75] hover:text-[#157e5d] font-medium transition-colors"
        >
          <ClipboardPaste className="w-3 h-3" />
          Paste from clipboard
        </button>
      </div>
      <div className="relative">
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Skip this to get a general ATS score, or paste job requirements for a targeted analysis..."
          className="w-full h-48 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1D9E75] focus:border-[#1D9E75] outline-none resize-none text-sm text-slate-700 bg-white shadow-sm"
        />
        <div className="absolute bottom-3 right-3 text-xs text-slate-400">
          {jobDescription.length} characters
        </div>
      </div>
    </div>
  );
}
