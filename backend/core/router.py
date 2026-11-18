import yaml
from pathlib import Path
from core.schemas import PatientCase, TriageResult, Urgency

# 1. Загружаем правила из yaml
RULES_PATH = Path(__file__).resolve().parent.parent / "rules" / "triage_rules.yaml"

with RULES_PATH.open("r", encoding="utf-8") as f:
    TRIAGE_RULES = yaml.safe_load(f)


def route_patient(case: PatientCase) -> TriageResult:
    reasons = [] # объяснения

    # 2. берем базовое правило по категории
    # Если нет категории то терапевт по умолчанию

    category_key = case.category.lower()
    base_rule = TRIAGE_RULES["categories"].get(category_key, TRIAGE_RULES["categories"]["боль"])

    specialist = base_rule["specialist"]
    place = base_rule["place"]
    urgency_str = base_rule["urgency"]

    reasons.append(f"Вы указали жалобу из категории '{case.category}'")

    # 3 проверяем модификаторы
    if case.is_child:
        specialist = TRIAGE_RULES["modifiers"]["child"]["specialist"]
        urgency_str = TRIAGE_RULES["modifiers"]["child"]["urgency"]
        reasons.append("Пациент - ребенок, рекомендован осмотр педиатра")

    if case.is_pregnant:
        urgency_str = TRIAGE_RULES["modifiers"]["pregnant"]["urgency"]
        reasons.append("Пациентка беременна/кормит грудью, требуется повышенное внимание")

    if case.payment_preference:
        if case.payment_preference.value == "Платно":
            place = "Частная клиника"
            reasons.append("Вы выбрали платную медецину")
        elif case.payment_preference.value == "ДМС":
            place = "Клиника по ДМС"
            reasons.append("Вы указали полис ДМС")


    # 4 добавляем хронические болезни
    if case.chronic_diseases:
        reasons.append(f"Учтены хронические заболевания: {', '.join(case.chronic_diseases)}")

    # 5 переводим из yaml в enum
    urgency_enum = Urgency.PLANNED
    if urgency_str == "Срочно (24ч)":
        urgency_enum = Urgency.URGENT_24H
    elif urgency_str == "Экстренно":
        urgency_enum = Urgency.EMERGENCY

    # 6 отдаем итог

    return TriageResult(
        specialist=specialist,
        urgency=urgency_enum,
        place=place,
        reasoning=reasons    
    )