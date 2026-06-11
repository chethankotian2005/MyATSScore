import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, UploadCloud, CheckCircle2, Search, LayoutTemplate, CheckSquare, TrendingUp, Zap, FileSearch, Download } from "lucide-react";
import { FAQ } from "@/components/FAQ";
import { AdminNav } from "@/components/AdminNav";
import { UserNav } from "@/components/UserNav";

export const metadata: Metadata = {
  title: "Free ATS Resume Checker — Score Your Resume in 60 Seconds | myatsscore.app",
  description: "Use our free ATS resume checker to optimize your resume for applicant tracking systems. Find keyword gaps, fix formatting, and get hired faster.",
  openGraph: {
    title: "Free ATS Resume Checker — Score Your Resume in 60 Seconds | myatsscore.app",
    description: "Use our free ATS resume checker to optimize your resume for applicant tracking systems. Find keyword gaps, fix formatting, and get hired faster.",
    url: "https://myatsscore.app",
    siteName: "MyATSScore",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "MyATSScore",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Free ATS resume checker to optimize your resume for applicant tracking systems."
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-[#1D9E75]">myatsscore.app</div>
          <nav className="flex gap-6 items-center">
            <AdminNav />
            <Link href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 font-medium">How it Works</Link>
            <UserNav />
            <Link href="/analyze" className="inline-flex h-9 items-center justify-center rounded-md bg-[#1D9E75] px-4 text-sm font-medium text-white shadow hover:bg-[#157e5d] transition-colors">
              Try It Free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* 1. Hero Section */}
        <section className="pt-24 pb-20 px-6 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-[#1D9E75] text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy-First ATS Resume Checker</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Get Your ATS Score in <span className="text-[#1D9E75]">60 Seconds</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Stop guessing why you are not getting interviews. Upload your resume and instantly see what ATS systems see — no job description needed. Your resume never leaves our servers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/analyze" className="inline-flex h-14 items-center justify-center rounded-xl bg-[#1D9E75] px-10 text-lg font-bold text-white shadow-lg hover:bg-[#157e5d] transition-colors w-full sm:w-auto transform hover:-translate-y-0.5">
              Check My Resume Free
            </Link>
          </div>
        </section>

        {/* SECTION 2: How It Works */}
        <section id="how-it-works" className="py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">How It Works</h2>
              <p className="text-slate-600 mt-4 text-lg">Three simple steps to beat the applicant tracking system.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center relative z-10 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-teal-50 text-[#1D9E75] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Step 1</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Upload Your Resume</h3>
                <p className="text-slate-600">Drag and drop your PDF or DOCX.</p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center relative z-10 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-teal-50 text-[#1D9E75] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8" />
                </div>
                <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Step 2</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Get Your ATS Score</h3>
                <p className="text-slate-600">Instant analysis against 50+ ATS rules.</p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center relative z-10 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-teal-50 text-[#1D9E75] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Download className="w-8 h-8" />
                </div>
                <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Step 3</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Fix & Download</h3>
                <p className="text-slate-600">Apply AI suggestions and download ATS-optimized PDF.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: What We Check */}
        <section className="py-24 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">What We Check</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 border border-slate-200 rounded-2xl bg-white flex items-start gap-4">
              <div className="p-3 bg-teal-50 text-[#1D9E75] rounded-xl shrink-0"><FileSearch className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Keyword Optimization</h3>
                <p className="text-sm text-slate-600">Ensures your resume contains exact-match keywords from job descriptions.</p>
              </div>
            </div>
            
            <div className="p-6 border border-slate-200 rounded-2xl bg-white flex items-start gap-4">
              <div className="p-3 bg-teal-50 text-[#1D9E75] rounded-xl shrink-0"><LayoutTemplate className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Formatting Compatibility</h3>
                <p className="text-sm text-slate-600">Checks for tables, columns, and images that break ATS parsers.</p>
              </div>
            </div>
            
            <div className="p-6 border border-slate-200 rounded-2xl bg-white flex items-start gap-4">
              <div className="p-3 bg-teal-50 text-[#1D9E75] rounded-xl shrink-0"><CheckSquare className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Section Completeness</h3>
                <p className="text-sm text-slate-600">Verifies you have all standard headers like Experience and Education.</p>
              </div>
            </div>
            
            <div className="p-6 border border-slate-200 rounded-2xl bg-white flex items-start gap-4">
              <div className="p-3 bg-teal-50 text-[#1D9E75] rounded-xl shrink-0"><TrendingUp className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Quantified Achievements</h3>
                <p className="text-sm text-slate-600">Detects if you're using numbers and metrics to prove your impact.</p>
              </div>
            </div>
            
            <div className="p-6 border border-slate-200 rounded-2xl bg-white flex items-start gap-4">
              <div className="p-3 bg-teal-50 text-[#1D9E75] rounded-xl shrink-0"><Zap className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Power Verb Usage</h3>
                <p className="text-sm text-slate-600">Scans for strong action verbs instead of weak phrases like "helped with".</p>
              </div>
            </div>
            
            <div className="p-6 border border-slate-200 rounded-2xl bg-white flex items-start gap-4">
              <div className="p-3 bg-teal-50 text-[#1D9E75] rounded-xl shrink-0"><CheckCircle2 className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">ATS Readability Score</h3>
                <p className="text-sm text-slate-600">Calculates an overall confidence metric for flawless automated parsing.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Sample Score Card */}
        <section className="py-24 bg-slate-50 px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Real Results</h2>
            <p className="text-slate-600 mt-4 text-lg">See how users identify critical errors with our detailed analysis.</p>
          </div>
          
          <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200 transform hover:scale-[1.02] transition-transform">
            <div className="flex flex-col sm:flex-row items-center gap-10">
              <div className="flex-shrink-0 relative flex flex-col items-center justify-center w-40 h-40 rounded-full border-8 border-amber-500 bg-white shadow-inner">
                <div className="text-5xl font-extrabold text-amber-500">73</div>
                <div className="text-sm font-medium text-slate-400 mt-1">out of 100</div>
                <div className="absolute -bottom-4 bg-white border-2 border-amber-500 px-4 py-1 rounded-full font-bold text-lg text-amber-500">
                  Grade B
                </div>
              </div>
              
              <div className="w-full grid gap-4">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Score Breakdown</h3>
                
                <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-slate-700">Keyword Match</span>
                    <span className="text-amber-600">28/40</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full w-[70%]"></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-slate-700">Section Completeness</span>
                    <span className="text-slate-500">20/20</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-[#1D9E75] h-2 rounded-full w-[100%]"></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-slate-700">Formatting Structure</span>
                    <span className="text-amber-600">10/20</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full w-[50%]"></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-slate-400 text-sm italic mt-10">Real results from myatsscore.app users</p>
          </div>
        </section>

        {/* SECTION 5: FAQ */}
        <section className="py-24 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Frequently Asked Questions</h2>
          </div>
          <FAQ />
        </section>

        {/* SECTION 6: CTA Banner */}
        <section className="py-24 bg-[#1D9E75] text-center px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-extrabold text-white mb-8 tracking-tight">Ready to beat the ATS?</h2>
            <Link href="/analyze" className="inline-flex h-14 items-center justify-center rounded-xl bg-white px-10 text-lg font-bold text-[#1D9E75] shadow-lg hover:bg-slate-50 transition-colors transform hover:scale-105 duration-200">
              Check My Resume Free
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12 text-center text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-bold text-xl tracking-tight text-[#1D9E75]">myatsscore.app</div>
          <p className="text-sm">Built with ❤️ for job seekers worldwide</p>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Contact</Link>
          </div>
        </div>
        <div className="mt-8 text-xs text-slate-400">
          © {new Date().getFullYear()} MyATSScore. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
