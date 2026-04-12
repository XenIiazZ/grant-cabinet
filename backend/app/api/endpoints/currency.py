from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.services.currency_service import currency_service

router = APIRouter(prefix="/currency", tags=["currency"])

@router.get("/rates")
async def get_currency_rates(
    base: str = Query("RUB", description="Базовая валюта (RUB, USD, EUR)")
):
    """Получить текущие курсы валют относительно базовой"""
    if base not in ["RUB", "USD", "EUR"]:
        raise HTTPException(status_code=400, detail="Поддерживаются только RUB, USD, EUR")
    rates = await currency_service.get_rates(base)
    return rates