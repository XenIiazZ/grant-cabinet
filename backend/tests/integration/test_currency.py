from unittest.mock import patch

def test_get_currency_rates_success(client):
    with patch("app.services.currency_service.currency_service.get_rates") as mock:
        mock.return_value = {"base": "RUB", "rates": {"USD": 0.013, "EUR": 0.011}}
        response = client.get("/api/currency/rates?base=RUB")
        assert response.status_code == 200
        data = response.json()
        assert data["base"] == "RUB"
        assert "USD" in data["rates"]

def test_get_currency_rates_invalid_base(client):
    response = client.get("/api/currency/rates?base=XXX")
    assert response.status_code == 400
    assert "Поддерживаются только" in response.text