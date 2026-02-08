
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

type Mode = "login" | "signup" | "forgot";

export default function Landing() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav("/dashboard");
    });
  }, [nav]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      nav("/dashboard");
    } catch (err: any) {
      setMsg(err?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const redirectTo = window.location.origin + window.location.pathname + "#/";
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMsg("Signup created. Check your email for verification code/link, then login.");
      setMode("login");
    } catch (err: any) {
      setMsg(err?.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  async function onForgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const redirectTo = window.location.origin + window.location.pathname + "#/reset";
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setMsg("Password reset email sent. Please check your inbox.");
      setMode("login");
    } catch (err: any) {
      setMsg(err?.message ?? "Failed to send reset email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-950">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} className="h-12 w-auto" alt="Winch Zone" />
          <div>
            <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Winch Zone</div>
            <div className="text-xs text-slate-500">Login / Sign up</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode("login")} className={"flex-1 rounded-xl px-3 py-2 text-sm border " + (mode==="login" ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800" : "border-slate-200 dark:border-slate-800")}>Login</button>
          <button onClick={() => setMode("signup")} className={"flex-1 rounded-xl px-3 py-2 text-sm border " + (mode==="signup" ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800" : "border-slate-200 dark:border-slate-800")}>Sign up</button>
          <button onClick={() => setMode("forgot")} className={"flex-1 rounded-xl px-3 py-2 text-sm border " + (mode==="forgot" ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800" : "border-slate-200 dark:border-slate-800")}>Forgot</button>
        </div>

        <form onSubmit={mode==="login" ? onLogin : mode==="signup" ? onSignup : onForgot} className="space-y-4">
          <div>
            <label className="text-sm text-slate-700 dark:text-slate-200">Email</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100" />
          </div>

          {mode !== "forgot" ? (
            <div>
              <label className="text-sm text-slate-700 dark:text-slate-200">Password</label>
              <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required minLength={6}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100" />
              <div className="text-xs text-slate-500 mt-1">Min 6 characters.</div>
            </div>
          ) : null}

          {msg ? <div className="text-sm text-slate-700 dark:text-slate-200">{msg}</div> : null}

          <button disabled={busy} className="w-full rounded-xl px-3 py-2 text-sm bg-slate-900 text-slate-900 dark:text-white hover:opacity-90 disabled:opacity-60">
            {busy ? "Please wait..." : mode==="login" ? "Login" : mode==="signup" ? "Create account" : "Send reset email"}
          </button>
        </form>

        <div className="mt-6 text-xs text-slate-500">
          Signup requires email verification (Supabase Auth Confirm Email). Default role is <b>user</b>.
        </div>
      </div>
    </div>
  );
}
