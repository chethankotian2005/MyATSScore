import spacy
import difflib
import re
import hashlib
import json
import os
import redis

# Load spacy model (handle if not found)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
_redis_client = redis.from_url(REDIS_URL, decode_responses=True)

POWER_VERBS = {
    "led", "built", "improved", "designed", "developed", "managed", "created",
    "implemented", "optimized", "delivered", "achieved", "reduced", "increased",
    "launched", "architected", "analyzed", "collaborated", "streamlined",
    "automated", "mentored", "negotiated", "spearheaded", "orchestrated",
    "resolved", "transformed", "established", "executed", "generated",
}

def extract_keywords_from_jd(jd_text: str):
    if not jd_text or not jd_text.strip():
        return []
    doc = nlp(jd_text)
    keywords = set()
    for chunk in doc.noun_chunks:
        if chunk.root.pos_ in ['NOUN', 'PROPN']:
            text = chunk.text.lower().strip()
            if len(text) > 2:
                keywords.add(text)
    for token in doc:
        if token.pos_ in ['NOUN', 'PROPN'] and not token.is_stop and len(token.text) > 2:
            keywords.add(token.text.lower())
    return list(keywords)

def fuzzy_match(keyword, text, threshold=0.8):
    text_lower = text.lower()
    
    if keyword == "machine learning" and "ml" in text_lower.split():
        return True
    if keyword == "ml" and "machine learning" in text_lower:
        return True
        
    words = text_lower.split()
    matches = difflib.get_close_matches(keyword, words, n=1, cutoff=threshold)
    if matches:
        return True
        
    if keyword in text_lower:
        return True
        
    return False

