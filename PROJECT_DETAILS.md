# MyATSScore.app - Project Status & Migration Details

## Project Overview
MyATSScore is a Next.js 14 + FastAPI application designed to analyze resumes against job descriptions using AI. It calculates an ATS score, identifies keyword gaps, and provides AI-powered insights for resume improvement.

## Key Technologies
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide Icons, Zustand (State Management).
- **Backend**: FastAPI (Python 3.11), Uvicorn.
- **Database/Auth**: Firebase (Authentication & Firestore).
- **AI Engine**: Ollama (Local LLM - Llama 3.1 8B).
- **Cache**: Redis.
- **Infrastructure**: Docker & Docker Compose.

## Major Updates & Migration Steps

### 1. Database Migration (Supabase to Firebase)
- Replaced Supabase Auth with **Firebase Authentication**.
- Migrated data storage from PostgreSQL to **Google Cloud Firestore**.
- Implemented `backend/app/core/firebase.py` for Admin SDK integration.
- Updated frontend hooks (`useAuth`, `useSubscription`) to use Firebase JS SDK.

### 2. Monetization Removal (Pro to Free)
- **Stripped all Payment Gateways**: Removed Stripe and Razorpay integrations completely.
- **Removed Billing Logic**: Deleted all subscription gating, plan limits, and usage restrictions.
- **Hardcoded Pro Features**: All users now have access to "Pro" features (AI rewrites, full keyword analysis) for free.
- **Simplified Schema**: User documents in Firestore now only track basic profile info.

### 3. AI & Infrastructure Improvements
- **Local AI Setup**: Switched Ollama model to `llama3.2:3b` for faster local CPU inference. Added `OLLAMA_NUM_PARALLEL=1` and `OLLAMA_MAX_LOADED_MODELS=1` to optimize resource usage.
- **Inference Streaming**: Upgraded the AI backend endpoint (`/api/v1/analyze/stream`) to use Server-Sent Events (SSE) for token-by-token streaming of the AI analysis, creating a much better real-time user experience.
- **General ATS Scoring Mode**: Updated the parser and scorer so the job description is entirely optional. Resumes can now be evaluated against general ATS best practices (formatting, word count, power verbs, section completeness).
- **Redis Caching**: Implemented MD5-based Redis caching (1hr TTL) for the ATS scorer and AI analyzer to completely bypass processing time on repeated scans of the same resume and JD.
- **CORS Fixes**: Resolved strict CORS issues on the StreamingResponse endpoint by configuring proper environment parsing and explicitly attaching `Access-Control-Allow-Origin: *` headers.
- **Frontend Progress Engine**: Added a sophisticated multi-step animated progress UI during analysis, complete with elapsed timers, score counting animations, and a simulated 4-step breakdown prior to real insights arriving.

## How to Run
1. Ensure **Docker Desktop** is running.
2. Verify `.env` contains valid Firebase Service Account credentials.
3. Run `docker-compose up --build -d`.
4. Access the app at `http://localhost:3000`.
