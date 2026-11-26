import asyncio
import logging
import os

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from core.safety import check_safety
from core.schemas import (
    PatientCase, TriageResult, SymptomRequest, SymptomCheckResult,
    UserProfile, FullName,
)
from core.router import route_patient, TRIAGE_RULES
from core.nlp import extract_symptoms
from core.llm_client import get_llm_provider



logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CORE_URL = os.getenv("CORE_URL", "https://tm-test-yakut.hostco.ru").rstrip("/")
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "8"))
ALLOWED_ORIGINS = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS",
    "https://coffeecat45.github.io,http://localhost:5173,http://127.0.0.1:5173",
).split(",") if o.strip()]

app = FastAPI(title="Медведь онлайн", version="1.0.0")


# Настройка CORS (чтобы React мог делать запросы)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,   # Bearer-токен, не куки
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)



@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Бэкенд работает"}

@app.post("/api/check-symptoms", response_model=SymptomCheckResult)
async def check_symptoms(req: SymptomRequest):
    safety_result = check_safety(req.text, is_child=req.is_child)

    if safety_result.is_emergency:
        return SymptomCheckResult(
            is_emergency=True,
            message=safety_result.instruction,
            matched_rule=safety_result.matched_rule or "",
        )
    return SymptomCheckResult(
        is_emergency=False,
        message="Критических симптомов не найдено.",
        matched_rule="",
    )


@app.post("/api/triage", response_model=TriageResult)
async def get_triage(case: PatientCase):
    # 0 Слой безопасности до LLM: нейросеть не должна задерживать красный экран
    safety = check_safety(
        " ".join(p for p in [case.complaint_text, case.localization] if p),
        is_child=case.is_child,
    )
    if safety.is_emergency:
        return route_patient(case)

    # Если категория размыта пытаемся вытащить её из текста
    if case.category.lower().strip() in ["общая жалоба", "боль", ""] and case.complaint_text:
        allowed = set(TRIAGE_RULES["categories"].keys())
        try:
            # 1 умную LLM
            provider = get_llm_provider()
            llm_result = await asyncio.wait_for(
                provider.classify_symptom(case.complaint_text), timeout=LLM_TIMEOUT
            )
            new_cat = str(llm_result.get("category", "")).lower().strip()

            # берем ответ только если это реальная категория из yaml
            if new_cat in allowed:
                case.category = new_cat
        except Exception:
            # 2 Если GigaChat недоступен используем NLP
            logger.warning("LLM недоступен, включаем NLP fallback")
            nlp_result = extract_symptoms(case.complaint_text)
            new_cat = str(nlp_result.get("category", "")).lower().strip()
            if new_cat in allowed:
                case.category = new_cat

    return route_patient(case)


@app.get("/api/auth/me", response_model=UserProfile)
async def get_user_data(authorization: str = Header(None)):
    # токен из заголовка
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("AUTH stage=header detail=no_bearer")
        raise HTTPException(status_code=401, detail="AUTH_NO_TOKEN: нет заголовка Authorization")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        logger.warning("AUTH stage=header detail=empty_bearer")
        raise HTTPException(status_code=401, detail="AUTH_NO_TOKEN: пустой Bearer-токен")

    # запрос в CORE
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{CORE_URL}/api/v3/users/user-for-external-service",
                params={"token": token},
            )
    except httpx.RequestError as exc:
        logger.error("AUTH stage=core detail=network error=%s", type(exc).__name__)
        raise HTTPException(status_code=503, detail="AUTH_CORE_UNREACHABLE: сервис авторизации не отвечает")

    logger.info("AUTH stage=core detail=status_%s", response.status_code)

    # разбор ответа CORE
    if response.status_code in (401, 403):
        raise HTTPException(status_code=401, detail="AUTH_TOKEN_REJECTED: CORE отклонил токен")
    if response.status_code != 200:
        logger.error("AUTH stage=core detail=error_status_%s", response.status_code)
        raise HTTPException(status_code=502, detail=f"AUTH_CORE_ERROR: CORE вернул {response.status_code}")

    data = response.json()
    logger.info("AUTH stage=ok detail=user_%s", (data.get("full_name") or {}).get("lastName", "?"))
    name = data.get("full_name") or {}
    return UserProfile(
        full_name=FullName(
            lastName=name.get("lastName", ""),
            firstName=name.get("firstName", ""),
            middleName=name.get("middleName", ""),
        ),
        birthDate=data.get("birthDate", ""),
        phone=data.get("phone", ""),
    )

@app.post("/api/parse-text")
async def parse_text(req: SymptomRequest):
    # берем текст и возвращаем категорию локализацию
    return extract_symptoms(req.text)


@app.post("/api/llm-classify")
async def llm_classify(req: SymptomRequest):
    try:
        provider = get_llm_provider()
        return await asyncio.wait_for(provider.classify_symptom(req.text), timeout=LLM_TIMEOUT)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="LLM не ответила вовремя")
    except Exception as exc:
        logger.error("LLM ошибка: %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="LLM недоступен")