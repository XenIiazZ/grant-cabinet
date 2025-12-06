from pydantic import BaseModel
from typing import List, Dict, Optional

class GrantEvaluationRequest(BaseModel):
    """Запрос на ML оценку гранта"""
    application_text: str
    grant_title: Optional[str] = ""
    grant_category: Optional[str] = "general"

class CriterionEvaluation(BaseModel):
    """Оценка по одному критерию"""
    criterion_name: str
    score: float  # 0-1
    label: str  # "Соответствует"/"Не соответствует"/"Требует внимания"
    explanation: str
    recommendation: str

class GrantMLResponse(BaseModel):
    """ML оценка гранта"""
    overall_score: float  # 0-1
    overall_label: str  # "Рекомендовано"/"Требует доработки"/"Не рекомендовано"
    summary: str
    recommendation: str
    criteria_evaluations: List[CriterionEvaluation]
    priority_recommendations: List[str]
    word_count: int