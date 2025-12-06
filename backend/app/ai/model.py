import numpy as np
from typing import Dict, List, Tuple
from sentence_transformers import SentenceTransformer, util
import re
import os

class GrantMLModel:
    """
    ML модель для оценки грантовых заявок
    Использует BERT для семантического анализа и комбинирует с правилами
    """
    
    def __init__(self, model_path: str = None):
        # Загружаем предобученную модель для русского языка
        self.text_model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        
        # Инициализируем критерии
        self.criteria = [
            "объем_заявки",
            "описание_проекта", 
            "бюджетное_обоснование",
            "сроки_реализации",
            "социальная_значимость"
        ]
        
        # Веса критериев
        self.criteria_weights = {
            "объем_заявки": 0.15,
            "описание_проекта": 0.25,
            "бюджетное_обоснование": 0.20,
            "сроки_реализации": 0.15,
            "социальная_значимость": 0.25
        }
        
        # Инициализируем эмбеддинги ключевых фраз
        self._init_keyword_embeddings()
    
    def _init_keyword_embeddings(self):
        """Инициализирует эмбеддинги ключевых фраз для каждого критерия"""
        self.keyword_embeddings = {}
        
        # Ключевые фразы для каждого критерия
        keyword_phrases = {
            "описание_проекта": [
                "цель проекта задачи проекта методология проекта",
                "разработка системы создание алгоритма реализация проекта",
                "исследование разработка внедрение технология"
            ],
            "бюджетное_обоснование": [
                "бюджет проекта финансовое обоснование смета расходов",
                "стоимость оборудования затраты на материалы оплата труда",
                "финансирование проекта экономическое обоснование"
            ],
            "сроки_реализации": [
                "сроки выполнения этапы проекта график работ",
                "временные рамки период реализации календарный план",
                "длительность проекта поэтапное выполнение"
            ],
            "социальная_значимость": [
                "социальная значимость польза для общества общественная ценность",
                "вклад в развитие социальный эффект общественное благо",
                "помощь населению развитие региона социальные последствия"
            ]
        }
        
        # Создаем эмбеддинги для ключевых фраз
        for criterion, phrases in keyword_phrases.items():
            phrase_embeddings = []
            for phrase in phrases:
                embedding = self.text_model.encode(phrase)
                phrase_embeddings.append(embedding)
            self.keyword_embeddings[criterion] = phrase_embeddings
    
    def _bert_semantic_score(self, text_embedding: np.ndarray, criterion: str) -> float:
        """Вычисляет семантическую оценку на основе BERT"""
        if criterion not in self.keyword_embeddings:
            return 0.5  # По умолчанию
        
        # Вычисляем максимальное косинусное сходство с ключевыми фразами
        max_similarity = 0
        for phrase_embedding in self.keyword_embeddings[criterion]:
            similarity = util.cos_sim(text_embedding, phrase_embedding).item()
            max_similarity = max(max_similarity, similarity)
        
        # Нормализуем оценку
        return float(max_similarity * 1.5)  # Масштабируем
    
    def _rule_based_score(self, criterion: str, text: str) -> float:
        """Вычисляет оценку на основе правил"""
        text_lower = text.lower()
        words = re.findall(r'\b\w+\b', text_lower)
        
        if criterion == "объем_заявки":
            word_count = len(words)
            # Нормализуем к 100 словам
            score = min(word_count / 100, 1.0)
            # Буст для длинных текстов
            if word_count > 200:
                score = min(score * 1.2, 1.0)
            return score
        
        elif criterion == "описание_проекта":
            keywords = ["цель", "задача", "проект", "метод", "алгоритм", "разработка", "реализация"]
            found = sum(1 for kw in keywords if kw in text_lower)
            return min(found / 3, 1.0)
        
        elif criterion == "бюджетное_обоснование":
            keywords = ["бюджет", "руб", "стоимость", "финанс", "расход", "затрат", "смета"]
            found = sum(1 for kw in keywords if kw in text_lower)
            # Проверяем наличие цифр (сумм)
            has_numbers = bool(re.search(r'\d+[\s]*тыс|\d+[\s]*млн|\d+[\s]*[0-9]{3,}', text_lower))
            base_score = min(found / 2, 1.0)
            if has_numbers:
                base_score = min(base_score + 0.3, 1.0)
            return base_score
        
        elif criterion == "сроки_реализации":
            keywords = ["срок", "месяц", "год", "период", "этап", "график", "квартал"]
            found = sum(1 for kw in keywords if kw in text_lower)
            return min(found / 2, 1.0)
        
        elif criterion == "социальная_значимость":
            keywords = ["социальн", "общество", "польза", "значимость", "развитие", "помощь", "вклад"]
            found = sum(1 for kw in keywords if kw in text_lower)
            return min(found / 2, 1.0)
        
        return 0.5
    
    def predict_criteria(self, text: str) -> Dict[str, Dict]:
        """Предсказывает соответствие всем критериям"""
        if len(text.strip()) < 10:
            return self._get_default_predictions()
        
        # Получаем BERT эмбеддинг всего текста
        text_embedding = self.text_model.encode(text)
        
        predictions = {}
        
        for criterion in self.criteria:
            # Комбинируем BERT семантическую оценку и правило-основанную
            bert_score = self._bert_semantic_score(text_embedding, criterion)
            rule_score = self._rule_based_score(criterion, text)
            
            # Весовая комбинация
            if criterion == "объем_заявки":
                # Для объема используем только правила
                final_score = rule_score
            else:
                # 70% BERT, 30% правила
                final_score = bert_score * 0.7 + rule_score * 0.3
            
            # Обеспечиваем диапазон 0-1
            final_score = max(0, min(1, final_score))
            
            # Определяем метку и рекомендации
            label, explanation, recommendation = self._interpret_prediction(
                criterion, final_score, text
            )
            
            predictions[criterion] = {
                "score": float(final_score),
                "label": label,
                "explanation": explanation,
                "recommendation": recommendation
            }
        
        return predictions
    
    def _interpret_prediction(self, criterion: str, score: float, text: str) -> Tuple[str, str, str]:
        """Интерпретирует предсказание в понятный формат"""
        words = re.findall(r'\b\w+\b', text.lower())
        
        if criterion == "объем_заявки":
            word_count = len(words)
            if word_count >= 100:
                return "Соответствует", f"Заявка содержит {word_count} слов (требуется минимум 100)", "Объем заявки достаточный"
            else:
                return "Не соответствует", f"Заявка содержит {word_count} слов (требуется минимум 100)", f"Добавьте еще {100 - word_count} слов"
        
        elif criterion == "описание_проекта":
            project_keywords = ["цель", "задача", "проект", "метод", "результат"]
            has_description = any(keyword in text.lower() for keyword in project_keywords)
            
            if score > 0.7 and has_description:
                return "Соответствует", "Заявка содержит детальное описание проекта", "Описание проекта полное"
            elif score > 0.4:
                return "Требует внимания", "Описание проекта недостаточно детальное", "Добавьте цели и задачи проекта"
            else:
                return "Не соответствует", "Отсутствует описание проекта", "Добавьте описание проекта с указанием целей и задач"
        
        elif criterion == "бюджетное_обоснование":
            budget_keywords = ["бюджет", "финансирование", "расход", "стоимость", "рубл"]
            has_budget = any(keyword in text.lower() for keyword in budget_keywords)
            
            if score > 0.7 and has_budget:
                return "Соответствует", "Заявка содержит бюджетное обоснование", "Бюджет хорошо обоснован"
            elif score > 0.4 or has_budget:
                return "Требует внимания", "Бюджетное обоснование требует уточнения", "Рекомендуется указать планируемые расходы"
            else:
                return "Не соответствует", "Отсутствует бюджетное обоснование", "Добавьте раздел с бюджетом и обоснованием расходов"
        
        elif criterion == "сроки_реализации":
            time_keywords = ["срок", "период", "этап", "месяц", "год", "график"]
            has_timeline = any(keyword in text.lower() for keyword in time_keywords)
            
            if score > 0.6 and has_timeline:
                return "Соответствует", "Заявка содержит информацию о сроках", "Сроки реализации указаны"
            elif score > 0.3:
                return "Требует внимания", "Информация о сроках недостаточно детальная", "Уточните сроки реализации проекта"
            else:
                return "Не соответствует", "Отсутствует информация о сроках", "Добавьте сроки реализации проекта"
        
        elif criterion == "социальная_значимость":
            social_keywords = ["социальный", "общество", "польза", "значимость", "развитие"]
            has_social = any(keyword in text.lower() for keyword in social_keywords)
            
            if score > 0.7 and has_social:
                return "Соответствует", "Заявка подчеркивает социальную значимость", "Социальная значимость хорошо описана"
            elif score > 0.4:
                return "Требует внимания", "Социальная значимость требует более детального описания", "Укажите социальную значимость и пользу проекта"
            else:
                return "Не соответствует", "Не описана социальная значимость проекта", "Добавьте раздел о социальной значимости проекта"
        
        # По умолчанию
        if score > 0.6:
            return "Соответствует", "Критерий выполнен", "Продолжайте в том же духе"
        elif score > 0.3:
            return "Требует внимания", "Требуется улучшение", "Проработайте этот аспект"
        else:
            return "Не соответствует", "Критерий не выполнен", "Требуется серьезная доработка"
    
    def _get_default_predictions(self) -> Dict[str, Dict]:
        """Возвращает предсказания по умолчанию для очень короткого текста"""
        return {
            "объем_заявки": {
                "score": 0.1,
                "label": "Не соответствует",
                "explanation": "Заявка слишком короткая",
                "recommendation": "Добавьте содержание в заявку"
            },
            "описание_проекта": {
                "score": 0.1,
                "label": "Не соответствует",
                "explanation": "Отсутствует описание проекта",
                "recommendation": "Добавьте описание проекта"
            },
            "бюджетное_обоснование": {
                "score": 0.1,
                "label": "Не соответствует",
                "explanation": "Отсутствует бюджетное обоснование",
                "recommendation": "Добавьте бюджет"
            },
            "сроки_реализации": {
                "score": 0.1,
                "label": "Не соответствует",
                "explanation": "Отсутствует информация о сроках",
                "recommendation": "Укажите сроки"
            },
            "социальная_значимость": {
                "score": 0.1,
                "label": "Не соответствует",
                "explanation": "Не описана социальная значимость",
                "recommendation": "Опишите социальную значимость"
            }
        }
    
    def calculate_overall_score(self, predictions: Dict[str, Dict]) -> Dict:
        """Рассчитывает общую оценку"""
        total_weighted_score = 0
        total_weight = 0
        
        for criterion, pred in predictions.items():
            weight = self.criteria_weights.get(criterion, 0.2)
            score = pred["score"]
            
            # Преобразуем метку в числовой балл
            if pred["label"] == "Соответствует":
                label_score = 1.0
            elif pred["label"] == "Требует внимания":
                label_score = 0.5
            else:
                label_score = 0.0
            
            # Комбинируем ML score и label score
            combined_score = (score * 0.7 + label_score * 0.3)
            total_weighted_score += combined_score * weight
            total_weight += weight
        
        overall_score = total_weighted_score / total_weight if total_weight > 0 else 0
        
        # Определяем общую оценку
        if overall_score > 0.7:
            overall_label = "Рекомендовано"
            recommendation = "Заявка соответствует основным критериям"
        elif overall_score > 0.4:
            overall_label = "Требует доработки"
            recommendation = "Заявка требует улучшения по некоторым критериям"
        else:
            overall_label = "Не рекомендовано"
            recommendation = "Заявка требует существенной доработки"
        
        # Собираем рекомендации
        all_recommendations = []
        for criterion, pred in predictions.items():
            if pred["label"] != "Соответствует":
                all_recommendations.append(pred["recommendation"])
        
        return {
            "overall_score": float(overall_score),
            "overall_label": overall_label,
            "summary": f"Общая оценка: {overall_score:.1%}",
            "recommendation": recommendation,
            "priority_recommendations": all_recommendations[:3]  # Топ-3 рекомендации
        }
    
    def load_models(self, path: str):
        """Загружает сохраненные модели (заглушка)"""
        pass
    
    def save_models(self, path: str):
        """Сохраняет модели (заглушка)"""
        pass

# Синглтон модель
grant_ml_model = GrantMLModel()