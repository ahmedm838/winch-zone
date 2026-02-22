import { supabase } from "./supabase";

const KEY = "wz_session_start_ms";
export const SESSION_MAX_MS = 30 * 60 * 1000; // 30 minutes

export function markSessionStart(nowMs: number = Date.now()) {
  localStorage.setItem(KEY, String(nowMs));
}

export function clearSessionStart() {
  localStorage.removeItem(KEY);
}

export function getSessionStart(): number | null {
  const v = localStorage.getItem(KEY);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function isSessionExpired(nowMs: number = Date.now()): boolean {
  const start = getSessionStart();
  if (!start) return false;
  return nowMs - start >= SESSION_MAX_MS;
}

export async function forceSignOut() {
  // Best-effort sign out; ignore errors.
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  } finally {
    clearSessionStart();
  }
}
