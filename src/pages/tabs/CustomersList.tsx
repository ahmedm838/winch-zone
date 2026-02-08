import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Customer, fetchCustomers } from "./_shared";

export default function CustomersList() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(s));
  }, [q, rows]);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setMsg(null);
    try { setRows(await fetchCustomers()); }
    catch (e: any) { setMsg(e?.message ?? "Failed to load"); }
  }

  async function saveRow(id: string, patch: Partial<Customer>) {
    setMsg(null);
    try {
      const { error } = await supabase.from("customers").update(patch).eq("id", id);
      if (error) throw error;
      setMsg("Saved.");
      await refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to save");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Edit / Show customer details</div>
        <div className="text-xs text-slate-500">Admin only.</div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer..."
          className="w-full md:max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2" />
        <button onClick={refresh} className="rounded-xl px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
          Refresh
        </button>
      </div>

      {msg ? <div className="text-sm text-slate-700 dark:text-slate-200">{msg}</div> : null}

      <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr className="text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Telephone</th>
              <th className="p-3">Email</th>
              <th className="p-3">Commercial Register</th>
              <th className="p-3">Tax ID</th>
              <th className="p-3">CR Copy</th>
              <th className="p-3">Tax Copy</th>
              <th className="p-3">Price list</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (<Row key={r.id} row={r} onSave={saveRow} />))}
            {!filtered.length ? (
              <tr><td className="p-4 text-slate-500" colSpan={9}>No customers</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ row, onSave }: { row: Customer; onSave: (id: string, patch: Partial<Customer>) => void }) {
  const [name, setName] = useState(row.name);
  const [contact, setContact] = useState(row.contact_name ?? "");
  const [tel, setTel] = useState(row.telephone ?? "");
  const [email, setEmail] = useState(row.email ?? "");
  const [cr, setCr] = useState(row.commercial_register_no ?? "");
  const [tax, setTax] = useState(row.tax_id_no ?? "");
  const validCr = !cr || /^[0-9]{1,6}$/.test(cr);
  const validTax = !tax || /^[0-9]{3}-[0-9]{3}-[0-9]{3}$/.test(tax);
  const validEmail = !email || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
  const validTel = !tel || (tel.length >= 7 && tel.length <= 20);

  return (
    <tr className="border-t border-slate-200 dark:border-slate-800">
      <td className="p-3"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1" /></td>
      <td className="p-3"><input value={contact} onChange={(e) => setContact(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1" /></td>
      <td className="p-3"><input value={tel} onChange={(e) => setTel(e.target.value)} className={"w-full rounded-xl border px-2 py-1 bg-white dark:bg-slate-950 " + (validTel ? "border-slate-200 dark:border-slate-800" : "border-red-500")} /></td>
      <td className="p-3"><input value={email} onChange={(e) => setEmail(e.target.value)} className={"w-full rounded-xl border px-2 py-1 bg-white dark:bg-slate-950 " + (validEmail ? "border-slate-200 dark:border-slate-800" : "border-red-500")} /></td>
      <td className="p-3"><input value={cr} onChange={(e) => setCr(e.target.value)} className={"w-full rounded-xl border px-2 py-1 bg-white dark:bg-slate-950 " + (validCr ? "border-slate-200 dark:border-slate-800" : "border-red-500")} /></td>
      <td className="p-3"><input value={tax} onChange={(e) => setTax(e.target.value)} className={"w-full rounded-xl border px-2 py-1 bg-white dark:bg-slate-950 " + (validTax ? "border-slate-200 dark:border-slate-800" : "border-red-500")} /></td>
      <td className="p-3">{row.commercial_register_copy_url ? <a className="text-blue-600 dark:text-blue-400 underline" href={row.commercial_register_copy_url} target="_blank" rel="noreferrer">Open</a> : <span className="text-slate-500">—</span>}</td>
      <td className="p-3">{row.tax_id_copy_url ? <a className="text-blue-600 dark:text-blue-400 underline" href={row.tax_id_copy_url} target="_blank" rel="noreferrer">Open</a> : <span className="text-slate-500">—</span>}</td>
      <td className="p-3">{row.price_list_copy_url ? <a className="text-blue-600 dark:text-blue-400 underline" href={row.price_list_copy_url} target="_blank" rel="noreferrer">Open</a> : <span className="text-slate-500">—</span>}</td>
      <td className="p-3">
        <button className="rounded-xl px-3 py-2 text-xs bg-slate-900 text-slate-900 dark:text-white hover:opacity-90 disabled:opacity-60"
          disabled={!validCr || !validTax || !validEmail || !validTel}
          onClick={() => onSave(row.id, { name: name.trim() || row.name, contact_name: contact || null, telephone: tel || null, email: email || null, commercial_register_no: cr || null, tax_id_no: tax || null })}
        >
          Save
        </button>
      </td>
    </tr>
  );
}
