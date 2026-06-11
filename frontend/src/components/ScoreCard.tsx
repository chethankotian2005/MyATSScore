"use client";
import { useState, useRef } from 'react';
import { useAnalyzeStore } from '@/store/analyzeStore';
import { Info, Share2, Download, Copy, Linkedin, X, MessageCircle } from 'lucide-react';
import html2canvas from 'html2canvas';

export function ScoreCard({ score: scoreProp }: { score?: any }) {
  const { result } = useAnalyzeStore();
  const scoreData = scoreProp || result?.score;
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!scoreData) return null;

  const { total_score, grade, breakdown, mode } = scoreData;
  const isGeneral = mode === 'general';
  
  let colorClass = "text-green-500 border-green-500";
  if (total_score < 50) colorClass = "text-red-500 border-red-500";
  else if (total_score < 70) colorClass = "text-amber-500 border-amber-500";

  const shareText = `I just scored ${total_score}/100 on my ATS resume check! Check yours free at myatsscore.app 🚀`;

  const handleShareClick = async () => {
    setIsGenerating(true);
    setIsModalOpen(true);
    
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        setPreviewUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error("Failed to generate image", err);
      }
    }
    setIsGenerating(false);
  };

  const downloadImage = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `myatsscore-${total_score}.png`;
      link.click();
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareText);
    alert('Copied to clipboard!');
  };

  const shareLinkedIn = () => {
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3 mt-8">
      {/* Mode badge */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
        isGeneral 
          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      }`}>
        <Info className="w-4 h-4 shrink-0" />
        {isGeneral 
          ? "General ATS Score — add a job description for a targeted analysis" 
          : "Job-Specific Score"}
      </div>

      <div className="relative">
        {/* Capturable Card */}
        <div ref={cardRef} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
          
          {/* Logo (visible only in capture or if we want it always, let's keep it subtle) */}
          <div className="absolute top-4 left-6 hidden sm:block opacity-50">
            <span className="font-bold text-lg tracking-tight text-[#1D9E75]">myatsscore.app</span>
          </div>

          <div className="flex-shrink-0 relative flex flex-col items-center justify-center w-40 h-40 rounded-full border-8 bg-white shadow-inner z-10 mt-6 sm:mt-0" style={{ borderColor: colorClass.split(' ')[1].replace('border-', '') }}>
            <div className={`text-5xl font-extrabold ${colorClass.split(' ')[0]}`}>{total_score}</div>
            <div className="text-sm font-medium text-slate-400 mt-1">out of 100</div>
            <div className={`absolute -bottom-4 bg-white border-2 px-4 py-1 rounded-full font-bold text-lg ${colorClass}`}>
              Grade {grade}
            </div>
          </div>
          
          <div className="w-full grid gap-4 z-10">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">Score Breakdown</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isGeneral ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {isGeneral ? 'General Mode' : 'Job-Specific Mode'}
              </span>
            </div>
            {isGeneral ? (
              <>
                <ScoreBar label="Section Completeness" score={breakdown.section} max={25} />
                <ScoreBar label="Formatting Quality" score={breakdown.formatting} max={20} />
                <ScoreBar label="Quantification" score={breakdown.quantification} max={20} />
                <ScoreBar label="Power Verbs" score={breakdown.keyword} max={20} />
                <ScoreBar label="Ideal Length" score={breakdown.length} max={15} />
              </>
            ) : (
              <>
                <ScoreBar label="Keyword Match" score={breakdown.keyword} max={40} />
                <ScoreBar label="Section Completeness" score={breakdown.section} max={20} />
                <ScoreBar label="Formatting Structure" score={breakdown.formatting} max={20} />
                <ScoreBar label="Quantification" score={breakdown.quantification} max={10} />
                <ScoreBar label="Ideal Length" score={breakdown.length} max={10} />
              </>
            )}
          </div>

          {/* Watermark for bottom right */}
          <div className="absolute bottom-3 right-6 hidden sm:block opacity-30 text-xs font-semibold text-slate-500">
            Analyzed by myatsscore.app
          </div>
        </div>

        {/* Share Button (Outside the capturable area) */}
        <div className="mt-4 flex justify-center">
          <button 
            onClick={handleShareClick}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold shadow transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share My Score
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Share Your Result</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50">
              {isGenerating ? (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-[#1D9E75] border-t-transparent rounded-full animate-spin mb-4" />
                    Generating your image...
                  </div>
                </div>
              ) : previewUrl ? (
                <img src={previewUrl} alt="Score Preview" className="w-full h-auto rounded-xl shadow-sm border border-slate-200" />
              ) : (
                <div className="h-64 flex items-center justify-center text-red-500">
                  Failed to generate image.
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <button 
                onClick={downloadImage}
                disabled={!previewUrl}
                className="w-full flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#157e5d] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Download Image
              </button>
              
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={copyLink}
                  className="flex flex-col items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors"
                >
                  <Copy className="w-5 h-5" />
                  Copy Link
                </button>
                <button 
                  onClick={shareLinkedIn}
                  className="flex flex-col items-center justify-center gap-2 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-medium text-sm transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  LinkedIn
                </button>
                <button 
                  onClick={shareWhatsApp}
                  className="flex flex-col items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-medium text-sm transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, score, max }: { label: string, score: number, max: number }) {
  const percentage = (score / max) * 100;
  return (
    <div>
      <div className="flex justify-between text-sm font-medium mb-1">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-500">{score}/{max}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className="bg-[#1D9E75] h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
