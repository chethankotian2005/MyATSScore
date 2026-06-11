"use client";
import { useState } from "react";
import { Expand, X, Eye } from "lucide-react";
import type { AutoFixResult } from "@/lib/generatePDF";

interface ResumePreviewCardProps {
  data: AutoFixResult | null;
  isLoading?: boolean;
}

/**
 * Renders the resume as pure HTML with inline styles — mirrors the PDF layout exactly.
 * Used at both 0.55x scale (card preview) and 1x scale (expanded modal).
 */
function ResumeHTML({ data }: { data: AutoFixResult }) {
  const contactParts = [
    data.contact?.email,
    data.contact?.phone, 
    data.contact?.linkedin,
    data.contact?.github,
    data.contact?.portfolio,
    data.contact?.location
  ].filter(part => part && part.trim() !== '' && 
    !part.includes('yourprofile') &&
    !part.includes('placeholder'));

  return (
    <div
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontSize: "10pt",
        lineHeight: "1.15",
        color: "#000",
        background: "#fff",
        padding: "0.75in",
        width: "8.27in", // A4 width
        minHeight: "11.69in", // A4 height
        boxSizing: "border-box",
        margin: "0 auto",
      }}
    >
      {/* Name */}
      <div style={{ textAlign: "center", marginBottom: "4px" }}>
        <div
          style={{
            fontSize: "18pt",
            fontWeight: "bold",
            textTransform: "uppercase" as const,
            marginBottom: "3px",
            letterSpacing: "0.5px",
          }}
        >
          {data.name || "YOUR NAME"}
        </div>
      </div>

      {/* Contact Line */}
      <div
        style={{
          textAlign: "center",
          fontSize: "10pt",
          color: "#333",
          marginBottom: "8px",
        }}
      >
        {contactParts.join("  |  ") || "email@example.com | (555) 123-4567"}
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: "7px" }}>
          <div
            style={{
              fontSize: "11pt",
              fontWeight: "bold",
              textTransform: "uppercase" as const,
              marginBottom: "3px",
              paddingBottom: "2px",
              borderBottom: "0.75px solid #000",
              letterSpacing: "0.5px",
            }}
          >
            SUMMARY
          </div>
          <div style={{ fontSize: "10pt", lineHeight: "1.15" }}>
            {data.summary}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: "7px" }}>
          <div
            style={{
              fontSize: "11pt",
              fontWeight: "bold",
              textTransform: "uppercase" as const,
              marginBottom: "3px",
              paddingBottom: "2px",
              borderBottom: "0.75px solid #000",
              letterSpacing: "0.5px",
            }}
          >
            EXPERIENCE
          </div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: "5px" }}>
              <div style={{ fontSize: "10pt", fontWeight: "bold" }}>
                {exp.title}
                {exp.company ? ` — ${exp.company}` : ""}
              </div>
              {exp.duration && (
                <div style={{ fontSize: "10pt", color: "#444", marginBottom: "2px" }}>
                  {exp.duration}
                </div>
              )}
              {exp.bullets?.map((bullet, j) => (
                <div
                  key={j}
                  style={{
                    fontSize: "9pt",
                    paddingLeft: "14px",
                    marginBottom: "1.5px",
                    lineHeight: "1.2",
                  }}
                >
                  • {bullet}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: "7px" }}>
          <div
            style={{
              fontSize: "11pt",
              fontWeight: "bold",
              textTransform: "uppercase" as const,
              marginBottom: "3px",
              paddingBottom: "2px",
              borderBottom: "0.75px solid #000",
              letterSpacing: "0.5px",
            }}
          >
            EDUCATION
          </div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: "3px" }}>
              <div style={{ fontSize: "10pt", fontWeight: "bold" }}>
                {edu.degree}
              </div>
              <div style={{ fontSize: "10pt", color: "#444" }}>
                {edu.institution}
                {edu.year ? ` — ${edu.year}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div style={{ marginBottom: "7px" }}>
          <div
            style={{
              fontSize: "11pt",
              fontWeight: "bold",
              textTransform: "uppercase" as const,
              marginBottom: "3px",
              paddingBottom: "2px",
              borderBottom: "0.75px solid #000",
              letterSpacing: "0.5px",
            }}
          >
            SKILLS
          </div>
          <div style={{ fontSize: "10pt", lineHeight: "1.3" }}>
            {data.skills.join(", ")}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div style={{ marginBottom: "7px" }}>
          <div
            style={{
              fontSize: "11pt",
              fontWeight: "bold",
              textTransform: "uppercase" as const,
              marginBottom: "3px",
              paddingBottom: "2px",
              borderBottom: "0.75px solid #000",
              letterSpacing: "0.5px",
            }}
          >
            PROJECTS
          </div>
          {data.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: "5px" }}>
              <div style={{ fontSize: "10pt", fontWeight: "bold" }}>
                {proj.name}
                {proj.tech ? ` (${proj.tech})` : ""}
              </div>
              {proj.description && (
                <div style={{ fontSize: "10pt" }}>{proj.description}</div>
              )}
              {proj.achievements?.map((ach, j) => (
                <div
                  key={j}
                  style={{
                    fontSize: "9pt",
                    paddingLeft: "14px",
                    marginBottom: "1.5px",
                    lineHeight: "1.2",
                  }}
                >
                  • {ach}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonPreview() {
  return (
    <div style={{ padding: "0.75in", width: "8.27in", minHeight: "11.69in", background: "#fff" }}>
      {/* Name skeleton */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
        <div className="animate-pulse" style={{ width: "200px", height: "22px", background: "#e2e8f0", borderRadius: "4px" }} />
      </div>
      {/* Contact skeleton */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        <div className="animate-pulse" style={{ width: "320px", height: "12px", background: "#e2e8f0", borderRadius: "4px" }} />
      </div>
      {/* Section skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ marginBottom: "14px" }}>
          <div className="animate-pulse" style={{ width: "120px", height: "14px", background: "#e2e8f0", borderRadius: "4px", marginBottom: "6px" }} />
          <div className="animate-pulse" style={{ width: "100%", height: "10px", background: "#f1f5f9", borderRadius: "3px", marginBottom: "4px" }} />
          <div className="animate-pulse" style={{ width: "90%", height: "10px", background: "#f1f5f9", borderRadius: "3px", marginBottom: "4px" }} />
          <div className="animate-pulse" style={{ width: "75%", height: "10px", background: "#f1f5f9", borderRadius: "3px" }} />
        </div>
      ))}
    </div>
  );
}

export function ResumePreviewCard({ data, isLoading }: ResumePreviewCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Miniaturized Preview Card */}
      <div className="relative bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ATS Resume Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <span className="text-xs font-medium text-[#1D9E75] bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                ✨ AI Optimized
              </span>
            )}
          </div>
        </div>

        {/* Scaled Preview Container */}
        <div
          className="relative overflow-hidden hover:overflow-y-auto transition-all duration-300 flex justify-center bg-slate-50"
          style={{ height: "520px" }}
        >
          {/* Paper shadow effect */}
          <div
            className="my-6 flex justify-center w-full"
            style={{
              boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
              borderRadius: "2px",
            }}
          >
            <div
              style={{
                transform: "scale(0.55)",
                transformOrigin: "top center",
              }}
            >
              {isLoading || !data ? <SkeletonPreview /> : <ResumeHTML data={data} />}
            </div>
          </div>

          {/* Fade-out gradient at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: "60px",
              background: "linear-gradient(transparent, rgb(241 245 249))",
            }}
          />
        </div>

        {/* Expand Button */}
        {data && (
          <div className="bg-white border-t border-slate-200 px-5 py-3 flex justify-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#1D9E75] transition-colors"
            >
              <Expand className="w-4 h-4" />
              Expand Preview
            </button>
          </div>
        )}
      </div>

      {/* Full-Size Modal */}
      {isModalOpen && data && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col mb-8 animate-slide-in">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#1D9E75]" />
                <h3 className="font-bold text-lg text-slate-800">Resume Preview</h3>
                <span className="text-xs font-medium text-[#1D9E75] bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                  ✨ AI Optimized
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body — full-size resume */}
            <div className="overflow-y-auto bg-slate-50 p-6">
              <div
                className="mx-auto"
                style={{
                  boxShadow: "0 4px 24px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)",
                  borderRadius: "2px",
                  width: "fit-content",
                }}
              >
                <ResumeHTML data={data} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
