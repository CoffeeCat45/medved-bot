import type {
  PatientCasePayload,
  TriageResult,
  EmergencyAlert,
  UserProfile,
} from "../types";

// ── Конфигурация ────────────────────────────────────────────────────────────
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const TIMEOUT_MS = 12_000;

if (!API_BASE_URL) {
  console.error("[medved] VITE_API_BASE_URL пуст — проверь .env.production");
}
console.info("[medved] build:", import.meta.env.MODE, "api:", API_BASE_URL);

// ── Ошибки ──────────────────────────────────────────────────────────────────
export type ApiErrorKind = "http" | "timeout" | "network" | "no-token";

export class ApiError extends Error {
  status?: number;
  kind: ApiErrorKind;
  constructor(message: string, kind: ApiErrorKind = "network", status?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

// ── Транспорт ───────────────────────────────────────────────────────────────
async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { headers, ...rest } = init; // headers вынимаем ДО spread, иначе затираются
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: { "Content-Type": "application/json", ...headers },
      credentials: "omit",
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new ApiError(`${path} → ${res.status}`, "http", res.status);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error)?.name === "AbortError") {
      throw new ApiError("Превышено время ожидания ответа", "timeout");
    }
    throw new ApiError((e as Error)?.message ?? "Сеть недоступна", "network");
  } finally {
    clearTimeout(timer);
  }
}

// ── Авторизация MAX ─────────────────────────────────────────────────────────
function readTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (!token) return null;

  // JWT не должен остаться в адресной строке, истории и реферере
  params.delete("token");
  const qs = params.toString();
  window.history.replaceState(
    {},
    "",
    window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
  );
  return token;
}

let maxToken: string | null = readTokenFromUrl();

export function initAuth(): string | null {
  maxToken = readTokenFromUrl() ?? maxToken;
  return maxToken;
}

export function hasMaxToken(): boolean {
  return Boolean(maxToken);
}

// ── Профиль пользователя ────────────────────────────────────────────────────
const DEMO_PROFILE: UserProfile = {
  full_name: { lastName: "Иванов", firstName: "Иван", middleName: "Иванович" },
  birthDate: "1995-05-15",
  phone: "79001234567",
};

let demoProfile = false;
let profileError: string | null = null;

/** true → в интерфейсе показываем бейдж «Демо-данные», а не настоящее ФИО */
export function isDemoProfile(): boolean {
  return demoProfile;
}

export function getProfileError(): string | null {
  return profileError;
}

export async function fetchUserProfile(): Promise<UserProfile> {
  demoProfile = false;
  profileError = null;

  if (!maxToken) {
    demoProfile = true;
    profileError = "Нет токена MAX — откройте приложение из бота";
    console.warn("[medved] " + profileError);
    return DEMO_PROFILE;
  }

  try {
    return await apiRequest<UserProfile>("/api/auth/me", {
      headers: { Authorization: `Bearer ${maxToken}` },
    });
  } catch (e) {
    demoProfile = true;
    profileError =
      e instanceof ApiError && e.status === 401
        ? "Токен недействителен или истёк (живёт 5 минут)"
        : "Профиль недоступен";
    console.warn("[medved] " + profileError);
    return DEMO_PROFILE;
  }
}

// ── Локальный контур безопасности ───────────────────────────────────────────
// КОПИЯ backend/rules/red_flags.yaml. Порядок правил = приоритет.
// Ключевые слова только с «е»: нормализация ё→е делается в normalize().
// При правке YAML — синхронизировать этот список.

type LocalRule = {
  name: string;
  keywords: string[];
  instruction: string;
  tempThreshold?: number;
  requiresChild?: boolean;
};

