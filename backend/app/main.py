import time
import os
import logging
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.firebase import verify_token, db
import sentry_sdk
import re
import uuid
from datetime import datetime

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN", ""),
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)

from app.services.parser import ResumeParser
from app.services.scorer import ATSScorer
from app.services.llm import LLMService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config
import json

allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    CORS_ORIGINS = [origin.strip().rstrip("/") for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    CORS_ORIGINS = ["http://localhost:3000", "http://localhost:3001", "https://my-ats-score.vercel.app"]

def rate_limit_key(request: Request) -> str:
    return get_remote_address(request)

limiter = Limiter(key_func=rate_limit_key)

app = FastAPI(title="MyATSScore API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Middleware ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    return response

@app.middleware("http")
async def firebase_auth_middleware(request: Request, call_next):
    auth_header = request.headers.get("Authorization")
    request.state.user = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            decoded_token = verify_token(token)
            uid = decoded_token.get("uid")
            
            user_data = {
                "id": uid,
                "email": decoded_token.get("email"),
                "is_pro": True
            }
            request.state.user = user_data
        except Exception as e:
            logger.error(f"Auth error: {e}")
            pass # Invalid token, continue as guest
            
    response = await call_next(request)
    return response

# --- Exception Handler ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error_code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "details": str(exc)
            }
        )
    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred.",
            "details": str(exc)
        }
    )

# --- Dependencies ---
def get_current_user(request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

def get_pro_user(request: Request):
    return get_current_user(request)


# --- Routes ---

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "MyATSScore"}

def extract_resume_data(parsed_data: dict, score_data: dict) -> dict:
    raw_text = parsed_data.get("raw_text", "")
    sections = parsed_data.get("sections", {})
    
    # Name
    name = "Unknown"
    contact_lines = sections.get("contact", [])
    if contact_lines:
        name = contact_lines[0].strip()
    else:
        lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
        if lines:
            name = lines[0]
            
    # Email & Phone
    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", raw_text)
    email = email_match.group(0) if email_match else ""
    phone_match = re.search(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", raw_text)
    phone = phone_match.group(0) if phone_match else ""
    
    # Est Experience
    years = [int(y) for y in re.findall(r"\b(19\d{2}|20\d{2})\b", raw_text)]
    est_exp = max(years) - min(years) if len(years) >= 2 else 0
    if est_exp > 30 or est_exp < 0:
        est_exp = 0

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills_found": score_data.get("matched_keywords", []) if score_data.get("mode") == "jd" else [s.strip() for line in parsed_data.get("sections", {}).get("skills", []) for s in line.split(",") if s.strip() and len(s.strip()) < 30],
        "sections_detected": [sec for sec, val in sections.items() if val],
        "word_count": parsed_data.get("word_count", 0),
        "estimated_experience_years": est_exp
    }

@app.post("/api/v1/auth/merge")
async def merge_anonymous_scans(request: Request, user: dict = Depends(get_current_user)):
    try:
        body = await request.json()
        session_id = body.get("session_id")
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")
            
        docs = db.collection("resume_scans").where("session_id", "==", session_id).stream()
        merged_count = 0
        for doc in docs:
            doc.reference.update({"user_uid": user["id"]})
            merged_count += 1
            
        return {"status": "success", "merged_count": merged_count}
    except Exception as e:
        logger.error(f"Merge error: {e}")
        raise HTTPException(status_code=500, detail="Failed to merge scans")

@app.post("/api/v1/analyze")
@limiter.limit("10/minute")
async def analyze_resume(
    request: Request,
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None)
):
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and DOCX are supported.")
        
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB).")
    await file.seek(0)

    logger.info(f"Starting analysis for file: {file.filename}")
    parser = ResumeParser(file)
    parsed_data = await parser.parse()
    logger.info("Resume parsed successfully")
    
    scorer = ATSScorer(parsed_data, job_description)
    score_data = scorer.score()
    logger.info(f"Scoring complete (mode: {score_data.get('mode', 'jd')})")
    
    user = getattr(request.state, "user", None)
    session_id = request.headers.get("X-Session-ID", "")
    scan_id = str(uuid.uuid4())
    
    try:
        resume_data = extract_resume_data(parsed_data, score_data)
        db.collection("resume_scans").document(scan_id).set({
            "scan_id": scan_id,
            "timestamp": datetime.utcnow().isoformat(),
            "user_uid": user["id"] if user else None,
            "session_id": session_id,
            "score": score_data.get("total_score", 0),
            "grade": score_data.get("grade", "F"),
            "score_breakdown": score_data.get("breakdown", {}),
            "resume_data": resume_data,
            "jd_provided": bool(job_description),
            "pdf_generated": False,
            "auto_fix_used": False,
            "mode": score_data.get("mode", "general")
        })
    except Exception as e:
        logger.error(f"Failed to save to resume_scans: {e}")
    
    llm_service = LLMService()
    llm_analysis = await llm_service.analyze_gaps(
        parsed_data.get("enriched_text", parsed_data.get("raw_text", "")), 
        job_description, 
        score_data
    )
    logger.info("AI Insights generated")
    
    if user:
        try:
            db.collection("scans").add({
                "uid": user["id"],
                "resumeFilename": file.filename,
                "jobTitle": "Custom Analysis",
                "score": score_data.get("total_score", 0),
                "grade": score_data.get("grade", "F"),
                "breakdown": score_data.get("breakdown", {}),
                "matchedKeywords": score_data.get("matched_keywords", []),
                "missingKeywords": score_data.get("missing_keywords", []),
                "aiInsights": llm_analysis,
                "createdAt": datetime.utcnow()
            })
            logger.info(f"Scan saved to Firestore for user: {user['id']}")
        except Exception as e:
            logger.error(f"Failed to save scan to Firestore: {e}")
    
    return {
        "status": "success",
        "parsed_resume": parsed_data,
        "score": score_data,
        "ai_analysis": llm_analysis,
        "scan_id": scan_id
    }

