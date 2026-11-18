from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel  #для описания данных
import httpx


from core.safety import check_safety
from core.schemas import PatientCase, TriageResult
from core.router import route_patient

from fastapi import Header, HTTPException

CORE_URL = "https://tm-test-yakut.hostco.ru"
app = FastAPI()

# Настройка CORS (чтобы React мог делать запросы)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Бэкенд работает!"}


class SymptomRequest(BaseModel):
    text: str  # ожидаем JSON вида: {"text": "болит голова"}


@app.post("/api/check-symptoms")

async def check_symptoms(req: SymptomRequest): 
    safety_result = check_safety(req.text)
    
    if safety_result.is_emergency:
        return {
            "is_emergency": True,
            "message": safety_result.instruction,
            "matched_rule": safety_result.matched_rule
        }
    return {
        "is_emergency": False,
        "message": "Критических симптомов не найдено.",
    }



@app.post("/api/triage", response_model=TriageResult)
async def get_triage(case:PatientCase):
    return route_patient(case)



@app.get("/api/auth/me")
async def get_user_data(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Нет токена")
    
    token = authorization.split(" ")[1]

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{CORE_URL}/api/v3/users/user-for-external-service",
                params={"token":token},
                timeout=10.0
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=401, detail="Неверный токен")
        except Exception:
            raise HTTPException(status_code=503, detail="Сервер авторизации недоступен")
    