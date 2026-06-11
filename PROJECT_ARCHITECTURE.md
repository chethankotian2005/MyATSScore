# MyATSScore - Project Architecture & Implementation Details

This document serves as the single source of truth for the project's architecture, technology stack, and implemented features. **This file should be updated whenever new major features, stack changes, or architectural shifts occur.**

---

## 🏗 Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router) with React
- **Styling**: Tailwind CSS for responsive utility-first styling
- **State Management**: Zustand for lightweight global state
- **Icons & UI**: Lucide React for iconography; customized components
- **PDF Generation**: `@react-pdf/renderer` (using built-in PDF standard fonts like `Times-Roman` for stability and offline support)
- **Real-time Data**: Server-Sent Events (SSE) client for receiving streaming AI tokens.

### Backend
- **Framework**: FastAPI (Python 3.11) running on Uvicorn
- **Resume Parsing**: `PyMuPDF` (PDFs) and `python-docx` (Word documents)
- **Natural Language Processing**: `spaCy` (`en_core_web_sm` model) for entity extraction, power verb analysis, and keyword matching.
- **AI / LLM Engine**: **Groq API** (`llama-3.1-8b-instant`) via the `groq` Python SDK (migrated from local Ollama for blazing-fast ~0.5s inference speeds).
- **Streaming**: Native Python async generators (`yield`) serving `text/event-stream` responses back to the frontend.
- **Config Management**: Starlette configuration enforcing strict UTF-8 (No BOM) `.env` loading to prevent decoding crashes.

### Database, Auth & Caching
- **Authentication**: Firebase Authentication (Client-side)
- **Database**: Google Cloud Firestore (Firebase Admin SDK on the backend)
  - *Schema `resume_scans`*: Used for analytics. Stores `scan_id`, `user_uid`, `session_id`, `score`, `grade`, `score_breakdown`, `resume_data`, `pdf_generated`, `auto_fix_used`, `timestamp`.
- **Caching**: Redis (accessed via `redis.asyncio`) used heavily for caching ATS computation results, AI insights, and Auto-Fix outputs with a 1-hour TTL (MD5 hashed keys based on resume text + Job Description).

### Infrastructure
- **Containerization**: Docker & Docker Compose (`docker-compose up --build`)
- **Networks**: Internal bridge network `app-network` for secure container-to-container communication.

---

## 🚀 Implemented Features

### 1. ATS Scoring Engine (spaCy)
- Extracts text from uploaded resumes (PDF/DOCX).
- Analyzes formatting, word count, power verbs, and section completeness (Education, Experience, Skills, etc.).
- Compares resume text against an optional **Job Description (JD)** to calculate keyword overlap and gap analysis.
- Generates a deterministic ATS Score (0-100) using strict NLP rule-based algorithms.

### 2. Real-time AI Insights Generator (Groq)
- Takes the parsed resume text, the Job Description (if provided), and the ATS Score.
- Sends a prompt to the Groq API (`llama-3.1-8b-instant`) to generate specific, actionable feedback.
- Features include:
  - **Top 3 Improvements**: High-impact resume fixes.
  - **Rewritten Summary**: AI-optimized professional summary.
  - **Section-by-Section Feedback**: Granular feedback on Experience, Skills, and Formatting (presented cleanly in a UI accordion).
- Streams the JSON payload chunk-by-chunk to the frontend using **Server-Sent Events (SSE)**, creating a highly responsive, typing-effect UX.

### 3. Progressive Loading UI & Tabbed Architecture
- A sophisticated, multi-step animated progress UI simulates a parsing breakdown while the backend computes the score and initiates the AI stream.
- Replaced the monolithic editor interface with a clean **3-tab layout**:
  - **Your Score**: Visual score breakdown and actionable keyword gap analysis.
  - **AI Improvements**: Detailed insights and section-by-section feedback accordions.
  - **Download Resume**: A read-only preview and PDF export hub.

