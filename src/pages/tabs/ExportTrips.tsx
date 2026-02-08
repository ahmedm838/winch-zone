import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import { fetchCustomers, Customer } from "./_shared";
import { fmtDate, fmtMoney } from "../../lib/format";

function relText(rel: any): string {
  const n = relName(rel);
  return n === "—" ? "" : n;
}

function relName(rel: any): string {
  if (!rel) return "—";
  if (Array.isArray(rel)) return rel?.[0]?.name ?? "—";
  return rel?.name ?? "—";
}

type Row = {
  id: number;
  trip_date: string;
  pickup_location: string;
  dropoff_location: string;
  price_per_trip: number;
  status: string;
  customers?: { name: string }[] | { name: string } | null;
  services?: { name: string }[] | { name: string } | null;
  vehicles?: { name: string }[] | { name: string } | null;
  payments?: { name: string }[] | { name: string } | null;
  collection?: { name: string }[] | { name: string } | null;
};

export default function ExportTrips() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { fetchCustomers().then(setCustomers).catch((e)=>setMsg(e?.message ?? "Failed")); }, []);

  async function load() {
    setMsg(null);
    try {
      let q = supabase.from("trips")
        .select("id,trip_date,pickup_location,dropoff_location,price_per_trip,status, customers(name), services(name), vehicles(name), payments(name),collection(name)")
        .order("id", { ascending: false });

      if (customerId) q = q.eq("customer_id", customerId);
      if (from) q = q.gte("trip_date", from);
      if (to) q = q.lte("trip_date", to);

      const { data, error } = await q;
      if (error) throw error;
      setRows((data ?? []) as unknown as Row[]);
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to load");
    }
  }

  const exportable = useMemo(
  () =>
    rows.map((r) => ({
      TripID: r.id,
      Date: fmtDate(r.trip_date),
      Customer: relText(r.customers),
      ContactPickup: r.pickup_location ?? "",
      ContactDropoff: r.dropoff_location ?? "",
      Service: relText(r.services),
      Vehicle: relText(r.vehicles),
      Pickup: r.pickup_location ?? "",
      Dropoff: r.dropoff_location ?? "",
PriceFormatted: fmtMoney(r.price_per_trip ?? 0),
      Payment: relText(r.payments),
      Collection: relText(r.collection),
      Status: r.status ?? "",
    })),
  [rows]
);


  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(exportable);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trips");
    XLSX.writeFile(wb, "trips.xlsx");
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Export trips</div>
        <div className="text-xs text-slate-500">If no customer/date range selected → exports all trips.</div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">Customer (optional)</label>
          <select value={customerId} onChange={(e)=>setCustomerId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2">
            <option value="">All</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">From</label>
          <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">To</label>
          <input type="date" value={to} onChange={(e)=>setTo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2" />
        </div>
        <div className="flex items-end gap-2">
          <button onClick={load} className="rounded-xl px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white dark:bg-slate-900">Load</button>
          <button onClick={exportExcel} disabled={!rows.length} className="rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:opacity-90 disabled:opacity-60">Export Excel</button>
        </div>
      </div>

      {msg ? <div className="text-sm text-slate-700 dark:text-slate-200">{msg}</div> : null}

      <div className="overflow-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr className="text-left">
              <th className="p-3">Trip</th><th className="p-3">Customer</th><th className="p-3">Service</th><th className="p-3">Vehicle</th>
              <th className="p-3">Price</th><th className="p-3">Payment</th>
              <th className="p-3">Collection</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="p-3">#{r.id} — {fmtDate(r.trip_date)}</td>
                <td className="p-3">{relName(r.customers)}</td>
                <td className="p-3">{relName(r.services)}</td>
                <td className="p-3">{relName(r.vehicles)}</td>
                <td className="p-3">{fmtMoney(r.price_per_trip)}</td>
                <td className="p-3">{relName(r.payments)}</td>
                <td className="p-3">{relName(r.collection)}</td>
                <td className="p-3">{r.status}</td>
              </tr>
            ))}
            {!rows.length ? <tr><td className="p-4 text-slate-500" colSpan={8}>No data loaded.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
