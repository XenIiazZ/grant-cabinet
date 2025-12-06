from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict

from app.database.session import get_db
from app.api.dependencies import get_current_user
from app.database.models.user import User
from .schemas import GrantEvaluationRequest, GrantMLResponse
from .evaluator import ml_evaluator

router = APIRouter(tags=["ML Grant Evaluation"])

@router.post("/evaluate", response_model=GrantMLResponse)
async def evaluate_grant_ml(
    request: GrantEvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Оценить грантовую заявку с помощью ML модели
    
    Анализирует текст по 5 критериям:
    1. Объем заявки (минимум 100 слов)
    2. Описание проекта (цели, задачи)
    3. Бюджетное обоснование
    4. Сроки реализации
    5. Социальная значимость
    
    Использует предобученную модель BERT и классификаторы
    """
    try:
        if not request.application_text or len(request.application_text.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Текст заявки слишком короткий (минимум 10 символов)"
            )
        
        # Оцениваем заявку
        evaluation = ml_evaluator.evaluate_grant(request)
        
        # Логируем (можно сохранять в БД)
        print(f"ML Evaluation for user {current_user.email}: {evaluation.overall_score}")
        
        return evaluation
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ML evaluation error: {str(e)}"
        )

@router.post("/quick-evaluate")
async def quick_evaluate_ml(
    application_text: str,
    current_user: User = Depends(get_current_user)
):
    """
    Быстрая ML оценка (упрощенный ответ)
    """
    request = GrantEvaluationRequest(application_text=application_text)
    evaluation = ml_evaluator.evaluate_grant(request)
    
    return {
        "overall_score": evaluation.overall_score,
        "overall_label": evaluation.overall_label,
        "word_count": evaluation.word_count,
        "top_recommendation": evaluation.priority_recommendations[0] if evaluation.priority_recommendations else "Нет рекомендаций",
        "criteria_summary": [
            {
                "criterion": ce.criterion_name,
                "status": ce.label,
                "score": f"{ce.score:.0%}"
            }
            for ce in evaluation.criteria_evaluations
        ]
    }

@router.get("/model-info")
async def get_model_info():
    """
    Информация о ML модели
    """
    return {
        "model_name": "BERT + Logistic Regression",
        "language": "Russian",
        "criteria": [
            {"name": "Объем заявки", "description": "Проверяет достаточность объема текста (мин. 100 слов)"},
            {"name": "Описание проекта", "description": "Анализирует наличие целей, задач и методологии"},
            {"name": "Бюджетное обоснование", "description": "Проверяет наличие и обоснованность бюджета"},
            {"name": "Сроки реализации", "description": "Анализирует наличие временных рамок проекта"},
            {"name": "Социальная значимость", "description": "Оценивает описание социальной пользы проекта"}
        ],
        "technologies": ["sentence-transformers", "scikit-learn", "BERT embeddings"],
        "status": "active"
    }

@router.post("/debug-analysis")
async def debug_analysis(
    request: GrantEvaluationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Детальный анализ для отладки (только для разработки)
    """
    analysis = ml_evaluator.get_detailed_analysis(request.application_text)
    return {
        "user": current_user.email,
        "analysis": analysis
    }