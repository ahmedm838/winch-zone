import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Row = {
  user_id: string;
  email: string;
  profiles?: { role_id: number; roles?: { name: string }[] | null }[] | null;
};

export default function UsersRoles() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setMsg(null);
    const { data, error } = await supabase.from("user_directory").select("user_id,email, profiles(role_id, roles(name))");
    if (error) return setMsg(error.message);
    setRows((data ?? []) as unknown as Row[]);
  }

  async function setRole(user_id: string, role_id: number) {
    setBusy(true); setMsg(null);
    try {
      const { error } = await supabase.from("profiles").update({ role_id }).eq("user_id", user_id);
      if (error) throw error;
      setMsg("Role updated.");
      await load();
    } catch (e: any) {
      setMsg(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Users roles</div>
        <div className="text-xs text-slate-500">Admin only. Default signup role is user.</div>
      </div>

      {msg ? <div className="text-sm text-slate-700 dark:text-slate-200">{msg}</div> : null}

      <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr className="text-left">
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = r.profiles?.[0];
              const roleName = p?.roles?.[0]?.name ?? (p?.role_id === 1 ? "admin" : "user");
              return (
                <tr key={r.user_id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{roleName}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button disabled={busy} onClick={() => setRole(r.user_id, 2)}
                        className="rounded-xl px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white dark:bg-slate-900">
                        Set User
                      </button>
                      <button disabled={busy} onClick={() => setRole(r.user_id, 1)}
                        className="rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:opacity-90 disabled:opacity-60">
                        Set Admin
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length ? <tr><td className="p-4 text-slate-500" colSpan={3}>No users found.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
