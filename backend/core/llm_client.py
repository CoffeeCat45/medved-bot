from dotenv import load_dotenv
import os
import re
import json
from abc import ABC, abstractmethod

import httpx
from gigachat import GigaChat

load_dotenv()





# 1 Базовый интерфейс для всех провайдеров
class LLMProvider(ABC):
    @abstractmethod
    async def classify_symptom(self, text: str) -> dict:
        pass

""" 
# 2 Реализация для Hugging Face (ruRoberta)
class HuggingFaceProvider(LLMProvider):
    def __init__(self):
        self.classifier = pipeline(
            "text-classification",
            model="VladimirRH/ruRoberta-large-medical-router",
            device=-1
        )

    async def classify_symptom(self, text: str) -> dict:
        result = self.classifier(text)[0]
        return {"category": result["label"], "confidence": result["score"]}
      
      
        '''  
        
        headers = {"Authorization": f"Bearer {self.api_token}"}
        payload = {"inputs": text, "options": {"wait_for_model": True}}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.api_url, headers=headers, json=payload)

            if response.status_code != 200:
                return {"category": "unknown", "error": response.text}

            result = response.json()

            if isinstance(result, list) and len(result) > 0:
                best = result[0]
                return {"category": best["label"], "confidence": best["score"]}
            return {"category": "unknown", "confidence": 0.0}
        
    
        '''
"""




# 3 реализация GigaChat
class GigaChatProvider(LLMProvider):
    def __init__(self):
        # Ключ авторизации — это Base64-строка от "Client ID:Client Secret"
        self.credentials = os.getenv("GIGACHAT_CREDENTIALS")
        if not self.credentials:
            raise ValueError("GIGACHAT_CREDENTIALS не задан в .env")
        
        # Для физических лиц используем scope="GIGACHAT_API_PERS"
        self.scope = os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")
        self.model = os.getenv("GIGACHAT_MODEL", "GigaChat") # По умолчанию Lite

    async def classify_symptom(self, text: str) -> dict:
        with GigaChat(
            base_url="https://api.giga.chat/v1",
            credentials=self.credentials,
            scope=self.scope,
            model=self.model,
            verify_ssl_certs=False,
        ) as client:
            
            prompt = f"""
            Ты — медицинский классификатор. Проанализируй жалобу пациента и верни ТОЛЬКО JSON-объект в формате: 
            {{"category": "название_категории", "confidence": 0.95}}
            
            Возможные категории: "боль", "температура", "дыхание", "жкт", "кожа", 
            "неврология", "травма", "лор", "глаза", "психиатрия".
            
            Жалоба: {text}
            """
            
            # В SDK GigaChat правильный формат передачи сообщений
            response = client.chat({
                "messages": [{"role": "user", "content": prompt}]
            })
            
            raw_content = response.choices[0].message.content
            
            # Очищаем ответ от возможных markdown-тегов ```json ... ```
            clean_content = re.sub(r'```json\s*|\s*```', '', raw_content).strip()
            
            try:
                data = json.loads(clean_content)
                return {
                    "category": data.get("category", "Терапевт"), 
                    "confidence": data.get("confidence", 0.8)
                }
            except json.JSONDecodeError:
                # Если GigaChat не смог вернуть JSON, отдаем дефолт
                return {"category": "Терапевт", "confidence": 0.5}

def get_llm_provider() -> LLMProvider:
    provider_name = os.getenv("LLM_PROVIDER", "gigachat").lower()
    if provider_name == "gigachat":
        return GigaChatProvider()
    else:
        raise ValueError(f"Неизвестный провайдер: {provider_name}")

# 4 выбора провайдера

def get_llm_provider() -> LLMProvider:
    provider_name = os.getenv("LLM_PROVIDER", "huggingface").lower()
    if provider_name == "huggingface":
        return HuggingFaceProvider()
    elif provider_name == "gigachat":
        return GigaChatProvider()
    else:
        raise ValueError(f"Неизвестный провайдер: {provider_name}")