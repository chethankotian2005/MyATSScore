"use client";
import { useState, useEffect, useMemo } from "react";
import { generateATSResume, generateAutoFixPDF, ResumeSection, AutoFixResult } from "@/lib/generatePDF";
import { Download, RefreshCw, FileText, Mail, Phone, Linkedin, MapPin } from "lucide-react";
import { ResumePreviewCard } from "./ResumePreviewCard";

interface TabDownloadResumeProps {
  parsedResume: any;
  insights: any;
  onRecalculate?: (json: any) => void;
  isRecalculating?: boolean;
  autoFixResult?: AutoFixResult | null;
  isAutoFixing?: boolean;
  originalScore?: number;
  recalculatedScore?: number;
}

const SECTION_ORDER = ["summary", "experience", "education", "skills", "projects", "certifications"];

function extractContactInfo(contactText: string) {
  const lines = contactText.split("\n").map((l) => l.trim()).filter(Boolean);
  const info: { email?: string; phone?: string; linkedin?: string; location?: string; other: string[] } = {
    other: [],
  };

  for (const line of lines) {
    if (line.includes("@") && line.includes(".")) {
      info.email = line;
    } else if (/[\d\-\(\)\+]{7,}/.test(line.replace(/\s/g, ""))) {
      info.phone = line;
    } else if (line.toLowerCase().includes("linkedin") || line.includes("linkedin.com")) {
      info.linkedin = line;
    } else if (line.length < 60) {
      if (!info.location) info.location = line;
      else info.other.push(line);
    } else {
      info.other.push(line);
    }
  }
  return info;
}

export function TabDownloadResume({
  parsedResume,
  insights,
  onRecalculate,
  isRecalculating,
  autoFixResult,
  isAutoFixing,
  originalScore,
  recalculatedScore,
}: TabDownloadResumeProps) {
  const [name, setName] = useState("Your Name");

  // Build sections with AI fixes auto-applied (for fallback text preview)
  const sections = useMemo(() => {
    if (!parsedResume?.sections) return [];
    const result: ResumeSection[] = [];

    for (const key of SECTION_ORDER) {
      let content = parsedResume.sections[key]
        ? parsedResume.sections[key].join("\n")
        : "";

      // Auto-apply AI rewritten summary
      if (key === "summary" && insights?.rewritten_summary) {
        content = insights.rewritten_summary;
      }

      if (content.trim()) {
        result.push({
          id: key,
          title: key.charAt(0).toUpperCase() + key.slice(1),
          content,
        });
      }
    }

    return result;
  }, [parsedResume, insights]);

  // Extract name from raw text
  useEffect(() => {
    if (parsedResume?.raw_text) {
      const firstLine = parsedResume.raw_text
        .split("\n")
        .find((l: string) => l.trim().length > 0);
      if (firstLine) setName(firstLine.trim());
    }
  }, [parsedResume]);

  const contactText = parsedResume?.sections?.contact
    ? parsedResume.sections.contact.join("\n")
    : "";
  const contactInfo = extractContactInfo(contactText);

  const handleDownload = () => {
    if (autoFixResult) {
      generateAutoFixPDF(autoFixResult);
    } else {
      // Build the full section list including contact for PDF fallback
      const allSections: ResumeSection[] = [
        {
          id: "contact",
          title: "Contact",
          content: contactText,
        },
        ...sections,
      ];
      generateATSResume(allSections, name);
    }
  };

  const handleRecalculate = () => {
    if (onRecalculate && autoFixResult) {
      onRecalculate(autoFixResult);
    }
  };

  if (!parsedResume) return null;

  return (
    <div className="space-y-6">
      {/* Resume Preview */}
      {autoFixResult || isAutoFixing ? (
        <ResumePreviewCard data={autoFixResult || null} isLoading={isAutoFixing} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Preview Header Label */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Resume Preview
            </span>
            {insights?.rewritten_summary && (
              <span className="ml-auto text-xs font-medium text-[#1D9E75] bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                ✨ AI Fixes Applied
              </span>
            )}
          </div>

          {/* Resume Content */}
          <div className="p-8 sm:p-10 max-w-[700px] mx-auto" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            {/* Name & Contact Header */}
            <div className="text-center mb-6 pb-5 border-b-2 border-slate-800">
              <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide mb-2">
                {name}
              </h1>
              <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                {contactInfo.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {contactInfo.email}
                  </span>
                )}
                {contactInfo.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {contactInfo.phone}
                  </span>
                )}
                {contactInfo.linkedin && (
                  <span className="flex items-center gap-1">
                    <Linkedin className="w-3.5 h-3.5 text-slate-400" />
                    {contactInfo.linkedin}
                  </span>
                )}
                {contactInfo.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {contactInfo.location}
                  </span>
                )}
                {contactInfo.other.map((item, i) => (
                  <span key={i} className="text-slate-500">{item}</span>
                ))}
              </div>
            </div>

            {/* Sections */}
            {sections.map((section) => (
              <div key={section.id} className="mb-5">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-1 mb-2 border-b border-slate-300">
                  {section.title}
                </h2>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))}

            {sections.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                No resume content available for preview.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2.5 bg-[#1D9E75] hover:bg-[#178a66] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-[#1D9E75]/20 transition-all duration-200 hover:shadow-xl hover:shadow-[#1D9E75]/30 hover:-translate-y-0.5"
        >
          <Download className="w-5 h-5" />
          Download ATS-Optimized PDF
        </button>
        <div className="flex items-center gap-4 border border-slate-200 bg-white rounded-2xl pr-6">
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating || !autoFixResult}
            className="flex items-center justify-center gap-2 text-slate-600 font-semibold py-4 px-6 rounded-l-2xl border-r border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 h-full"
          >
            <RefreshCw className={`w-5 h-5 ${isRecalculating ? "animate-spin" : ""}`} />
            {isRecalculating ? "Recalculating…" : "Recalculate Score"}
          </button>
          
          {recalculatedScore !== undefined && originalScore !== undefined && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-slate-900">{recalculatedScore}</span>
              {recalculatedScore > originalScore && (
                <span className="flex items-center text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  +{recalculatedScore - originalScore} points
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
