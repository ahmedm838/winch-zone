
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { toggleTheme, getTheme } from "../lib/theme";
import { isSessionExpired, forceSignOut, markSessionStart } from "../lib/sessionTimeout";

type Mode = "login" | "signup" | "forgot";

export default function Landing() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uiTheme, setUiTheme] = useState<"dark" | "light">(getTheme());

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        // Enforce max session age (30 mins)
        if (isSessionExpired()) {
          await forceSignOut();
          return;
        }
        // If we have a session but no start timestamp (e.g. refreshed tab), start it now.
        // Do not reset an existing start time (keeps max session age enforced).
        if (!localStorage.getItem("wz_session_start_ms")) markSessionStart();
        nav("/dashboard");
      }
    });
  }, [nav]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
let loginEmail = email.trim();
if (!loginEmail.includes("@")) {
  const u = loginEmail.trim();
  const { data, error: rpcErr } = await supabase.rpc("email_for_username", { p_username: u.toLowerCase() });
  if (rpcErr) throw rpcErr;
  if (!data) throw new Error("Username not found");
  loginEmail = String(data);
}
const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) throw error;
      markSessionStart();
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
const uname = username.trim().toLowerCase();
if (!uname) throw new Error("Username is required");
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: redirectTo,
    data: { username: uname },
  },
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
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} className="h-12 w-auto" alt="Winch Zone" />
            <div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Winch Zone</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Login / Sign up</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { toggleTheme(); setUiTheme(getTheme()); }}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
            title={uiTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {uiTheme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode("login")} className={"flex-1 rounded-xl px-3 py-2 text-sm border text-slate-900 dark:text-slate-100 " + (mode==="login" ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900")}>Login</button>
          <button onClick={() => setMode("signup")} className={"flex-1 rounded-xl px-3 py-2 text-sm border text-slate-900 dark:text-slate-100 " + (mode==="signup" ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900")}>Sign up</button>
          <button onClick={() => setMode("forgot")} className={"flex-1 rounded-xl px-3 py-2 text-sm border text-slate-900 dark:text-slate-100 " + (mode==="forgot" ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900")}>Forgot</button>
        </div>

        <form onSubmit={mode==="login" ? onLogin : mode==="signup" ? onSignup : onForgot} className="space-y-4">
          <div>
  <label className="text-sm text-slate-700 dark:text-slate-200">
    {mode === "login" ? "Username or Email" : "Email"}
  </label>
  <input
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    type={mode === "login" ? "text" : "email"}
    required
    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100"
  />
  {mode === "login" ? (
    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">You can login using your username or email.</div>
  ) : null}
</div>

          {mode === "signup" ? (
  <div>
    <label className="text-sm text-slate-700 dark:text-slate-200">Username</label>
    <input
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      type="text"
      required
      className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100"
    />
    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Lowercase recommended. Must be unique.</div>
  </div>
) : null}

{mode !== "forgot" ? (
            <div>
              <label className="text-sm text-slate-700 dark:text-slate-200">Password</label>
              <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required minLength={6}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100" />
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Min 6 characters.</div>
            </div>
          ) : null}

          {msg ? <div className="text-sm text-slate-700 dark:text-slate-200">{msg}</div> : null}

          <button disabled={busy} className="w-full rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:opacity-90 disabled:opacity-60">
            {busy ? "Please wait..." : mode==="login" ? "Login" : mode==="signup" ? "Create account" : "Send reset email"}
          </button>
        </form>

        <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          Signup requires email verification (Supabase Auth Confirm Email). Default role is <b>user</b>.
        </div>
      </div>
    </div>
  );
}
