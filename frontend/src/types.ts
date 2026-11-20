export type UrgencyLevel =
  | "Экстренно"
  | "Срочно (24ч)"
  | "Планово"
  | "Самопомощь";
export type PaymentType = "ОМС" | "ДМС" | "Платно";

export interface PatientCasePayload {
  category: string;
  complaint_text: string;
  localization: string;
  chronic_diseases: string[];
  medications: string;
  allergies: string;
  surgeries_last_year: boolean;
  family_history: string[];
  is_pregnant: boolean;
  is_child: boolean;
  smoking: boolean;
  payment_preference: PaymentType | null;
}

export interface TriageResult {
  specialist: string;
  urgency: UrgencyLevel;
  place: string;
  reasoning: string[];
  disclaimer: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  specialist: string;
  urgency: UrgencyLevel;
  symptomsSummary: string;
}

export interface EmergencyAlert {
  is_emergency: boolean;
  message: string;
  matched_rule: string;
}

export interface UserProfile {
  full_name: { lastName: string; firstName: string; middleName?: string };
  birthDate: string;
  phone: string;
}

export interface EmergencyAlert {
  is_emergency: boolean;
  message: string;
  matched_rule: string;
  source?: "server" | "local";   // local → показать бейдж «Офлайн-проверка»
}

export interface TriageResult {
  specialist: string;
  urgency: "Экстренно" | "Срочно (24ч)" | "Планово" | "Самопомощь";
  place: string;
  reasoning: string[];
  disclaimer: string;
  is_emergency?: boolean;        // бэкенд сам нашёл красный флаг
  instruction?: string;
  self_care?: string[];
  stop_signals?: string[];
}