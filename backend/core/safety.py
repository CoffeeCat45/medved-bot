import logging
import re
from pathlib import Path

import yaml
from pydantic import BaseModel

logger = logging.getLogger(__name__)

RULES_PATH = Path(__file__).resolve().parent.parent / "rules" / "red_flags.yaml"
_WS_RE = re.compile(r"\s+")

# Температура: "температура 39.8", "39,8", "жар 40"
_TEMP_CONTEXT_RE = re.compile(r"(?:температур\w*|жар|лихорадк\w*)\D{0,12}(\d{2}(?:[.,]\d{1,2})?)")
_TEMP_BARE_RE = re.compile(r"\b(3[6-9]|4[0-2])[.,]\d{1,2}\b")

# Контекст ребенка в свободном тексте, если флаг с фронта не пришел
_CHILD_WORDS = (
    "ребенок", "ребенка", "ребенку", "ребенком", "дети", "детей",
    "малыш", "груднич", "сын", "дочк", "дочер", "подросток",
)


class SafetyResult(BaseModel):
    is_emergency: bool
    instruction: str = ""
    matched_rule: str | None = None


def _normalize(text: str) -> str:
    # ё -> е
    text = (text or "").lower().replace("ё", "е").replace("\xa0", " ")
    return _WS_RE.sub(" ", text.strip())


def _load_rules() -> list[dict]:
    with RULES_PATH.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    rules = data["red_flags"]
    for rule in rules:
        rule["keywords"] = [_normalize(kw) for kw in rule.get("keywords", [])]
    return rules


RED_FLAGS = _load_rules()


def _max_temperature(normalized: str) -> float | None:
    values = []
    for match in _TEMP_CONTEXT_RE.finditer(normalized):
        values.append(float(match.group(1).replace(",", ".")))
    for match in _TEMP_BARE_RE.finditer(normalized):
        values.append(float(match.group(0).replace(",", ".")))
    return max(values) if values else None


def check_safety(text: str, is_child: bool = False) -> SafetyResult:
    normalized = _normalize(text)
    if not normalized:
        return SafetyResult(is_emergency=False)

    child_ctx = is_child or any(word in normalized for word in _CHILD_WORDS)
    temperature = _max_temperature(normalized)

    for rule in RED_FLAGS:
        # 1 правило только для детей - без контекста ребенка пропускаем
        if rule.get("requires_child") and not child_ctx:
            continue

        # 2 числовой порог важнее ключевых слов
        threshold = rule.get("temp_threshold")
        if threshold is not None and temperature is not None:
            if temperature >= float(threshold):
                logger.warning("Red flag: %s (t=%s)", rule["name"], temperature)
                return SafetyResult(
                    is_emergency=True,
                    instruction=rule["instruction"],
                    matched_rule=rule["name"],
                )
            continue  # число распознано - keywords не применяем

        # 3 keyword-matching
        for keyword in rule["keywords"]:
            if keyword and keyword in normalized:
                logger.warning("Red flag: %s", rule["name"])
                return SafetyResult(
                    is_emergency=True,
                    instruction=rule["instruction"],
                    matched_rule=rule["name"],
                )
    return SafetyResult(is_emergency=False)