import logging
import yaml
from pathlib import Path
import re

from core.safety import check_safety
from core.schemas import PatientCase, TriageResult, Urgency

logger = logging.getLogger(__name__)

# 1 Загружаем правила
RULES_PATH = Path(__file__).resolve().parent.parent / "rules" / "triage_rules.yaml"

with RULES_PATH.open("r", encoding="utf-8") as f:
    TRIAGE_RULES = yaml.safe_load(f)

URGENCY_ORDER = TRIAGE_RULES["urgency_order"]

URGENCY_ENUM = {
    "Экстренно": Urgency.EMERGENCY,
    "Срочно (24ч)": Urgency.URGENT_24H,
    "Планово": Urgency.PLANNED,
    "Самопомощь": Urgency.SELF_CARE,
}


def _norm(text: str) -> str:
    return (text or "").lower().replace("ё", "е").strip()


def _rank(urgency: str) -> int:
    try:
        return URGENCY_ORDER.index(urgency)
    except ValueError:
        return URGENCY_ORDER.index("Планово")


def _raise(current: str, minimum: str | None) -> str:
    # срочность можно только повысить, понизить нельзя
    if not minimum:
        return current
    return minimum if _rank(minimum) > _rank(current) else current


def _is_empty(value: str) -> bool:
    return _norm(value) in TRIAGE_RULES.get("empty_markers", [""])

def _guess_localization(case: PatientCase) -> str:
    # если локализацию не выбрали поиск её в тексте жалобы
    if case.localization.strip():
        return case.localization
    text = _norm(case.complaint_text)
    if not text:
        return ""
    for key in TRIAGE_RULES.get("localization_map", {}):
        stem = key[:-1] if len(key) > 4 else key
        if re.search(r"(?:^|[^а-я])" + re.escape(stem), text):
            return key
    return ""

