"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    q: "Is my resume stored?",
    a: "Your resume is processed and never permanently stored on our servers."
  },
  {
    q: "Is this really free?",
    a: "Yes, completely free. No credit card required."
  },
  {
    q: "What file formats are supported?",
    a: "PDF and DOCX up to 5MB."
  },
  {
    q: "How is this different from other ATS checkers?",
    a: "We don't just show you problems — we fix them automatically with AI and generate a new ATS-optimized PDF in one click."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => (
        <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <button
            className="w-full flex justify-between items-center p-6 text-left focus:outline-none hover:bg-slate-50 transition-colors"
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
          >
            <span className="font-bold text-slate-900 text-lg">{faq.q}</span>
            {openIndex === idx ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          {openIndex === idx && (
            <div className="p-6 pt-0 text-slate-600 border-t border-slate-100 bg-slate-50">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
