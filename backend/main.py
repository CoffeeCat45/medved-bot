from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Разрешаем фронтенду (localhost:5173) делать запросы к бэкенду
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Для хакатона можно разрешить всё
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Бэкенд работает!"}