def route_patient(case: PatientCase) -> TriageResult:
    reasons = [] # объяснения

    # 0 RedFlags важнее LLM
    parts = [case.complaint_text, case.localization]
    loc = _norm(_guess_localization(case))
    # локализация выбрана кнопкой, текста нет все равно проверяем грудь
    if _norm(case.category) in ("боль", "сердце") and "груд" in loc:
        parts.append("боль в груди")

    safety = check_safety(" ".join(p for p in parts if p), is_child=case.is_child)
    if safety.is_emergency:
        override = TRIAGE_RULES["emergency_override"]
        reasons.append(f"Критический признак: {safety.matched_rule}")
        reasons.append(override["reason"])
        return TriageResult(
            specialist=override["specialist"],
            urgency=Urgency.EMERGENCY,
            place=override["place"],
            reasoning=reasons,
            is_emergency=True,
            instruction=safety.instruction,
            disclaimer=TRIAGE_RULES["disclaimers"]["emergency"],
        )

    # 2 берем базовое правило по категории
    category_key = _norm(case.category)
    categories = TRIAGE_RULES["categories"]
    if category_key in categories:
        base_rule = categories[category_key]
        reasons.append(f"Вы указали жалобу из категории '{case.category}'")
        if base_rule.get("reason"):
            reasons.append(base_rule["reason"])
    else:
        base_rule = TRIAGE_RULES["fallback"]
        reasons.append(base_rule["reason"])

    specialist = base_rule["specialist"]
    place = base_rule["place"]
    urgency_str = base_rule["urgency"]

    # 3 уточняем специалиста по локализации
    text_norm = _norm(case.complaint_text)
    if loc:
        for key, rule in TRIAGE_RULES.get("localization_map", {}).items():
            if key in loc:
                # профиль меняем только для неопределенной жалобы
                if category_key in ("боль", "другое", ""):
                    specialist = rule.get("specialist", specialist)
                urgency_str = _raise(urgency_str, rule.get("urgency"))
                if rule.get("reason"):
                    reasons.append(rule["reason"])
                break

    # 4. хронические заболевания повышают срочность
    chronic_text = _norm(", ".join(case.chronic_diseases))
    if chronic_text and not _is_empty(chronic_text):
        for mod in TRIAGE_RULES.get("chronic_modifiers", {}).values():
            only = mod.get("only_categories")
            if only and category_key not in only:
                continue
            if any(_norm(m) in chronic_text for m in mod.get("match", [])):
                urgency_str = _raise(urgency_str, mod.get("urgency_min"))
                specialist = mod.get("specialist", specialist)
                reasons.append(mod["reason"])

    # 5. анамнез и вредные привычки
    anam = TRIAGE_RULES.get("anamnesis_modifiers", {})

    if case.surgeries_last_year:
        mod = anam.get("surgeries_last_year", {})
        only = mod.get("only_categories")
        if not only or category_key in only:
            urgency_str = _raise(urgency_str, mod.get("urgency_min"))
            reasons.append(mod["reason"])

    family_text = _norm(", ".join(case.family_history))
    if family_text and not _is_empty(family_text):
        for mod in anam.get("family_history", {}).values():
            only = mod.get("only_categories")
            if only and category_key not in only:
                continue
            if any(_norm(m) in family_text for m in mod.get("match", [])):
                specialist = mod.get("specialist", specialist)
                urgency_str = _raise(urgency_str, mod.get("urgency_min"))
                reasons.append(mod["reason"])

    if case.smoking:
        mod = anam.get("smoking", {})
        only = mod.get("only_categories")
        if not only or category_key in only:
            reasons.append(mod["reason"])

    if not _is_empty(case.allergies):
        reasons.append(f"{anam['allergies']['reason']}: {case.allergies}")
    if not _is_empty(case.medications):
        reasons.append(anam["medications"]["reason"])

    # 6 затяжное течение в свободном тексте
    for block in TRIAGE_RULES.get("severity_keywords", []):
        if any(_norm(k) in text_norm for k in block.get("keywords", [])):
            urgency_str = _raise(urgency_str, block.get("urgency_min"))
            reasons.append(block["reason"])
            break

    # 7 особые группы пациентов
    if case.is_child:
        mod = TRIAGE_RULES["modifiers"]["child"]
        # хирурга/офтальмолога/кардиолога педиатром не подменяем
        if category_key not in mod.get("keep_specialist_for", []):
            specialist = mod["specialist"]
        urgency_str = _raise(urgency_str, mod.get("urgency_min"))
        reasons.append(mod["reason"])

    if case.is_pregnant:
        mod = TRIAGE_RULES["modifiers"]["pregnant"]
        urgency_str = _raise(urgency_str, mod.get("urgency_min"))
        mapped = mod.get("specialist_for", {}).get(category_key)
        if mapped:
            specialist = mapped
        reasons.append(mod["reason"])

    # 8 место обращения: телемедицина и аптека только для легких случаев
    guards = TRIAGE_RULES.get("place_guards", {})
    remote_blocked = (
        urgency_str in guards.get("remote_blocked_urgency", [])
        or (guards.get("remote_blocked_if_child") and case.is_child)
        or (guards.get("remote_blocked_if_pregnant") and case.is_pregnant)
    )
    if not remote_blocked and place not in guards.get("locked_places", []):
        for rule in TRIAGE_RULES.get("place_rules", []):
            if category_key not in rule.get("categories", []):
                continue
            if urgency_str not in rule.get("allowed_urgency", []):
                continue
            keywords = rule.get("keywords")
            if keywords and not any(_norm(k) in text_norm or _norm(k) in loc for k in keywords):
                continue
            place = rule["place"]
            reasons.append(rule["reason"])
            break

    # 9 тип оплаты влияет только при низкой срочности и только вместо поликлиники
    if case.payment_preference:
        pay_key = case.payment_preference.value
        pay = TRIAGE_RULES.get("payment", {}).get(pay_key)
        if pay:
            if (urgency_str in TRIAGE_RULES.get("payment_allowed_urgency", [])
                    and place in TRIAGE_RULES.get("payment_applies_to_places", [])):
                place = pay["place"]
                reasons.append(pay["note"])
            elif pay_key != "ОМС":
                reasons.append("Тип оплаты не меняет маршрут: срочность важнее способа оплаты")

    # 10 самопомощь только уход, без препаратов и дозировок
    self_care, stop_signals = [], []
    sc = TRIAGE_RULES.get("self_care", {})
    if urgency_str in sc.get("allowed_urgency", []):
        self_care = list(sc.get("tips", []))
        stop_signals = list(sc.get("stop_signals", []))
        if sc.get("stop_action"):
            stop_signals.append(sc["stop_action"])

    # 11 yaml в enum
    urgency_enum = URGENCY_ENUM.get(urgency_str, Urgency.PLANNED)

    # 12. отдаем итог
    return TriageResult(
        specialist=specialist,
        urgency=urgency_enum,
        place=place,
        reasoning=reasons,
        self_care=self_care,
        stop_signals=stop_signals,
        disclaimer=TRIAGE_RULES["disclaimers"]["end"],
    )