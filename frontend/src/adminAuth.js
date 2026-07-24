import { API_BASE } from "./apiBase";

const SESSION_KEY = "rakshak_admin_session";

export function getAdminSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAdminSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function parseOrThrow(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || "Something went wrong");
  }
  return body;
}

export async function adminLogin({ email, password }) {
  const response = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseOrThrow(response);
}

export async function adminLogout(token) {
  if (!token) return;
  try {
    await fetch(`${API_BASE}/admin/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // best-effort — the local session is cleared regardless
  }
}

export async function fetchUsers(token) {
  const response = await fetch(`${API_BASE}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseOrThrow(response);
}

export async function fetchDevices(token) {
  const response = await fetch(`${API_BASE}/devices`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseOrThrow(response);
}

export async function createDevice(token, device) {
  const response = await fetch(`${API_BASE}/devices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(device),
  });
  return parseOrThrow(response);
}
