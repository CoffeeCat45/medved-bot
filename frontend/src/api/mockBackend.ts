import type {
  PatientCasePayload,
  TriageResult,
  EmergencyAlert,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function apiRequest(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
}
export async function fetchUserProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  try {
    if (token) {
      return await apiRequest("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    return await apiRequest("/api/auth/me");
  } catch {
    // Fallback-заглушка, если бэкенд недоступен
    return {
      full_name: {
        lastName: "Иванов",
        firstName: "Иван",
        middleName: "Иванович",
      },
      birthDate: "1995-05-15",
      phone: "79001234567",
    };
  }
}

export async function checkRedFlags(text: string): Promise<EmergencyAlert> {
  if (!text.trim()) {
    return { is_emergency: false, message: "", matched_rule: "" };
  }

  try {
    return await apiRequest("/api/check-symptoms", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  } catch {
    // Fallback-заглушка (keyword matching)
    const lower = text.toLowerCase();
    const dangerWords = [
      "груди",
      "задыхаюсь",
      "одышка",
      "кровь",
      "потерял сознание",
      "судороги",
      "инсульт",
    ];
    const found = dangerWords.find((w) => lower.includes(w));

    if (found) {
      return {
        is_emergency: true,
        message:
          "Одышка в покое и боль в груди могут указывать на неотложное состояние. Не ждите окончания опроса.",
        matched_rule: found,
      };
    }

    return { is_emergency: false, message: "", matched_rule: "" };
  }
}

export async function submitTriage(
  payload: PatientCasePayload,
): Promise<TriageResult> {
  try {
    return await apiRequest("/api/triage", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    await new Promise((r) => setTimeout(r, 600));

    const reasons = [
      payload.category && `Вы отметили категорию «${payload.category}»`,
      payload.localization && `Локализация: ${payload.localization}`,
      payload.complaint_text && `Жалоба: «${payload.complaint_text}»`,
      payload.chronic_diseases.length > 0 &&
        `Хронические заболевания: ${payload.chronic_diseases.join(", ")}`,
      payload.is_child && "Учтено, что пациент — ребенок",
    ].filter(Boolean) as string[];

    return {
      specialist: payload.is_child ? "Педиатр" : "Терапевт",
      urgency: "Срочно (24ч)",
      place: "Поликлиника",
      reasoning:
        reasons.length > 0
          ? reasons
          : ["Общая оценка на основе введенных симптомов"],
      disclaimer:
        "Бот не ставит диагноз и не заменяет врача. При ухудшении вызывайте 103/112.",
    };
  }
}