from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel  #для описания данных
from core.safety import check_safety
from core.schemas import PatientCase, TriageResult, Urgency
from core.router import route_patient

from fastapi import Header, HTTPException


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

# Класс наследуется от BaseModel, значит Pydantic будет автоматически проверять типы.
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
        "message": f"Бэкенд получил текст: '{req.text}'. Критических симптомов не найдено.",
    }



@app.post("/api/triage", response_model=TriageResult)
async def get_triage(case:PatientCase):
    return route_patient(case)



@app.get("/api/auth/me")
async def get_user_data(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Нет токена")
    
    # ЗАГЛУШКА
    return {
        "_id": "12345",
        "full_name": {
            "lastName": "Иванов",
            "firstName": "Иван"
        },
        "birthDate": "1990-01-01",
        "phone": "71234567890"
    }