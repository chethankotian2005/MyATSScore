"use client";
import { useAnalyzeStore } from '@/store/analyzeStore';
import { Loader2 } from 'lucide-react';
import type { StreamStatus } from '@/hooks/useStreamAnalyze';

interface AnalyzeButtonProps {
  status: StreamStatus;
  onAnalyze: () => void;
}

export function AnalyzeButton({ status, onAnalyze }: AnalyzeButtonProps) {
  const { file } = useAnalyzeStore();

  const isWorking = status === "uploading" || status === "scoring" || status === "streaming";
  const isDisabled = !file || isWorking;

  const statusLabels: Record<string, string> = {
    uploading: "Uploading resume...",
    scoring: "Scoring your resume...",
    streaming: "Generating AI insights...",
  };

  return (
    <div className="w-full mt-8">
      <button
        onClick={onAnalyze}
        disabled={isDisabled}
        className={`w-full h-14 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
          isDisabled ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#1D9E75] text-white hover:bg-[#157e5d] shadow-lg hover:shadow-xl'
        }`}
      >
        {isWorking ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            {statusLabels[status] || "Analyzing..."}
          </>
        ) : (
          "Scan My Resume"
        )}
      </button>
    </div>
  );
}
