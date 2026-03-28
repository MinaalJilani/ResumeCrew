/**
 * Auth helpers for managing JWT tokens and user session in localStorage.
 */

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function getEmail(): string | null {
  return localStorage.getItem("email");
}

export function getUserId(): string | null {
  return localStorage.getItem("user_id");
}

export function login(token: string, userId: string, email: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("user_id", userId);
  localStorage.setItem("email", email);
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("email");
  // Optional: clear other user-specific data
  localStorage.removeItem("full_name");
}
