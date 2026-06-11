import httpx
import json
import hashlib
import os
import redis.asyncio as redis
from fastapi import HTTPException
import logging
from groq import AsyncGroq

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
groq_client = AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class LLMService:
    def __init__(self):
        self.redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        self.timeout = 180.0

    async def _call_groq(self, prompt: str) -> str:
        try:
            response = await groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"Groq call failed: {e}")
            raise HTTPException(status_code=503, detail="AI Service is currently unavailable")

    def _cache_key(self, prefix: str, text1: str, text2: str = "") -> str:
        hash_input = f"{text1}_{text2}".encode('utf-8')
        return f"llm:{prefix}:{hashlib.sha256(hash_input).hexdigest()}"

    def _parse_json(self, response_text: str) -> dict | None:
        """Try to parse JSON from LLM response, stripping markdown if present."""
        import re
        clean = response_text.strip()
        match = re.search(r'\{.*\}', clean, re.DOTALL)
        if match:
            clean = match.group(0)
        try:
            return json.loads(clean)
        except json.JSONDecodeError:
            return None

    async def analyze_gaps(self, resume_text: str, job_description: str | None, score_data: dict) -> dict:
        jd_text = job_description or ""
        cache_key = self._cache_key("analyze", resume_text, jd_text)
        
        cached = await self.redis_client.get(cache_key)
        if cached:
            try:
                return json.loads(cached)
            except json.JSONDecodeError:
                pass

        # Truncate inputs to keep prompt short
        resume_short = resume_text[:1500]
        score_summary = json.dumps(score_data.get("breakdown", {}))

        prompt_suffix = """Respond with ONLY a valid JSON object. No markdown, no backticks, no explanation.

RULES:
1. TOP 3 FIXES: Generate exactly 3 fixes that are HYPER-SPECIFIC to this resume. Each fix must:
- Name the exact section it applies to
- Quote or reference actual content from the resume
- Give a concrete one-line action
- NOT be generic advice that applies to any resume
Bad example: 'Add more action verbs'
Good example: 'In your SMVITM Student Council bullet, replace Directed with Orchestrated and add a metric — e.g. grew participation by X%'
Format each fix as a single sentence under 20 words.

2. REWRITTEN SUMMARY: BANNED PHRASES — never use any of these:
- 'Highly motivated'
- 'passionate about'
- 'strong work ethic'
- 'team player'
- 'results-driven'
- 'seeking opportunities'
- 'proficient in'
- 'with X+ years'
- Any phrase starting with 'I am'
Instead write: [Field] student/professional at [Institution/Company] who [specific concrete achievement]. Built [specific project] that [specific result]. Skilled in [3 most relevant techs from resume].
Example for this resume: 'AI/ML engineering student at SMVITM who won the Award of Excellence at GDG Bengaluru's Build for Bengaluru hackathon with VoiceGuru, a multilingual voice tutor serving Kannada, Hindi, Tamil, and English speakers. Delivered production ML pipelines at Global Next Consulting and placed in 10+ national hackathons across AI, blockchain, and healthcare tracks.'

Start your response with { and end with }. Use this exact structure:
{
  "top_3_improvements": ["specific fix 1", "specific fix 2", "specific fix 3"],
  "rewritten_summary": "improved summary text here",
  "section_feedback": {
    "experience": "specific feedback",
    "skills": "specific feedback", 
    "formatting": "specific feedback"
  },
  "formatting_issues": ["issue1", "issue2"]
}"""

        if jd_text.strip():
            jd_short = jd_text[:800]
            prompt = f"""Analyze resume vs job description.
Resume: {resume_short}
JD: {jd_short}
Scores: {score_summary}

{prompt_suffix}"""
        else:
            prompt = f"""Analyze this resume for general ATS compatibility.
Resume: {resume_short}
Scores: {score_summary}

{prompt_suffix}"""

        response_text = await self._call_groq(prompt)
        logger.info(f"Groq response: {response_text[:300]}...")
        
        result = self._parse_json(response_text)
        if result:
            await self.redis_client.setex(cache_key, 86400, json.dumps(result))
            return result

        logger.error(f"Failed to parse JSON from Groq. Response: {response_text}")
        return {
            "top_3_improvements": [
                "Add measurable achievements with numbers (e.g. 'Increased sales by 30%')",
                "Include a professional summary section at the top",
                "Add more industry-relevant keywords to your Skills section"
            ],
            "keyword_suggestions": [],
            "rewritten_summary": "AI analysis could not generate a summary. Your core ATS metrics are still available above.",
            "section_feedback": {"general": "AI analysis was partially interrupted. Try again."},
            "formatting_issues": []
        }

    def _build_prompt(self, resume_text: str, job_description: str | None, score_data: dict) -> str:
        """Build the analysis prompt (shared by analyze_gaps and stream_analysis)."""
        resume_short = resume_text[:1500]
        score_summary = json.dumps(score_data.get("breakdown", {}))
        jd_text = job_description or ""

        prompt_suffix = """Respond with ONLY a valid JSON object. No markdown, no backticks, no explanation.

RULES:
1. TOP 3 FIXES: Generate exactly 3 fixes that are HYPER-SPECIFIC to this resume. Each fix must:
- Name the exact section it applies to
- Quote or reference actual content from the resume
- Give a concrete one-line action
- NOT be generic advice that applies to any resume
Bad example: 'Add more action verbs'
Good example: 'In your SMVITM Student Council bullet, replace Directed with Orchestrated and add a metric — e.g. grew participation by X%'
Format each fix as a single sentence under 20 words.

2. REWRITTEN SUMMARY: BANNED PHRASES — never use any of these:
- 'Highly motivated'
- 'passionate about'
- 'strong work ethic'
- 'team player'
- 'results-driven'
- 'seeking opportunities'
- 'proficient in'
- 'with X+ years'
- Any phrase starting with 'I am'
Instead write: [Field] student/professional at [Institution/Company] who [specific concrete achievement]. Built [specific project] that [specific result]. Skilled in [3 most relevant techs from resume].
Example for this resume: 'AI/ML engineering student at SMVITM who won the Award of Excellence at GDG Bengaluru's Build for Bengaluru hackathon with VoiceGuru, a multilingual voice tutor serving Kannada, Hindi, Tamil, and English speakers. Delivered production ML pipelines at Global Next Consulting and placed in 10+ national hackathons across AI, blockchain, and healthcare tracks.'

Start your response with { and end with }. Use this exact structure:
{
  "top_3_improvements": ["specific fix 1", "specific fix 2", "specific fix 3"],
  "rewritten_summary": "improved summary text here",
  "section_feedback": {
    "experience": "specific feedback",
    "skills": "specific feedback", 
    "formatting": "specific feedback"
  },
  "formatting_issues": ["issue1", "issue2"]
}"""

        if jd_text.strip():
            jd_short = jd_text[:800]
            return f"""Analyze resume vs job description.
Resume: {resume_short}
JD: {jd_short}
Scores: {score_summary}

{prompt_suffix}"""
        else:
            return f"""Analyze this resume for general ATS compatibility.
Resume: {resume_short}
Scores: {score_summary}

{prompt_suffix}"""

    async def stream_analysis(self, resume_text: str, job_description: str | None, score_data: dict):
        """Async generator that streams chunks from Ollama and yields them as they arrive."""
        jd_text = job_description or ""
        cache_key = self._cache_key("analyze", resume_text, jd_text)

        # Check cache first — yield immediately if hit
        cached = await self.redis_client.get(cache_key)
        if cached:
            try:
                result = json.loads(cached)
                yield {"event": "done", "data": result}
                return
            except json.JSONDecodeError:
                pass

        prompt = self._build_prompt(resume_text, job_description, score_data)

        full_response = ""
        try:
            response = await groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                temperature=0.3,
            )
            async for chunk in response:
                token = chunk.choices[0].delta.content
                if token:
                    full_response += token
                    yield {"event": "chunk", "content": token}
        except Exception as e:
            logger.error(f"Groq stream failed: {e}")
            yield {"event": "error", "message": "AI Service is currently unavailable"}
            return

        # Parse the accumulated response
        result = self._parse_json(full_response)
        if result:
            await self.redis_client.setex(cache_key, 86400, json.dumps(result))
            yield {"event": "done", "data": result}
        else:
            logger.error(f"Failed to parse streamed JSON: {full_response}")
            fallback = {
                "top_3_improvements": [
                    "Add measurable achievements with numbers (e.g. 'Increased sales by 30%')",
                    "Include a professional summary section at the top",
                    "Add more industry-relevant keywords to your Skills section"
                ],
                "keyword_suggestions": [],
                "rewritten_summary": "AI analysis could not generate a summary. Your core ATS metrics are still available above.",
                "section_feedback": {"general": "AI analysis was partially interrupted. Try again."},
                "formatting_issues": []
            }
            yield {"event": "done", "data": fallback}

    async def rewrite_section(self, section_text: str, job_description: str, section_name: str) -> dict:
        cache_key = self._cache_key(f"rewrite_{section_name}", section_text, job_description)
        
        cached = await self.redis_client.get(cache_key)
        if cached:
            try:
                return json.loads(cached)
            except json.JSONDecodeError:
                pass

        prompt = f"""Return ONLY valid JSON. No explanation.
Rewrite this resume '{section_name}' section to be more professional and impactful.
JSON format: {{"rewritten_text":"the rewritten section"}}

Original: {section_text[:1000]}
Job: {job_description[:500]}"""

        response_text = await self._call_groq(prompt)
        
        result = self._parse_json(response_text)
        if result:
            await self.redis_client.setex(cache_key, 86400, json.dumps(result))
            return result

        logger.error(f"Failed to parse JSON from Ollama: {response_text}")
        raise HTTPException(status_code=500, detail="Failed to rewrite section")

    async def auto_fix_resume(self, resume_text: str, score_data: dict, insights: dict):
        """Async generator: rewrites the full resume as structured JSON with AI fixes applied."""
        cache_key = self._cache_key("autofix", resume_text, json.dumps(score_data.get("breakdown", {})))

        # Check cache first
        cached = await self.redis_client.get(cache_key)
        if cached:
            try:
                result = json.loads(cached)
                yield {"event": "step", "step": 1}
                yield {"event": "step", "step": 2}
                yield {"event": "step", "step": 3}
                yield {"event": "done", "data": result}
                return
            except json.JSONDecodeError:
                pass

        # Build fixes list from score_data and insights
        fixes = []
        if insights.get("top_3_improvements"):
            for fix in insights["top_3_improvements"]:
                fixes.append(fix)
        if score_data.get("critical_missing"):
            for item in score_data["critical_missing"]:
                fixes.append(f"{item.get('title', '')}: {item.get('description', '')}")
        if insights.get("formatting_issues"):
            for issue in insights["formatting_issues"]:
                fixes.append(f"Fix formatting: {issue}")

        fixes_text = "\n".join(f"- {f}" for f in fixes) if fixes else "- Improve overall clarity and impact"

        schema = '''{
  "name": "Full Name",
  "contact": { "email": "...", "phone": "...", "linkedin": "...", "github": "..." },
  "summary": "Professional summary paragraph",
  "experience": [ { "title": "Job Title", "company": "Company Name", "duration": "Start - End", "bullets": ["Achievement 1", "Achievement 2"] } ],
  "education": [ { "degree": "Degree Name", "institution": "University Name", "year": "Graduation Year" } ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "projects": [ { "name": "Project Name", "tech": "Technologies Used", "description": "Brief description", "achievements": ["Achievement 1"] } ]
}'''

        prompt = f"""You are a professional resume writer and ATS optimization expert.

Rewrite the following resume applying these specific fixes:
{fixes_text}

RULES:
1. Return ONLY valid JSON matching the schema below. No markdown, no backticks, no explanation.
2. Start your response with {{ and end with }}.
3. Keep ALL factual details accurate — do not invent experience, education, companies, or dates.
4. Strengthen weak action verbs (e.g. "helped" → "spearheaded", "worked on" → "engineered").
5. Add quantifiable metrics where natural (e.g. "managed team" → "managed team of 8 engineers").
6. Extract contact fields ONLY if explicitly present in the resume text. Rules:
- linkedin: extract only if a linkedin.com URL exists in the text. If not found: return empty string ''
- github: extract only if a github.com URL exists in the text. If not found: return empty string ''
- portfolio: extract only if a portfolio URL exists in the text. If not found: return empty string ''
DO NOT generate, invent, or use placeholder URLs like 'linkedin.com/in/yourprofile'. Empty string means omit entirely.
7. ABSOLUTE RULE: Project descriptions are sacred. You MUST copy every project bullet point VERBATIM from the input resume. Do NOT paraphrase, summarize, or rewrite project bullets. Only fix grammar and punctuation. The project name, tech stack, award, and every bullet must match the input exactly. If you cannot find project bullets in the input, output 'See original resume for details' — never invent content.
8. Ensure each experience bullet starts with a strong action verb.
9. Write a 2-3 sentence summary that mentions: (a) the candidate's specific field/degree, (b) their most impressive concrete achievement (use the highest award or most notable project), (c) their core technical stack. Be specific. No filler phrases like 'highly motivated'.
10. List skills as individual items, not categories.

RESUME TEXT:
{resume_text[:3000]}

{f'AI REWRITTEN SUMMARY (use this): {insights.get("rewritten_summary", "")}' if insights.get("rewritten_summary") else ''}

OUTPUT JSON SCHEMA:
{schema}"""

        # Step 1: Applying AI suggestions
        yield {"event": "step", "step": 1}

        full_response = ""
        try:
            response = await groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                temperature=0.3,
            )

            # Step 2: Optimizing for ATS
            yield {"event": "step", "step": 2}

            async for chunk in response:
                token = chunk.choices[0].delta.content
                if token:
                    full_response += token

        except Exception as e:
            logger.error(f"Groq auto-fix stream failed: {e}")
            yield {"event": "error", "message": "AI Service is currently unavailable. Please try again."}
            return

        # Step 3: Generating PDF
        yield {"event": "step", "step": 3}

        # Parse the accumulated response
        result = self._parse_json(full_response)
        if result:
            await self.redis_client.setex(cache_key, 86400, json.dumps(result))
            yield {"event": "done", "data": result}
        else:
            logger.error(f"Failed to parse auto-fix JSON: {full_response[:500]}")
            yield {"event": "error", "message": "Failed to generate optimized resume. Please try again."}

