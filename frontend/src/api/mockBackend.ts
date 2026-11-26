import type {
  PatientCasePayload,
  TriageResult,
  EmergencyAlert,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://medved-hacaton-coffeecat.msk1.amvera.tech";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function apiRequest(path: string, options?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Нет связи с бэкендом");
  }
  if (!res.ok) {
    let code = `HTTP_${res.status}`;
    try {
      const body = await res.json();
      const m = String(body.detail || "").match(/^AUTH_[A-Z_]+/);
      if (m) code = m[0];
    } catch {
      /* тело не JSON */
    }
    throw new ApiError(res.status, code, `API error ${res.status}`);
  }
  return await res.json();
}

export async function fetchUserProfile() {
  const token = new URLSearchParams(window.location.search).get("token");
  if (!token) {
    throw new ApiError(0, "NO_TOKEN_IN_URL", "MAX не передал токен в URL");
  }
  return await apiRequest("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function checkRedFlags(
  text: string,
  isChild = false,
): Promise<EmergencyAlert> {
  if (!text.trim()) {
    return { is_emergency: false, message: "", matched_rule: "" };
  }
  return await apiRequest("/api/check-symptoms", {
    method: "POST",
    body: JSON.stringify({ text, is_child: isChild }),
  });
}

export async function submitTriage(
  payload: PatientCasePayload,
): Promise<TriageResult> {
  return await apiRequest("/api/triage", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}