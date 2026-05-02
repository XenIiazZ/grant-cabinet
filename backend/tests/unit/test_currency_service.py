import pytest
from unittest.mock import AsyncMock, patch
from app.services.currency_service import currency_service

@pytest.mark.asyncio
async def test_get_rates_cache():
    with patch("aiohttp.ClientSession.get") as mock_get:
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={"usd": {"rub": 90.0, "eur": 0.85}})
        mock_get.return_value.__aenter__.return_value = mock_response

        rates1 = await currency_service.get_rates("USD")
        assert rates1["base"] == "USD"
        assert rates1["rates"]["RUB"] == 90.0

        # второй вызов – из кэша
        rates2 = await currency_service.get_rates("USD")
        assert rates2 == rates1
        assert mock_get.call_count == 1

@pytest.mark.asyncio
async def test_fallback_on_error():
    with patch("aiohttp.ClientSession.get") as mock_get:
        mock_get.side_effect = Exception("Network error")
        rates = await currency_service.get_rates("RUB")
        assert rates["is_fallback"] == True
        assert rates["rates"]["USD"] == 1/76
        assert rates["rates"]["EUR"] == 1/91