import type {
  PatientCasePayload,
  TriageResult,
  EmergencyAlert,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://medved-hacaton-coffeecat.msk1.amvera.tech";

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

  if (token) {
    return await apiRequest("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  return await apiRequest("/api/auth/me");
}

export async function checkRedFlags(text: string, isChild = false): Promise<EmergencyAlert> {
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