from typing import Dict
import re
from .model import grant_ml_model
from .schemas import GrantEvaluationRequest, GrantMLResponse, CriterionEvaluation

class GrantMLEvaluator:
    """Сервис для ML оценки грантов"""
    
    def __init__(self):
        self.model = grant_ml_model
    
    def evaluate_grant(self, request: GrantEvaluationRequest) -> GrantMLResponse:
        """Основной метод оценки"""
        text = request.application_text
        
        # Предсказываем по критериям
        predictions = self.model.predict_criteria(text)
        
        # Рассчитываем общую оценку
        overall = self.model.calculate_overall_score(predictions)
        
        # Подготавливаем ответ в формате схемы
        criteria_evaluations = []
        for criterion_name, pred in predictions.items():
            # Русскоязычные названия для фронтенда
            russian_names = {
                "объем_заявки": "Объем заявки",
                "описание_проекта": "Описание проекта",
                "бюджетное_обоснование": "Бюджетное обоснование",
                "сроки_реализации": "Сроки реализации",
                "социальная_значимость": "Социальная значимость"
            }
            
            criteria_evaluations.append(
                CriterionEvaluation(
                    criterion_name=russian_names.get(criterion_name, criterion_name),
                    score=pred["score"],
                    label=pred["label"],
                    explanation=pred["explanation"],
                    recommendation=pred["recommendation"]
                )
            )
        
        # Считаем количество слов
        words = re.findall(r'\b\w+\b', text)
        word_count = len(words)
        
        return GrantMLResponse(
            overall_score=overall["overall_score"],
            overall_label=overall["overall_label"],
            summary=overall["summary"],
            recommendation=overall["recommendation"],
            criteria_evaluations=criteria_evaluations,
            priority_recommendations=overall["priority_recommendations"],
            word_count=word_count
        )
    
    def get_detailed_analysis(self, text: str) -> Dict:
        """Возвращает детальный анализ (для отладки)"""
        predictions = self.model.predict_criteria(text)
        
        # Собираем статистику
        words = re.findall(r'\b\w+\b', text.lower())
        unique_words = set(words)
        
        return {
            "predictions": predictions,
            "statistics": {
                "word_count": len(words),
                "unique_words": len(unique_words),
                "vocabulary_richness": len(unique_words) / max(len(words), 1),
                "contains_budget": any(kw in text.lower() for kw in ["бюджет", "финанс", "стоимость"]),
                "contains_timeline": any(kw in text.lower() for kw in ["срок", "период", "этап"]),
                "contains_social": any(kw in text.lower() for kw in ["социальн", "общество", "польза"])
            }
        }

# Синглтон
ml_evaluator = GrantMLEvaluator()