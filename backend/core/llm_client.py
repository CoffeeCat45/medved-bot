import os
import httpx
from abc import ABC, abstractmethod

# 1 Базовый интерфейс для всех провайдеров
class LLMProvider(ABC):
    @abstractmethod
    async def classify_symptom(self, text: str) -> dict:
        """Возвращает {'category': '...', 'confidence': 0.95}"""
        pass

# 2 Реализация для Hugging Face (ruRoberta)
class HuggingFaceProvider(LLMProvider):
    def __init__(self):
        self.api_token = os.getenv("HF_API_TOKEN")
        self.model_id = os.getenv("HF_MODEL_ID", "VladimirRH/ruRoberta-large-medical-router")
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_id}"

        if not self.api_token:
            raise ValueError("HF_API_TOKEN не задан в .env")

    async def classify_symptom(self, text: str) -> dict:
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

# 3 пример как добавить второго провайдера
class GigaChatProvider(LLMProvider):
    async def classify_symptom(self, text: str) -> dict:
        # Здесь код
        return {"category": "Терапевт", "confidence": 0.99}

# 4 Фабрика для выбора провайдера

def get_llm_provider() -> LLMProvider:
    provider_name = os.getenv("LLM_PROVIDER", "huggingface").lower()
    if provider_name == "huggingface":
        return HuggingFaceProvider
    elif provider_name == "gigachat":
        return GigaChatProvider()
    else:
        raise ValueError(f"Неизвестный провайдер: {provider_name}")