@app.post("/api/v1/analyze/stream")
@limiter.limit("10/minute")
async def analyze_resume_stream(
    request: Request,
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None)
):
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and DOCX are supported.")
        
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB).")
    await file.seek(0)

    logger.info(f"[stream] Starting analysis for file: {file.filename}")
    parser = ResumeParser(file)
    parsed_data = await parser.parse()

    scorer = ATSScorer(parsed_data, job_description)
    score_data = scorer.score()
    logger.info(f"[stream] Scoring complete (mode: {score_data.get('mode', 'jd')})")

    resume_text = parsed_data.get("enriched_text", parsed_data.get("raw_text", ""))
    user = getattr(request.state, "user", None)
    session_id = request.headers.get("X-Session-ID", "")
    scan_id = str(uuid.uuid4())
    
    try:
        resume_data = extract_resume_data(parsed_data, score_data)
        db.collection("resume_scans").document(scan_id).set({
            "scan_id": scan_id,
            "timestamp": datetime.utcnow().isoformat(),
            "user_uid": user["id"] if user else None,
            "session_id": session_id,
            "score": score_data.get("total_score", 0),
            "grade": score_data.get("grade", "F"),
            "score_breakdown": score_data.get("breakdown", {}),
            "resume_data": resume_data,
            "jd_provided": bool(job_description),
            "pdf_generated": False,
            "auto_fix_used": False,
            "mode": score_data.get("mode", "general")
        })
    except Exception as e:
        logger.error(f"[stream] Failed to save to resume_scans: {e}")

    async def event_generator():
        import json as _json
        # 1. Send score data immediately
        yield f"data: {_json.dumps({'type': 'score', 'data': score_data, 'parsed_resume': parsed_data, 'scan_id': scan_id})}\n\n"

        # 2. Stream AI analysis chunks
        llm_service = LLMService()
        final_insights = None

        async for event in llm_service.stream_analysis(resume_text, job_description, score_data):
            if event.get("event") == "chunk":
                yield f"data: {_json.dumps({'type': 'chunk', 'content': event['content']})}\n\n"
            elif event.get("event") == "done":
                final_insights = event["data"]
                yield f"data: {_json.dumps({'type': 'done', 'data': final_insights})}\n\n"
            elif event.get("event") == "error":
                yield f"data: {_json.dumps({'type': 'error', 'message': event['message']})}\n\n"
                return

        # 3. Save to Firestore if authenticated
        if user and final_insights:
            try:
                db.collection("scans").add({
                    "uid": user["id"],
                    "resumeFilename": file.filename,
                    "jobTitle": "Custom Analysis",
                    "score": score_data.get("total_score", 0),
                    "grade": score_data.get("grade", "F"),
                    "breakdown": score_data.get("breakdown", {}),
                    "matchedKeywords": score_data.get("matched_keywords", []),
                    "missingKeywords": score_data.get("missing_keywords", []),
                    "aiInsights": final_insights,
                    "createdAt": datetime.utcnow()
                })
                logger.info(f"[stream] Scan saved for user: {user['id']}")
            except Exception as e:
                logger.error(f"[stream] Failed to save scan: {e}")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        }
    )

@app.get("/api/v1/history")
async def get_history(user: dict = Depends(get_current_user)):
    from google.cloud.firestore import Query
    docs = db.collection("scans").where("uid", "==", user["id"]).order_by("createdAt", direction=Query.DESCENDING).limit(50).stream()
    history = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        history.append(data)
    
    return {
        "status": "success",
        "user_id": user["id"],
        "history": history 
    }

@app.post("/api/v1/rewrite")
async def rewrite_section(
    section_text: str = Form(...),
    job_description: str = Form(...),
    section_name: str = Form(...),
    user: dict = Depends(get_pro_user)
):
    llm_service = LLMService()
    result = await llm_service.rewrite_section(section_text, job_description, section_name)
    return {
        "status": "success",
        "rewritten_text": result.get("rewritten_text", "")
    }