const LOCAL_RED_FLAGS: LocalRule[] = [
  {
    name: "Боль в груди",
    keywords: [
      "боль в груди", "болит в груди", "болит грудь", "давит в груди",
      "давит за грудиной", "жжет в груди", "сжимает грудь", "сдавило грудь",
      "болит сердце", "отдает в руку", "отдает в левую", "отдает в челюсть",
    ],
    instruction:
      "Вызовите скорую помощь (103/112) немедленно! Боль в груди может быть признаком инфаркта. Не ждите окончания опроса.",
  },
  {
    name: "Анафилаксия",
    keywords: [
      "отек горла", "отек языка", "отек губ", "отек лица", "опух язык",
      "опухло горло", "опухла шея", "не могу глотать", "трудно глотать",
      "анафилак", "крапивница по всему телу", "сыпь и трудно дышать",
      "после укуса стало трудно дышать",
    ],
    instruction:
      "Вызовите скорую помощь (103/112) немедленно! Отёк дыхательных путей может быть признаком анафилаксии. Если есть автоинъектор адреналина — примените по инструкции.",
  },
  {
    name: "Одышка в покое",
    keywords: [
      "задыхаюсь", "не могу дышать", "не могу вдохнуть", "не могу выдохнуть",
      "не хватает воздуха", "нехватка воздуха", "одышка в покое", "удушье",
      "дышу через силу", "свист при дыхании",
    ],
    instruction:
      "Вызовите скорую помощь (103/112) немедленно! Одышка в покое — признак дыхательной недостаточности. Сядьте, обеспечьте доступ воздуха, не ложитесь.",
  },
  {
    name: "Признаки инсульта (FAST)",
    keywords: [
      "перекосило лицо", "перекосил рот", "асимметрия лица", "опустился угол рта",
      "не могу говорить", "невнятная речь", "нарушена речь", "не поднимается рука",
      "не могу поднять руку", "онемела рука", "онемела половина", "отнялась нога",
      "отнялась рука", "слабость в руке и ноге",
    ],
    instruction:
      "Вызовите скорую помощь (103/112) немедленно! Это могут быть признаки инсульта. Счёт идёт на минуты — запомните время появления симптомов.",
  },
  {
    name: "Травма головы с потерей сознания",
    keywords: [
      "ударился головой и потерял", "ударилась головой и потерял",
      "после удара головой потерял", "травма головы без сознания",
      "упал на голову и отключился",
    ],
    instruction:
      "Вызовите скорую помощь (103/112) немедленно! Травма головы с потерей сознания требует срочного осмотра. Не двигайте пострадавшего без необходимости.",
  },
  {
    name: "Потеря сознания",
    keywords: [
      "потерял сознание", "потеряла сознание", "терял сознание", "потере сознания",
      "без сознания", "не приходит в себя", "отключился", "вырубился", "обморок",
    ],
    instruction:
      "Вызовите скорую помощь (103/112) немедленно! Потеря сознания требует экстренной помощи. Уложите на бок, проверьте дыхание.",
  },
  {
    name: "Судороги",
    keywords: [
      "судороги", "судорог", "припадок", "конвульси", "бьется в приступе",
      "трясет и не реагирует",
    ],
    instruction:
      "Вызовите скорую помощь (103/112) немедленно! Уберите опасные предметы, подложите мягкое под голову, ничего не вкладывайте в рот.",
  },
  {
    name: "Кровотечение",
    keywords: [
      "кровь не останавливается", "сильное кровотечение", "обильное кровотечение",
      "много крови", "фонтан крови", "кровь хлещет", "рвота с кровью",
      "кровь в стуле черным", "черный стул",
    ],
    instruction:
      "Вызовите скорую помощь (103/112) немедленно! Наложите давящую повязку на рану и не снимайте её.",
  },
  {
    name: "Острая боль в животе",
    keywords: [
      "острый живот", "кинжальная боль", "резкая боль в животе",
      "острая боль в животе", "сильная боль в животе", "нестерпимая боль в животе",
      "невыносимая боль в животе", "нестерпимо болит живот",
      "живот твердый как доска", "доскообразный живот",
      "не могу разогнуться от боли", "скрутило живот",
    ],
    instruction:
      "Вызовите скорую помощь (103/112) немедленно! Острая боль в животе может требовать срочной операции. Не ешьте, не пейте, не принимайте обезболивающее и не прикладывайте тепло.",
  },
  {
    name: "Тяжёлая травма",
    keywords: [
      "оторвало", "ампутация", "открытый перелом", "раздавлен", "выпал из окна",
      "выпала из окна", "нож в ране", "проникающее ранение",
    ],
    instruction:
      "Вызовите скорую помощь (103/112) немедленно! При тяжёлых травмах счёт идёт на минуты. Не двигайте пострадавшего и не извлекайте предметы из раны.",
  },
  {
    name: "Высокая температура у ребёнка",
    tempThreshold: 39.5,
    requiresChild: true,
    keywords: [
      "у ребенка температура 39", "у ребенка температура 40", "у ребенка 39",
      "у ребенка 40", "ребенку 39", "ребенку 40", "температура 40", "температура 41",
    ],
    instruction:
      "Вызовите скорую помощь (103/112) немедленно! Температура выше 39.5 у ребёнка опасна. Разденьте ребёнка, поите водой, не укутывайте.",
  },
  {
    name: "Крайне высокая температура",
    tempThreshold: 41.0,
    keywords: [],
    instruction:
      "Вызовите скорую помощь (103/112) немедленно! Температура 41 и выше опасна для жизни. Разденьтесь, оботрите прохладной водой, не укутывайтесь.",
  },
];

