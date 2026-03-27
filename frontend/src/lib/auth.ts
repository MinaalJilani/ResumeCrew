/**
 * Client-side auth helpers — token storage and checks.
 */

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getUserId(): string | null {
  return localStorage.getItem("user_id");
}

export function getEmail(): string | null {
  return localStorage.getItem("email");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("email");
  window.location.href = "/";
}

export function saveAuth(token: string, userId: string, email: string): void {
  localStorage.setItem("token", token);
  localStorage.setItem("user_id", userId);
  localStorage.setItem("email", email);
}