### 4. "Auto-Fix & Download" Pipeline
- A one-click automation feature that takes the user's parsed resume and the AI's feedback, sending it to a new backend SSE endpoint (`/api/v1/auto-fix`).
- The Groq API completely rewrites and structures the resume into a rigid JSON schema (Name, Contact, Summary, Experience with bullets, Education, Skills, Projects).
- The pipeline displays a full-screen animated overlay with status checks, automatically applying the AI improvements without requiring manual text editing.

### 5. Smart Caching System
- Implemented robust Redis caching for both the analysis and auto-fix endpoints. If a user uploads the exact same resume and Job Description, the system completely skips the NLP processing and Groq API calls, instantly returning the cached JSON payloads.

### 6. HTML Preview & PDF Resume Export
- Replaced the manual text editor with a read-only **Miniaturized HTML Preview Card** that uses inline CSS to perfectly mirror the final PDF layout at a 0.55x scale.
- Dynamic resume exporter using `@react-pdf/renderer` generates an ATS-safe document using built-in fonts (`Times-Roman`, `Georgia`) to prevent external CDN 404 errors and guarantee offline generation reliability.

### 7. Analytics, Usage Limits, and Admin Dashboard
- **Anonymous Session Tracking**: All API requests (`/analyze`, `/auto-fix`) generate and track a persistent `X-Session-ID` header.
- **3-PDF Generation Limit**: Anonymous users can analyze unlimited resumes but are hard-blocked after generating 3 PDFs. A soft-prompt modal intelligently requests sign-up or allows them to "Maybe later" (dismissible up to 3 times) before the final hard block.
- **Real-Time Admin Dashboard**: A protected `/admin` route (gated via `NEXT_PUBLIC_ADMIN_UIDS` and `ADMIN_UIDS` env variables) that fetches `onSnapshot` data directly from the Firestore `resume_scans` collection to populate global real-time metric cards, an expandable data table, and inline CSS zero-dependency bar charts for Score Distribution, Top Skills, and Daily Scans.
- **Dynamic Auth UI**: Handled by `UserNav.tsx` replacing static log-in links with profile icons and a dropdown to correctly reflect Firebase auth state and provide seamless logouts.
- **Accurate Skills Extraction**: Fixed `resume_scans` pollution by strictly parsing the 'Skills' section in General Mode rather than incorrectly saving NLP 'Power Verbs' as technical skills.
- **Auth Merging**: Upon successful Google Sign-In, the backend triggers `/api/v1/auth/merge` which securely binds all anonymous session data in Firestore to the new permanent `user_uid`.

### 8. Free-Tier / Un-gated Access
- Removed all legacy billing logic (Stripe/Razorpay).
- The application is configured to provide full "Pro" features (AI rewrites, complete keyword analysis, auto-fix) to all authenticated users for free.

---

## 🔄 Migration History

1. **Supabase to Firebase**: Complete transition of Auth and DB to Google Firebase to consolidate cloud dependencies.
2. **Local Ollama to Groq API**: Replaced local `llama3.2:3b` Ollama container with the Groq API.
   - *Reason*: Ollama was too slow on local hardware.
   - *Result*: Achieved <1 second streaming responses while drastically reducing Docker container weight.
3. **Gemini API Bypass**: Briefly attempted Google Gemini 2.0 Flash, but encountered strict regional prepaid-billing blocks (0 quota limit on the free tier). Pivoted to Groq as the permanent, truly free solution.
4. **UX Refactor Phase 1 (Show-then-Fix)**: Migrated away from a manual "show-issues-user-fixes" approach to an automated 1-click AI Auto-Fix flow. Removed the `ResumeEditor` entirely to reduce cognitive load and simplify the path to downloading an ATS-safe PDF.
5. **UX Refactor Phase 2**: Analytics, Usage Limiting, and Admin Dashboard added.

---
*Maintainer Note: Please update the sections above whenever adding new dependencies, changing the core architecture, or releasing major features.*