const CHILD_WORDS = [
  "ребенок", "ребенка", "ребенку", "ребенком", "дети", "детей",
  "малыш", "груднич", "сын", "дочк", "дочер", "подросток",
];

// Без lookbehind — старые WebView его не поддерживают и уронят весь бандл
const TEMP_CONTEXT_RE = /(?:температур[а-я]*|жар|лихорадк[а-я]*)\D{0,12}(\d{2}(?:[.,]\d{1,2})?)/g;
const TEMP_BARE_RE = /(?:^|[^\dA-Za-zА-Яа-я])((?:3[6-9]|4[0-2])[.,]\d{1,2})(?!\d)/g;

function normalize(text: string): string {
  return (text ?? "").toLowerCase().replace(/ё/g, "е").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function maxTemperature(normalized: string): number | null {
  const values: number[] = [];
  let m: RegExpExecArray | null;

  TEMP_CONTEXT_RE.lastIndex = 0;
  while ((m = TEMP_CONTEXT_RE.exec(normalized)) !== null) {
    values.push(parseFloat(m[1].replace(",", ".")));
  }
  TEMP_BARE_RE.lastIndex = 0;
  while ((m = TEMP_BARE_RE.exec(normalized)) !== null) {
    values.push(parseFloat(m[1].replace(",", ".")));
  }
  return values.length ? Math.max(...values) : null;
}

const NO_ALERT: EmergencyAlert = { is_emergency: false, message: "", matched_rule: "" };

function localCheck(text: string, isChild: boolean): EmergencyAlert {
  const normalized = normalize(text);
  if (!normalized) return NO_ALERT;

  const childCtx = isChild || CHILD_WORDS.some((w) => normalized.includes(w));
  const temperature = maxTemperature(normalized);

  for (const rule of LOCAL_RED_FLAGS) {
    // 1 правило только для детей
    if (rule.requiresChild && !childCtx) continue;

    // 2 числовой порог важнее ключевых слов (порог включительный)
    if (rule.tempThreshold !== undefined && temperature !== null) {
      if (temperature >= rule.tempThreshold) {
        return { is_emergency: true, message: rule.instruction, matched_rule: rule.name };
      }
      continue;
    }

    // 3 обычный keyword-matching
    const hit = rule.keywords.find((kw) => normalized.includes(kw));
    if (hit) {
      return { is_emergency: true, message: rule.instruction, matched_rule: rule.name };
    }
  }
  return NO_ALERT;
}

// ── Публичные методы ────────────────────────────────────────────────────────

/**
 * Два независимых контура: сервер (авторитетный) + локальная копия YAML.
 * Срабатывание любого из них = красный экран. Лучше ложная тревога, чем пропуск.
 */
export async function checkRedFlags(
  text: string,
  isChild = false,
): Promise<EmergencyAlert> {
  if (!text.trim()) return NO_ALERT;

  const local = localCheck(text, isChild);

  try {
    const server = await apiRequest<EmergencyAlert>("/api/check-symptoms", {
      method: "POST",
      body: JSON.stringify({ text, is_child: isChild }),
    });
    if (server.is_emergency) return { ...server, source: "server" };
    if (local.is_emergency) return { ...local, source: "local" };
    return { ...NO_ALERT, source: "server" };
  } catch {
    // Fallback — локальная копия правил, работает без сети
    console.warn("[medved] check-symptoms недоступен, работаем на локальных правилах");
    return { ...local, source: "local" };
  }
}

/**
 * Фолбэка НЕТ намеренно: выдуманная карточка при отказе бэкенда —
 * это опасная медицинская рекомендация. Ошибку обязан обработать вызывающий код.
 */
export function submitTriage(payload: PatientCasePayload): Promise<TriageResult> {
  return apiRequest<TriageResult>("/api/triage", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Прогрев Amvera перед демо, чтобы не ловить холодный старт на сцене */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    await apiRequest<{ status: string }>("/api/health");
    return true;
  } catch {
    return false;
  }
}