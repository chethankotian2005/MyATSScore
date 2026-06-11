import pytest
from app.services.scorer import ATSScorer, fuzzy_match

@pytest.fixture
def base_resume():
    return {
        "raw_text": "Experienced software engineer with a focus on machine learning and python. I have 5 years of experience. Increased revenue by $5000 and improved performance by 20%.",
        "sections": {
            "contact": ["john.doe@example.com"],
            "summary": ["Experienced software engineer."],
            "experience": ["Increased revenue by $5000", "improved performance by 20%", "Managed 10 people"],
            "education": ["BS Computer Science"],
            "skills": ["Python", "Machine Learning"]
        },
        "word_count": 500,
        "has_tables": False,
        "has_columns": False,
        "has_images": False
    }

def test_scorer_perfect_score(base_resume):
    jd = "software engineer with machine learning and python experience."
    scorer = ATSScorer(base_resume, jd)
    result = scorer.score()
    
    assert result["breakdown"]["section"] == 20
    assert result["breakdown"]["formatting"] == 20
    assert result["breakdown"]["quantification"] == 10
    assert result["breakdown"]["length"] == 10
    assert result["total_score"] >= 90
    assert result["grade"] == "A"

def test_scorer_missing_sections(base_resume):
    base_resume["sections"]["education"] = []
    base_resume["sections"]["skills"] = []
    jd = "software engineer"
    scorer = ATSScorer(base_resume, jd)
    result = scorer.score()
    
    # Missing education (5) and skills (5) -> 20 - 10 = 10
    assert result["breakdown"]["section"] == 10

def test_scorer_formatting_penalties(base_resume):
    base_resume["has_tables"] = True
    base_resume["has_columns"] = True
    base_resume["has_images"] = True
    # empty multiple sections to trigger missing headers penalty
    base_resume["sections"] = {"experience": [], "education": [], "skills": [], "certifications": [], "projects": []}
    jd = "software engineer"
    
    scorer = ATSScorer(base_resume, jd)
    result = scorer.score()
    
    assert result["breakdown"]["formatting"] == 0

def test_scorer_quantification_none(base_resume):
    base_resume["sections"]["experience"] = ["Worked on a project", "Fixed bugs"]
    jd = "software engineer"
    scorer = ATSScorer(base_resume, jd)
    result = scorer.score()
    
    assert result["breakdown"]["quantification"] == 0

def test_scorer_quantification_partial(base_resume):
    base_resume["sections"]["experience"] = ["Worked on 1 project"]
    jd = "software engineer"
    scorer = ATSScorer(base_resume, jd)
    result = scorer.score()
    
    assert result["breakdown"]["quantification"] == 5

def test_scorer_length_too_short(base_resume):
    base_resume["word_count"] = 250
    jd = "software engineer"
    scorer = ATSScorer(base_resume, jd)
    result = scorer.score()
    
    assert result["breakdown"]["length"] == 4

def test_scorer_length_too_long(base_resume):
    base_resume["word_count"] = 1200
    jd = "software engineer"
    scorer = ATSScorer(base_resume, jd)
    result = scorer.score()
    
    assert result["breakdown"]["length"] == 4

def test_scorer_fuzzy_matching():
    assert fuzzy_match("machine learning", "I do ml") is True
    assert fuzzy_match("ml", "I do machine learning") is True
    assert fuzzy_match("python", "python3") is True
    assert fuzzy_match("fastapi", "I use fast api") is False # Difflib might not catch this depending on cutoff, but standard is fine
