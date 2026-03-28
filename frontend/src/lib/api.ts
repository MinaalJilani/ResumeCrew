/**
 * All API fetch calls in one place.
 * Every function handles auth headers automatically.
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res: Response) {
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    if (res.status === 401) {
      // Token expired or invalid — clear local state and force re-login
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("email");
      window.location.href = "/login";
    }
    throw new Error(data.detail || data.error || `HTTP ${res.status}`);
  }
  return data;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function apiRegister(email: string, password: string, fullName: string = "") {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  return handleResponse(res);
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

// ── Documents ────────────────────────────────────────────────────────────────

export async function apiUploadDocument(file: File, docType: string = "cv") {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("doc_type", docType);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  return handleResponse(res);
}

export async function apiGetDocuments() {
  const res = await fetch(`${API_BASE}/documents`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function apiDeleteDocument(docId: string) {
  const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(docId)}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export async function apiChat(message: string, sessionId: string = "main") {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  return res; // Return raw response for streaming
}

// ── Results ──────────────────────────────────────────────────────────────────

export async function apiGetResults(jobId: string) {
  const res = await fetch(`${API_BASE}/results/${jobId}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ── Health ───────────────────────────────────────────────────────────────────

export async function apiHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}

export async function apiGenerateChatTitle(message: string) {
  const res = await fetch(`${API_BASE}/chat/title`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ message }),
  });
  return handleResponse(res);
}

export { API_BASE };
