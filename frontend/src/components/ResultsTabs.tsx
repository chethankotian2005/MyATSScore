"use client";
import { useState, useCallback } from "react";
import { TabYourScore } from "@/components/TabYourScore";
import { TabAIImprovements } from "@/components/TabAIImprovements";
import { TabDownloadResume } from "@/components/TabDownloadResume";
import { AutoFixOverlay } from "@/components/AutoFixOverlay";
import { callAutoFix } from "@/lib/autoFixApi";
import { generateAutoFixPDF } from "@/lib/generatePDF";
import { BarChart3, Sparkles, Download } from "lucide-react";
import { LoginGateModal } from "@/components/LoginGateModal";
import { useAnalyzeStore } from "@/store/analyzeStore";

interface ResultsTabsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  score: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insights: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsedResume: any;
  streamingText: string;
  status: string;
  onAddJobDescription?: (jd: string) => void;
}

const TABS = [
  { id: "score", label: "Your Score", icon: BarChart3 },
  { id: "ai", label: "AI Improvements", icon: Sparkles },
  { id: "download", label: "Download Resume", icon: Download },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ResultsTabs({
  score,
  insights,
  parsedResume,
  streamingText,
  status,
  onAddJobDescription,
}: ResultsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("score");

  // Auto-fix state
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixStep, setAutoFixStep] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [autoFixResult, setAutoFixResult] = useState<any>(null);

  // Modal state
  const [isLoginGateOpen, setIsLoginGateOpen] = useState(false);
  const [isHardBlock, setIsHardBlock] = useState(false);

  // Recalculate state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recalculatedScore, setRecalculatedScore] = useState<any>(null);
  const [isRecalculatingScore, setIsRecalculatingScore] = useState(false);
  
  const getPdfCount = () => typeof window !== "undefined" ? parseInt(localStorage.getItem('myats_pdf_count') || '0') : 0;
  const getDismissCount = () => typeof window !== "undefined" ? parseInt(localStorage.getItem('myats_dismiss_count') || '0') : 0;
  
  const pdfCount = getPdfCount();

  const improvementsCount = insights?.top_3_improvements?.length || 0;

  const handleAutoFix = useCallback(async () => {
    const resumeText = parsedResume?.raw_text || "";
    if (!resumeText.trim()) {
      alert("No resume text available. Please re-analyze your resume.");
      return;
    }

    // Get auth token
    let token: string | null = null;
    try {
      const { getCurrentUserToken } = await import("@/lib/firebase");
      token = await getCurrentUserToken();
    } catch {}

    const count = getPdfCount();
    if (!token && count >= 3) {
      setIsHardBlock(true);
      setIsLoginGateOpen(true);
      return;
    }

    setIsAutoFixing(true);
    setAutoFixStep(1);
    setAutoFixResult(null);

    const scanId = useAnalyzeStore.getState().scanId;

    await callAutoFix(
      {
        resume_text: resumeText,
        score_data: score || {},
        insights: insights || {},
        scan_id: scanId || undefined,
      },
      token,
      // onStep
      (step) => {
        setAutoFixStep(step);
      },
      // onDone
      async (data) => {
        setAutoFixStep(4); // All steps complete
        setAutoFixResult(data);

        let newCount = count;
        if (!token) {
          newCount = count + 1;
          localStorage.setItem('myats_pdf_count', newCount.toString());
        }

        try {
          await generateAutoFixPDF(data);
        } catch (err) {
          console.error("PDF generation failed:", err);
          alert("PDF generation failed. Please try the manual download in the Download tab.");
        }
        // Hide overlay after a brief delay so user sees completion
        setTimeout(() => {
          setIsAutoFixing(false);
          setAutoFixStep(0);
          setActiveTab("download");

          if (!token && newCount <= 3) {
            // Show soft prompt on success if they haven't dismissed too many times
            const dismisses = getDismissCount();
            if (dismisses < 3) {
              setIsHardBlock(false);
              setIsLoginGateOpen(true);
            }
          }
        }, 800);
      },
      // onError
      (message) => {
        console.error("Auto-fix error:", message);
        setIsAutoFixing(false);
        setAutoFixStep(0);
        if (message.includes("limit_reached") || message.includes("Sign in")) {
          setIsHardBlock(true);
          setIsLoginGateOpen(true);
        } else {
          alert(`Auto-fix failed: ${message}\n\nYou can still download your resume from the Download tab.`);
        }
      }
    );
  }, [parsedResume, score, insights]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRecalculate = async (jsonResult: any) => {
    setIsRecalculatingScore(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/v1/analyze/score-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_json: jsonResult,
          job_description: useAnalyzeStore.getState().jobDescription || ""
        })
      });
      const data = await response.json();
      if (data.status === "success") {
        setRecalculatedScore(data.score);
      } else {
        alert("Failed to recalculate score.");
      }
    } catch (e) {
      console.error("Recalculate error:", e);
      alert("Error recalculating score.");
    } finally {
      setIsRecalculatingScore(false);
    }
  };

  return (
    <>
      <LoginGateModal
        isOpen={isLoginGateOpen}
        onClose={() => {
          setIsLoginGateOpen(false);
          if (!isHardBlock) {
             const current = getDismissCount();
             localStorage.setItem('myats_dismiss_count', (current + 1).toString());
          }
        }}
        onSuccess={() => {
          setIsLoginGateOpen(false);
          // If they successfully logged in from a hard block, we could auto-trigger autofix again
          // but just letting them click it is safer.
        }}
        pdfCount={pdfCount}
        isHardBlock={isHardBlock}
      />

      {/* Auto-Fix Loading Overlay */}
      <AutoFixOverlay isVisible={isAutoFixing} currentStep={autoFixStep} />

      <div className="animate-slide-in">
        {/* Pill Tab Switcher */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1.5 flex gap-1 mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-[#1D9E75] text-white shadow-md shadow-[#1D9E75]/20"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.id === "ai" && improvementsCount > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white text-[#1D9E75]" : "bg-red-500 text-white"}`}>
                    {improvementsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="animate-tab-fade-in" key={activeTab}>
          {activeTab === "score" && (
            <TabYourScore
              score={score}
              insights={insights}
              onAutoFix={handleAutoFix}
              onAddJobDescription={onAddJobDescription}
            />
          )}
          {activeTab === "ai" && (
            <TabAIImprovements
              insights={insights}
              status={status}
              streamingText={streamingText}
            />
          )}
          {activeTab === "download" && (
            <TabDownloadResume
              parsedResume={parsedResume}
              insights={insights}
              onRecalculate={handleRecalculate}
              isRecalculating={isRecalculatingScore}
              autoFixResult={autoFixResult}
              isAutoFixing={isAutoFixing}
              originalScore={score?.total_score}
              recalculatedScore={recalculatedScore?.total_score}
            />
          )}
        </div>
      </div>
    </>
  );
}
