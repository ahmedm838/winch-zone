import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { fmtDate, fmtMoney } from "../../lib/format";

function relName(rel: any): string {
  if (!rel) return "—";
  if (Array.isArray(rel)) return rel?.[0]?.name ?? "—";
  return rel?.name ?? "—";
}

type Row = {
  id: number;
  trip_no?: string | null;
  trip_date: string;
  pickup_location: string;
  dropoff_location: string;
  price_per_trip: number;
  status: "pending" | "approved";
  customers?: { name: string }[] | null;
  services?: { name: string }[] | null;
  vehicles?: { name: string }[] | null;
  payments?: { name: string }[] | null;
  collection?: { name: string }[] | null;
};

export default function PendingTrips() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setMsg(null);
    const { data, error } = await supabase
      .from("trips")
      .select("id,trip_no,trip_date,pickup_location,dropoff_location,price_per_trip,status, customers(name), services(name), vehicles(name), payments(name)")
      .eq("status", "pending")
      .order("id", { ascending: false });
    if (error) return setMsg(error.message);
    setRows((data ?? []) as unknown as Row[]);
  }

  async function approve(id: number) {
    setBusy(true); setMsg(null);
    try {
      const { error } = await supabase.from("trips").update({ status: "approved" }).eq("id", id);
      if (error) throw error;
      setMsg(`Trip #${id} approved.`);
      await load();
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to approve");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Pending trips</div>
        <div className="text-xs text-slate-500">Admin approves pending.</div>
      </div>

      {msg ? <div className="text-sm text-slate-700 dark:text-slate-200">{msg}</div> : null}

      <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <tr className="text-left">
              <th className="p-3">Trip No.</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Service</th>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Locations</th>
              <th className="p-3">Price</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Collection</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.trip_no ?? r.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="p-3">{r.trip_no ?? r.id}</td>
                <td className="p-3">{fmtDate(r.trip_date)}</td>
                <td className="p-3">{relName(r.customers)}</td>
                <td className="p-3">{relName(r.services)}</td>
                <td className="p-3">{relName(r.vehicles)}</td>
                <td className="p-3">
                  <div className="text-xs">PU: {r.pickup_location}</div>
                  <div className="text-xs">DO: {r.dropoff_location}</div>
                </td>
                <td className="p-3">{fmtMoney(r.price_per_trip)}</td>
                <td className="p-3">{relName(r.payments)}
                </td>
                <td className="p-3">{relName(r.collection)}</td>
                <td className="p-3"></td>
                <td className="p-3">
                  <button disabled={busy} onClick={() => approve(r.id)}
                    className="rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:opacity-90 disabled:opacity-60">
                    Approve
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length ? <tr><td className="p-4 text-slate-500" colSpan={9}>No pending trips.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
