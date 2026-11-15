from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional


class Urgency(str, Enum):
    EMERGENCY = "Экстренно"
    URGENT_24H = "Срочно (24ч)"
    PLANNED = "Планово"
    SELF_CARE = "Самопомощь"

class PaymentType(str, Enum):
    OMS = "ОМС"
    DMS = "ДМС"
    PAID = "Платно"


class PatientCase (BaseModel):
    # 1 шаг жалобы
    category: str = Field(description="Категория: боль, температура, дыхание...")
    complaint_text: str = Field(default="", description="Свободный текст от пациента")
    localization: str = Field(default="", description="Где именно болит")

    # 2 шаг анамнез
    chronic_diseases: List[str] = Field(default_factory=list, description="Список болезней (диабет, астма...)")
    medications: str = Field(default="", description="Принимаемые лекарства")
    allergies: str = Field(default="", description="Аллергии")
    surgeries_last_year: bool = Field(default=False, description="Были ли операции за год")
    family_history: List[str] = Field(default_factory=list, description="Наследственность")
    
    # Особые условия
    is_pregnant: bool = Field(default=False, description="Беременность/лактация")
    is_child: bool = Field(default=False, description="Пациент — ребенок")
    smoking: bool = Field(default=False, description="Курение")
    
    # Опционально
    payment_preference: Optional[PaymentType] = Field(default=None, description="ОМС, ДМС или Платно")


class TriageResult(BaseModel):
    specialist: str = Field(description="К какому врачу идти (Терапевт, Кардиолог...)")
    urgency: Urgency = Field(description="Насколько срочно")
    place: str = Field(description="Куда обращаться (Поликлиника, Скорая...)")
    reasoning: List[str] = Field(description="Список причин, почему мы так решили (как на макете)")
    
    # Дисклеймер, который обязательно должен быть (по ТЗ)
    disclaimer: str = Field(default="Бот не ставит диагноз и не заменяет врача. При ухудшении вызывайте 103/112.")