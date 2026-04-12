import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class CurrencyService:
    def __init__(self):
        # Используем бесплатный API без ключа
        self.base_url = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies"
        self.cache: Dict[str, dict] = {}
        self.cache_ttl = timedelta(hours=6)
    
    async def get_rates(self, base: str = "RUB") -> dict:
        """Получить курсы валют относительно базовой валюты"""
        base = base.lower()
        cache_key = f"rates_{base}"
        
        if cache_key in self.cache:
            cached = self.cache[cache_key]
            if datetime.utcnow() - cached["timestamp"] < self.cache_ttl:
                logger.info(f"Возвращаем курсы из кэша для {base}")
                return cached["data"]
        
        try:
            async with aiohttp.ClientSession() as session:
                for attempt in range(3):
                    try:
                        # Запрашиваем курсы относительно USD
                        async with session.get(
                            f"{self.base_url}/usd.json",
                            timeout=aiohttp.ClientTimeout(total=10)
                        ) as resp:
                            if resp.status == 200:
                                data = await resp.json()
                                usd_rates = data.get("usd", {})
                                
                                usd_to_rub = usd_rates.get("rub", 90.0)
                                usd_to_eur = usd_rates.get("eur", 0.92)
                                
                                if base == "usd":
                                    result_rates = {"USD": 1.0, "EUR": usd_to_eur, "RUB": usd_to_rub}
                                elif base == "eur":
                                    eur_to_usd = 1 / usd_to_eur
                                    eur_to_rub = usd_to_rub / usd_to_eur
                                    result_rates = {"USD": eur_to_usd, "EUR": 1.0, "RUB": eur_to_rub}
                                else:  # base == "rub"
                                    rub_to_usd = 1 / usd_to_rub
                                    rub_to_eur = 1 / usd_to_eur
                                    result_rates = {"USD": rub_to_usd, "EUR": rub_to_eur, "RUB": 1.0}
                                
                                result = {
                                    "base": base.upper(),
                                    "rates": result_rates,
                                    "timestamp": datetime.utcnow().isoformat()
                                }
                                self.cache[cache_key] = {"data": result, "timestamp": datetime.utcnow()}
                                logger.info(f"Курсы валют получены: {result}")
                                return result
                            else:
                                logger.warning(f"Ошибка API: {resp.status}")
                    except asyncio.TimeoutError:
                        logger.warning(f"Таймаут при запросе курсов (попытка {attempt+1})")
                    except Exception as e:
                        logger.error(f"Ошибка запроса курсов: {e}")
                    
                    if attempt < 2:
                        await asyncio.sleep(1)
                
                return self._get_fallback_rates(base)
        except Exception as e:
            logger.error(f"Критическая ошибка получения курсов: {e}")
            return self._get_fallback_rates(base)
    
    def _get_fallback_rates(self, base: str) -> dict:
        base = base.upper()
        fallback = {
            "RUB": {"USD": 1/76, "EUR": 1/91, "RUB": 1.0},
            "USD": {"RUB": 76.0, "EUR": 91/76, "USD": 1.0},
            "EUR": {"RUB": 91.0, "USD": 76/91, "EUR": 1.0}
        }
        rates = fallback.get(base, fallback["RUB"])
        return {
            "base": base,
            "rates": rates,
            "timestamp": datetime.utcnow().isoformat(),
            "is_fallback": True
        }

currency_service = CurrencyService()