class ATSScorer:
    def __init__(self, parsed_resume: dict, job_description: str | None = None):
        self.resume = parsed_resume
        self.jd = job_description or ""
        self.raw_text = parsed_resume.get("raw_text", "")
        self.sections = parsed_resume.get("sections", {})
        self.has_jd = bool(self.jd.strip())
        
    def detect_missing_critical_items(self):
        missing = []
        raw_text_lower = self.raw_text.lower()
        contact_text = " ".join(self.sections.get("contact", [])).lower()
        exp_lines = self.sections.get("experience", [])
        exp_text = " ".join(exp_lines)
        exp_text_lower = exp_text.lower()
        
        # 1. No LinkedIn URL
        if "linkedin.com/in/" not in raw_text_lower and "linkedin.com" not in contact_text:
            missing.append({
                "id": "no_linkedin",
                "severity": "critical",
                "title": "Missing LinkedIn Profile",
                "description": "Recruiters expect to see a professional LinkedIn presence.",
                "fix_template": "Add: linkedin.com/in/your-name to your contact section"
            })
            
        # 2. No measurable achievements
        numbers_found = re.findall(r'\b\d+\b|\d+%|\$\d+', exp_text)
        if len(numbers_found) == 0 and len(exp_lines) > 0:
            missing.append({
                "id": "no_metrics",
                "severity": "critical",
                "title": "Zero Measurable Achievements",
                "description": "Your experience lacks numbers, which makes impact hard to gauge.",
                "fix_template": "Change 'Managed a team' to 'Managed a team of 8, delivering 3 projects 20% under budget'"
            })
            
        # 3. Skills section has fewer than 6 skills
        skills_text = " ".join(self.sections.get("skills", [])).lower()
        skill_count = len(skills_text.split(',')) if ',' in skills_text else len(skills_text.split())
        if skill_count > 0 and skill_count < 6:
            missing.append({
                "id": "few_skills",
                "severity": "critical",
                "title": "Insufficient Skills Listed",
                "description": "ATS systems heavily weigh the skills section for keyword matching.",
                "fix_template": "Add at least 6-10 relevant technical and soft skills"
            })
        elif skill_count == 0:
            missing.append({
                "id": "no_skills",
                "severity": "critical",
                "title": "Missing Skills Section",
                "description": "ATS systems heavily weigh the skills section for keyword matching.",
                "fix_template": "Add at least 6-10 relevant technical and soft skills"
            })
            
        # 4. No summary/objective section
        if not self.sections.get("summary") and not self.sections.get("objective"):
            missing.append({
                "id": "no_summary",
                "severity": "important",
                "title": "Missing Professional Summary",
                "description": "A summary gives recruiters a quick snapshot of your value.",
                "fix_template": "Add a 2-3 sentence professional summary at the top"
            })
            
        # 5. No GitHub/portfolio URL (for tech roles)
        is_tech = any(kw in raw_text_lower for kw in ["software", "developer", "engineer", "data", "programming"])
        if is_tech and "github.com" not in raw_text_lower and "portfolio" not in raw_text_lower:
            missing.append({
                "id": "no_portfolio",
                "severity": "important",
                "title": "Missing Portfolio/GitHub",
                "description": "Tech roles require proof of work via a portfolio or GitHub.",
                "fix_template": "Add your GitHub or portfolio URL to contact section"
            })
            
        # 6. Experience bullets start with weak verbs
        weak_verbs = ["was", "helped", "worked", "did", "made"]
        has_weak = any(f" {wv} " in exp_text_lower for wv in weak_verbs) or any(exp_text_lower.startswith(wv + " ") for wv in weak_verbs)
        if has_weak:
            missing.append({
                "id": "weak_verbs",
                "severity": "important",
                "title": "Weak Action Verbs",
                "description": "Some experience bullets start with passive or weak verbs.",
                "fix_template": "Replace weak verbs: 'Helped build' → 'Engineered', 'Worked on' → 'Developed'"
            })
            
        # 7. Resume under 300 words
        word_count = self.resume.get("word_count", len(self.raw_text.split()))
        if word_count < 300:
            missing.append({
                "id": "too_short",
                "severity": "critical",
                "title": "Resume Too Short",
                "description": "Resumes under 300 words often lack sufficient detail for ATS parsing.",
                "fix_template": "Your resume is too short. Add more detail to experience sections."
            })
            
        # 8. No certifications section (for tech roles)
        if is_tech and not self.sections.get("certifications"):
            missing.append({
                "id": "no_certs",
                "severity": "suggested",
                "title": "Missing Certifications",
                "description": "Certifications can help you stand out for technical roles.",
                "fix_template": "Add relevant certifications: AWS, Google Cloud, etc."
            })
            
        # 9. Education missing graduation year
        edu_text = " ".join(self.sections.get("education", []))
        if edu_text and not re.search(r'\b(19|20)\d{2}\b', edu_text):
            missing.append({
                "id": "edu_no_year",
                "severity": "suggested",
                "title": "Missing Graduation Year",
                "description": "Recruiters use graduation years to determine experience levels.",
                "fix_template": "Add your graduation year to the Education section"
            })
            
        # 10. No projects section (for students/freshers)
        is_fresher = len(exp_lines) < 3 or (edu_text and re.search(r'\b(2023|2024|2025|2026)\b', edu_text))
        if is_fresher and not self.sections.get("projects"):
            missing.append({
                "id": "no_projects",
                "severity": "important",
                "title": "Missing Projects Section",
                "description": "Early career resumes need personal/academic projects to show skills.",
                "fix_template": "Add 2-3 projects with tech stack, your role, and outcomes"
            })
            
        return missing
        
    def score(self) -> dict:
        # Check Redis cache first
        cache_key = f"scorer:{hashlib.md5(self.raw_text.encode()).hexdigest()}_{hashlib.md5(self.jd.encode()).hexdigest()}"
        try:
            cached = _redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

        if self.has_jd:
            result = self._score_jd_mode()
        else:
            result = self._score_general_mode()
            
        result["critical_missing"] = self.detect_missing_critical_items()

        # Cache result for 1 hour
        try:
            _redis_client.setex(cache_key, 3600, json.dumps(result))
        except Exception:
            pass

        return result

    def _score_jd_mode(self) -> dict:
        """Full scoring with job description keyword matching."""
        jd_keywords = extract_keywords_from_jd(self.jd)
        
        # 1. Keyword match score (40pts)
        matched_keywords = []
        missing_keywords = []
        
        for kw in jd_keywords:
            if fuzzy_match(kw, self.raw_text):
                matched_keywords.append(kw)
            else:
                missing_keywords.append(kw)
                
        keyword_score = 0
        if jd_keywords:
            keyword_score = round((len(matched_keywords) / len(jd_keywords)) * 40)
        else:
            keyword_score = 40 
            
        # 2. Section completeness (20pts)
        section_score = 0
        suggestions = []
        expected_sections = ['experience', 'education', 'skills', 'contact']
        
        for sec in expected_sections:
            if len(self.sections.get(sec, [])) > 0:
                section_score += 5
            else:
                suggestions.append(f"Add a clear '{sec.capitalize()}' section.")
                
        # 3. Formatting score (20pts)
        formatting_score = 20
        if self.resume.get("has_tables"):
            formatting_score -= 10
            suggestions.append("Remove tables. ATS systems cannot reliably parse tables.")
        if self.resume.get("has_images"):
            formatting_score -= 10
            suggestions.append("Remove images. Images confuse ATS parsers.")
        if self.resume.get("has_columns"):
            formatting_score -= 10
            suggestions.append("Use a single-column layout instead of multiple columns.")
            
        empty_sections = sum(1 for k, v in self.sections.items() if len(v) == 0)
        if empty_sections > 3: 
            formatting_score -= 5
            suggestions.append("Make sure section headers are standard (e.g., 'Experience', 'Education').")
            
        formatting_score = max(0, formatting_score)
        
        # 4. Quantification score (10pts)
        quantification_score = 0
        exp_lines = self.sections.get("experience", [])
        exp_text = " ".join(exp_lines)
        
        numbers_found = re.findall(r'\b\d+\b|\d+%|\$\d+', exp_text)
        if len(numbers_found) >= 3:
            quantification_score = 10
        elif len(numbers_found) > 0:
            quantification_score = 5
            suggestions.append("Add more quantified achievements (metrics, $, %) to your experience.")
        else:
            suggestions.append("Quantify your achievements in the Experience section using numbers, percentages, or dollar amounts.")
            
        # 5. Length score (10pts)
        word_count = self.resume.get("word_count", len(self.raw_text.split()))
        length_score = 4
        if 400 <= word_count <= 800:
            length_score = 10
        elif 300 <= word_count < 400 or 800 < word_count <= 1000:
            length_score = 7
            if word_count < 400:
                suggestions.append("Resume is a bit short. Aim for 400-800 words.")
            else:
                suggestions.append("Resume is getting long. Try to keep it under 800 words.")
        else:
            if word_count < 300:
                suggestions.append("Resume is too short. Add more detail to reach at least 400 words.")
            else:
                suggestions.append("Resume is too long. Edit down to the most relevant 800 words.")
                
        total_score = keyword_score + section_score + formatting_score + quantification_score + length_score
        
        grade = "F"
        if total_score >= 85: grade = "A"
        elif total_score >= 70: grade = "B"
        elif total_score >= 55: grade = "C"
        elif total_score >= 40: grade = "D"
        
        return {
            "mode": "jd",
            "total_score": total_score,
            "grade": grade,
            "breakdown": {
                "keyword": keyword_score,
                "section": section_score,
                "formatting": formatting_score,
                "quantification": quantification_score,
                "length": length_score
            },
            "matched_keywords": matched_keywords,
            "missing_keywords": missing_keywords,
            "suggestions": suggestions
        }

    def _score_general_mode(self) -> dict:
        """Score against universal ATS best practices without a job description."""
        suggestions = []

        # 1. Section completeness (25pts)
        section_score = 0
        expected = {'contact': 5, 'summary': 5, 'experience': 5, 'education': 5, 'skills': 5}
        for sec, pts in expected.items():
            if len(self.sections.get(sec, [])) > 0:
                section_score += pts
            else:
                suggestions.append(f"Add a clear '{sec.capitalize()}' section.")

        # 2. Formatting quality (20pts)
        formatting_score = 20
        if self.resume.get("has_tables"):
            formatting_score -= 10
            suggestions.append("Remove tables. ATS systems cannot reliably parse tables.")
        if self.resume.get("has_images"):
            formatting_score -= 5
            suggestions.append("Remove images. Images confuse ATS parsers.")
        if self.resume.get("has_columns"):
            formatting_score -= 5
            suggestions.append("Use a single-column layout instead of multiple columns.")
        formatting_score = max(0, formatting_score)

        # 3. Quantification (20pts)
        exp_lines = self.sections.get("experience", [])
        exp_text = " ".join(exp_lines)
        numbers_found = re.findall(r'\b\d+\b|\d+%|\$\d+', exp_text)
        if len(numbers_found) >= 5:
            quantification_score = 20
        elif len(numbers_found) >= 3:
            quantification_score = 15
        elif len(numbers_found) >= 1:
            quantification_score = 8
            suggestions.append("Add more quantified achievements (metrics, $, %) to your experience.")
        else:
            quantification_score = 0
            suggestions.append("Quantify your achievements using numbers, percentages, or dollar amounts.")

        # 4. Power verbs / keyword density (20pts)
        text_lower = self.raw_text.lower()
        words = set(text_lower.split())
        found_verbs = words.intersection(POWER_VERBS)
        if len(found_verbs) >= 8:
            verb_score = 20
        elif len(found_verbs) >= 5:
            verb_score = 15
        elif len(found_verbs) >= 2:
            verb_score = 10
        else:
            verb_score = 3
            suggestions.append("Use strong action verbs like 'led', 'built', 'improved', 'designed'.")

        # 5. Length (15pts)
        word_count = self.resume.get("word_count", len(self.raw_text.split()))
        if 400 <= word_count <= 800:
            length_score = 15
        elif 300 <= word_count < 400 or 800 < word_count <= 1000:
            length_score = 10
            if word_count < 400:
                suggestions.append("Resume is a bit short. Aim for 400-800 words.")
            else:
                suggestions.append("Resume is getting long. Try to keep it under 800 words.")
        else:
            length_score = 4
            if word_count < 300:
                suggestions.append("Resume is too short. Add more detail to reach at least 400 words.")
            else:
                suggestions.append("Resume is too long. Edit down to the most relevant 800 words.")

        total_score = section_score + formatting_score + quantification_score + verb_score + length_score

        grade = "F"
        if total_score >= 85: grade = "A"
        elif total_score >= 70: grade = "B"
        elif total_score >= 55: grade = "C"
        elif total_score >= 40: grade = "D"

        return {
            "mode": "general",
            "total_score": total_score,
            "grade": grade,
            "breakdown": {
                "section": section_score,
                "formatting": formatting_score,
                "quantification": quantification_score,
                "keyword": verb_score,
                "length": length_score
            },
            "matched_keywords": list(found_verbs),
            "missing_keywords": [],
            "suggestions": suggestions
        }
