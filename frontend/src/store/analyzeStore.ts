import { create } from 'zustand';

export interface AnalysisResult {
  status: string;
  parsed_resume: any;
  scan_id?: string;
  score: {
    mode: 'general' | 'jd';
    total_score: number;
    grade: string;
    breakdown: {
      keyword: number;
      section: number;
      formatting: number;
      quantification: number;
      length: number;
    };
    matched_keywords: string[];
    missing_keywords: string[];
    suggestions: string[];
  };
  ai_analysis: {
    top_3_improvements: string[];
    keyword_suggestions: string[];
    rewritten_summary: string;
    section_feedback: {
      [key: string]: string;
    };
  };
}

interface AnalyzeState {
  file: File | null;
  setFile: (file: File | null) => void;
  jobDescription: string;
  setJobDescription: (text: string) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (status: boolean) => void;
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;
  sessionId: string;
  scanId: string | null;
  setScanId: (id: string | null) => void;
}

const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('myats_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('myats_session_id', sid);
  }
  return sid;
};

export const useAnalyzeStore = create<AnalyzeState>((set: any) => ({
  file: null,
  setFile: (file: File | null) => set({ file }),
  jobDescription: '',
  setJobDescription: (text: string) => set({ jobDescription: text }),
  isAnalyzing: false,
  setIsAnalyzing: (status: boolean) => set({ isAnalyzing: status }),
  result: null,
  setResult: (result: AnalysisResult | null) => set({ result }),
  sessionId: getSessionId(),
  scanId: null,
  setScanId: (id: string | null) => set({ scanId: id }),
}));
