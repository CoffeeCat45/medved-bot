import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    """HTTP-клиент для интеграционных тестов."""
    return TestClient(app)


@pytest.fixture
def base_case():
    """Базовый кейс пациента для тестов роутера."""
    from core.schemas import PatientCase
    return PatientCase(
        category="боль",
        complaint_text="",
        localization="",
        chronic_diseases=[],
        medications="",
        allergies="",
        surgeries_last_year=False,
        family_history=[],
        is_pregnant=False,
        is_child=False,
        smoking=False,
        payment_preference=None,
    )