@app.post("/api/v1/auto-fix")
@limiter.limit("5/minute")
async def auto_fix_resume(request: Request):
    """Auto-fix endpoint: rewrites the full resume with AI fixes applied, returns structured JSON via SSE."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    resume_text = body.get("resume_text", "")
    score_data = body.get("score_data", {})
    insights = body.get("insights", {})
    extracted_links = body.get("extracted_links", []) or []
    scan_id = body.get("scan_id", "")

    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="resume_text is required")

    user = getattr(request.state, "user", None)
    session_id = request.headers.get("X-Session-ID", "")
    
    if not user and session_id:
        docs = db.collection("resume_scans").where("session_id", "==", session_id).where("pdf_generated", "==", True).get()
        if len(docs) >= 3:
            raise HTTPException(status_code=429, detail="Sign in to generate more resumes")
            
    if scan_id:
        try:
            db.collection("resume_scans").document(scan_id).update({
                "pdf_generated": True,
                "auto_fix_used": True,
                "pdf_generated_at": datetime.utcnow().isoformat()
            })
        except Exception as e:
            logger.error(f"Failed to update scan doc: {e}")

    logger.info("[auto-fix] Starting auto-fix pipeline")

    llm_service = LLMService()

    async def event_generator():
        import json as _json
        async for event in llm_service.auto_fix_resume(resume_text, score_data, insights, extracted_links):
            if event.get("event") == "step":
                yield f"data: {_json.dumps({'type': 'step', 'step': event['step']})}\n\n"
            elif event.get("event") == "done":
                yield f"data: {_json.dumps({'type': 'done', 'data': event['data']})}\n\n"
            elif event.get("event") == "error":
                yield f"data: {_json.dumps({'type': 'error', 'message': event['message']})}\n\n"
                return

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        }
    )

@app.post("/api/v1/analyze/score-json")
@limiter.limit("10/minute")
async def analyze_score_json(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    resume_json = body.get("resume_json", {})
    job_description = body.get("job_description", "")

    # Reconstruct raw_text and sections
    sections = {
        "contact": [],
        "summary": [],
        "experience": [],
        "education": [],
        "skills": [],
        "projects": []
    }
    raw_lines = []

    # Name & Contact
    name = resume_json.get("name", "")
    if name:
        raw_lines.append(name)
        sections["contact"].append(name)

    contact = resume_json.get("contact", {})
    contact_parts = [v for k, v in contact.items() if v and isinstance(v, str) and not v.startswith("http")]
    if contact_parts:
        contact_line = " | ".join(contact_parts)
        raw_lines.append(contact_line)
        sections["contact"].append(contact_line)

    summary = resume_json.get("summary", "")
    if summary:
        raw_lines.append("SUMMARY")
        raw_lines.append(summary)
        sections["summary"].append(summary)

    exp = resume_json.get("experience", [])
    if exp:
        raw_lines.append("EXPERIENCE")
        for e in exp:
            line = f"{e.get('title', '')} at {e.get('company', '')} ({e.get('duration', '')})"
            raw_lines.append(line)
            sections["experience"].append(line)
            for b in e.get("bullets", []):
                raw_lines.append(b)
                sections["experience"].append(b)

    edu = resume_json.get("education", [])
    if edu:
        raw_lines.append("EDUCATION")
        for e in edu:
            line = f"{e.get('degree', '')} from {e.get('institution', '')} ({e.get('year', '')})"
            raw_lines.append(line)
            sections["education"].append(line)

    skills = resume_json.get("skills", [])
    if skills:
        raw_lines.append("SKILLS")
        skills_line = ", ".join(skills)
        raw_lines.append(skills_line)
        sections["skills"].append(skills_line)

    proj = resume_json.get("projects", [])
    if proj:
        raw_lines.append("PROJECTS")
        for p in proj:
            line = f"{p.get('name', '')} ({p.get('tech', '')})"
            raw_lines.append(line)
            sections["projects"].append(line)
            if p.get("description"):
                raw_lines.append(p["description"])
                sections["projects"].append(p["description"])
            for b in p.get("achievements", []):
                raw_lines.append(b)
                sections["projects"].append(b)

    raw_text = "\n".join(raw_lines)
    word_count = len(re.findall(r'\b\w+\b', raw_text))

    parsed_data = {
        "raw_text": raw_text,
        "sections": sections,
        "word_count": word_count,
        "email": contact.get("email", ""),
        "phone": contact.get("phone", ""),
        "links": [contact.get(k) for k in ["linkedin", "github", "portfolio"] if contact.get(k)]
    }

    scorer = ATSScorer(parsed_data, job_description)
    score_data = scorer.score()
    
    return {
        "status": "success",
        "score": score_data
    }
