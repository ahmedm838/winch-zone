import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";



function readRecoveryParams() {
  // Tokens may arrive in hash query (after normalizeSupabaseHash) like:
  // #/reset?access_token=...&refresh_token=...&type=recovery
  // Or without normalization like:
  // #/reset#access_token=...&refresh_token=...&type=recovery
  const h = window.location.hash || "";
  let paramStr = "";
  const qIdx = h.indexOf("?");
  if (qIdx !== -1) {
    paramStr = h.slice(qIdx + 1);
  } else {
    const tokIdx = h.indexOf("access_token=");
    if (tokIdx !== -1) paramStr = h.slice(tokIdx);
  }
  const params = new URLSearchParams(paramStr);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const type = params.get("type");
  const code = params.get("code");
  return { access_token, refresh_token, type, code };
}

export default function ResetPassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);


useEffect(() => {
  (async () => {
    try {
      const { access_token, refresh_token, code } = readRecoveryParams();

      // If supabase uses PKCE/code flow in your project, support it too.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        setSessionReady(true);
        return;
      }

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) throw error;
        setSessionReady(true);
        return;
      }

      // If user already has a session, allow update.
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setSessionReady(true);
        return;
      }

      setMsg("Auth session missing. Please open the password reset link from your email again.");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to initialize password reset session.");
    }
  })();
}, []);


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionReady) { setMsg("Auth session missing. Please open the password reset link from your email."); return; }
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setMsg("Password updated. Please login.");
      setTimeout(() => nav("/"), 800);
    } catch (err: any) {
      setMsg(err?.message ?? "Failed to update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-950">
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Reset password</div>
        <div className="text-xs text-slate-500 mb-6">Enter a new password. This page must be opened from the reset link sent to your email.</div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-700 dark:text-slate-200">New password</label>
            <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" required minLength={6}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100" />
          </div>
          {msg ? <div className="text-sm text-slate-700 dark:text-slate-200">{msg}</div> : null}
          <button disabled={busy || !sessionReady} className="w-full rounded-xl px-3 py-2 text-sm bg-slate-900 text-slate-900 dark:text-white hover:opacity-90 disabled:opacity-60">
            {busy ? "Please wait..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
