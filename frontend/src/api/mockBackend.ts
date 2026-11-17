import type {
  PatientCasePayload,
  TriageResult,
  EmergencyAlert,
} from "../types";

export async function fetchUserProfile() {
  // TODO: BACKEND — добавить получение token из URL и запрос на /api/auth/me:
  /*
  if (token) {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) return await res.json();
  }
  */

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

export async function checkRedFlags(text: string): Promise<EmergencyAlert> {
  if (!text.trim()) {
    return { is_emergency: false, message: "", matched_rule: "" };
  }

  // TODO: BACKEND — добавить запрос на /api/check-symptoms:
  /*
  const res = await fetch(`${API_BASE_URL}/api/check-symptoms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return await res.json();
  */

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

export async function submitTriage(
  payload: PatientCasePayload,
): Promise<TriageResult> {
  // TODO: BACKEND — добавить запрос на /api/triage:
  /*
  const res = await fetch(`${API_BASE_URL}/api/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
  */

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
