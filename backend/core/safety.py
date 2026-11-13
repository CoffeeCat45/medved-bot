import logging
import re
from pathlib import Path

import yaml
from pydantic import BaseModel

logger = logging.getLogger(__name__)

RULES_PATH = Path(__file__).resolve().parent.parent / "rules" / "red_flags.yaml"
_WS_RE = re.compile(r"\s+")


class SafetyResult(BaseModel):
    is_emergency: bool
    instruction: str = ""
    matched_rule: str | None = None


def _load_rules() -> list[dict]:
    with RULES_PATH.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    rules = data["red_flags"]
    for rule in rules:
        rule["keywords"] = [kw.lower() for kw in rule["keywords"]]
    return rules


RED_FLAGS = _load_rules()


def _normalize(text: str) -> str:
    return _WS_RE.sub(" ", text.lower().strip())


def check_safety(text: str) -> SafetyResult:
    normalized = _normalize(text)
    for rule in RED_FLAGS:
        for keyword in rule["keywords"]:
            if keyword in normalized:
                logger.warning("Red flag: %s", rule["name"])
                return SafetyResult(
                    is_emergency=True,
                    instruction=rule["instruction"],
                    matched_rule=rule["name"],
                )
    return SafetyResult(is_emergency=False)