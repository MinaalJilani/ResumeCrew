import { supabase } from "./supabase";

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
  localStorage.removeItem("full_name");
}

/** ── OAuth Helpers ────────────────────────────────────────────────────────── */

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/login'
    }
  });
  if (error) throw error;
}

export async function signInWithGithub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: window.location.origin + '/login'
    }
  });
  if (error) throw error;
}

/** 
 * Synchronize Supabase session to our legacy localStorage keys 
 * if a session exists (e.g. after OAuth redirect)
 */
export async function syncSupabaseSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user) {
    login(
      session.access_token, 
      session.user.id, 
      session.user.email || ""
    );
    if (session.user.user_metadata?.full_name) {
      localStorage.setItem("full_name", session.user.user_metadata.full_name);
    }
    return true;
  }
  return false;
}
