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


class SymptomRequest(BaseModel):
    text: str = Field(description="Свободный текст пациента")
    is_child: bool = Field(default=False, description="Пациент — ребенок (для порога температуры)")


class SymptomCheckResult(BaseModel):
    is_emergency: bool = Field(description="Найден критический признак")
    message: str = Field(default="", description="Инструкция для пациента")
    matched_rule: str = Field(default="", description="Какое правило сработало")


class FullName(BaseModel):
    lastName: str = ""
    firstName: str = ""
    middleName: str = ""


class UserProfile(BaseModel):
    # Минимизация ПДн: СНИЛС, ОМС и _id сюда НЕ попадают
    full_name: FullName = Field(default_factory=FullName)
    birthDate: str = ""
    phone: str = ""


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
    reasoning: List[str] = Field(description="Список причин, почему мы так решили")

    # Красный флаг, найденный на сервере (фронт рисует красный экран)
    is_emergency: bool = Field(default=False, description="Маршрутизация прервана красным флагом")
    instruction: str = Field(default="", description="Экстренная инструкция")

    # Самопомощь: только уход, без препаратов
    self_care: List[str] = Field(default_factory=list, description="Разрешенные советы по уходу")
    stop_signals: List[str] = Field(default_factory=list, description="Когда прекратить самолечение")
    
    # Дисклеймер
    disclaimer: str = Field(default="Бот не ставит диагноз и не заменяет врача. При ухудшении вызывайте 103/112.")