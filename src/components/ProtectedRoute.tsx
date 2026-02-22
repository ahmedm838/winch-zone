import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { SESSION_MAX_MS, getSessionStart, markSessionStart, isSessionExpired, forceSignOut, clearSessionStart } from "../lib/sessionTimeout";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const hasSession = !!data.session;
      setAuthed(hasSession);
      if (hasSession) {
        if (isSessionExpired()) {
          await forceSignOut();
          setAuthed(false);
        } else {
          // if missing, stamp start (e.g. first time after refresh)
          if (!getSessionStart()) markSessionStart();
        }
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const hasSession = !!session;
      setAuthed(hasSession);
      if (hasSession) {
        if (!getSessionStart()) markSessionStart();
      } else {
        // Signed out
        clearSessionStart();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authed) return;

    const start = getSessionStart() ?? Date.now();
    // Ensure we have a start timestamp persisted
    if (!getSessionStart()) markSessionStart(start);

    const elapsed = Date.now() - start;
    const remaining = Math.max(0, SESSION_MAX_MS - elapsed);

    // If already expired, sign out immediately.
    if (remaining <= 0 || isSessionExpired()) {
      forceSignOut();
      return;
    }

    const t = window.setTimeout(() => {
      forceSignOut();
    }, remaining);

    // Safety: if the machine sleeps, re-check periodically.
    const iv = window.setInterval(() => {
      if (isSessionExpired()) forceSignOut();
    }, 30 * 1000);

    return () => {
      window.clearTimeout(t);
      window.clearInterval(iv);
    };
  }, [authed]);


  if (loading) return <div className="p-6 text-slate-600 dark:text-slate-300">Loading...</div>;
  if (!authed) return <Navigate to="/" replace />;
  return <>{children}</>;
}
