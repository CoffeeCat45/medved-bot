from core.router import route_patient
from core.schemas import PatientCase, Urgency

def test_child_routing():
    # пациент - ребенок отправить к Педиатру
    case = PatientCase(category="температура", is_child=True)
    result = route_patient(case)
    assert result.specialist == "Педиатр"
    assert result.urgency == Urgency.URGENT_24H

def test_paid_routing():
    # Платно должно измениться место
    case = PatientCase(category="боль", payment_preference="Платно")
    result = route_patient(case)
    assert "Частная" in result.place

def test_default_routing():
    # Обычный случай (кожа) - Дерматолог Планово
    case = PatientCase(category="кожа")
    result = route_patient(case)
    assert result.specialist == "Дерматолог"
    assert result.urgency == Urgency.PLANNED