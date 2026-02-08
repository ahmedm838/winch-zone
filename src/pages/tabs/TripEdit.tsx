import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { UploadBox } from "../../components/UploadBox";
import { uploadToBucket } from "./_shared";
import { fetchCustomers, fetchMasters, Customer, SimpleRow } from "./_shared";
import { fmtDate, fmtMoney } from "../../lib/format";
import { getMyRole } from "../../lib/auth";

type TripRow = {
  id: number;
  trip_date: string;
  status: "pending" | "approved";
  customer_id: string;
  service_id: number;
  vehicle_id: number;
  pickup_location: string;
  dropoff_location: string;
  price_per_trip: number;
  payment_id: number;
  collection_id: number | null;
  pickup_photos?: string[];
  dropoff_photos?: string[];
};

export default function TripEdit() {
  const [masters, setMasters] = useState<{ services: SimpleRow[]; vehicles: SimpleRow[]; payments: SimpleRow[] } | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [row, setRow] = useState<TripRow | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [newPickup, setNewPickup] = useState<File[]>([]);
  const [newDropoff, setNewDropoff] = useState<File[]>([]);

useEffect(() => {
  getMyRole().then((r) => setIsAdmin(r === "admin")).catch(() => setIsAdmin(false));
  supabase.from("collection").select("id,name").order("id").then(({ data }) => setCollections((data ?? []) as any)).catch(() => {});
  Promise.all([fetchMasters(), fetchCustomers()]).then(([m, c]) => {

      setMasters(m); setCustomers(c);
    }).catch((e) => setMsg(e?.message ?? "Failed to load"));
    refreshTrips();
  }, []);

  async function refreshTrips() {
    setMsg(null);
    const { data, error } = await supabase
      .from("trips")
      .select("id,trip_date,status,customer_id,service_id,vehicle_id,pickup_location,dropoff_location,price_per_trip,payment_id,collection_id,pickup_photos,dropoff_photos")
      .order("id", { ascending: false })
      .limit(200);
    if (error) return setMsg(error.message);
    setTrips((data ?? []) as TripRow[]);
  }

  useEffect(() => {
    const r = trips.find((t) => t.id === selectedId) ?? null;
    setRow(r);
  }, [selectedId, trips]);

    const canEditCollection = isAdmin;
  const canEdit = row?.status === "pending";

  async function save() {
    if (!row) return;
    setBusy(true); setMsg(null);
    try {
      const { error } = await supabase.from("trips").update({
        trip_date: row.trip_date,
        customer_id: row.customer_id,
        service_id: row.service_id,
        vehicle_id: row.vehicle_id,
        pickup_location: row.pickup_location,
        dropoff_location: row.dropoff_location,
        price_per_trip: row.price_per_trip,
        payment_id: row.payment_id,
      }).eq("id", row.id);
      if (error) throw error;
      setMsg("Saved.");
      await refreshTrips();
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Edit trip</div>
        <div className="text-xs text-slate-500">Editing is blocked after approval.</div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <select value={selectedId} onChange={(e)=>setSelectedId(e.target.value ? Number(e.target.value) : "")}
          className="w-full md:max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2">
          <option value="">Select trip...</option>
          {trips.map(t => <option key={t.id} value={t.id}>#{t.id} — {fmtDate(t.trip_date)} — {t.status.toUpperCase()}</option>)}
        </select>
        <button onClick={refreshTrips} className="rounded-xl px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">Refresh</button>
      </div>

      {msg ? <div className="text-sm text-slate-700 dark:text-slate-200">{msg}</div> : null}

      {!row ? <div className="text-sm text-slate-500">Select a trip.</div> : (
        <div className="space-y-4">
          <div className="text-sm text-slate-700 dark:text-slate-200">
            Status: <b>{row.status.toUpperCase()}</b> — Price: <b>{fmtMoney(row.price_per_trip)}</b>
          </div>

          {!canEdit ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
              Approved trip: editing disabled.
            </div>
          ) : null}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-700 dark:text-slate-200">Date</label>
              <input type="date" value={row.trip_date} disabled={!canEdit}
                onChange={(e)=>setRow({ ...row, trip_date: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 disabled:opacity-60" />
            </div>

            <div>
              <label className="text-sm text-slate-700 dark:text-slate-200">Customer</label>
              <select value={row.customer_id} disabled={!canEdit}
                onChange={(e)=>setRow({ ...row, customer_id: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 disabled:opacity-60">
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-700 dark:text-slate-200">Service</label>
              <select value={row.service_id} disabled={!canEdit}
                onChange={(e)=>setRow({ ...row, service_id: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 disabled:opacity-60">
                {masters?.services?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-700 dark:text-slate-200">Vehicle</label>
              <select value={row.vehicle_id} disabled={!canEdit}
                onChange={(e)=>setRow({ ...row, vehicle_id: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 disabled:opacity-60">
                {masters?.vehicles?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-700 dark:text-slate-200">Pick up location</label>
              <input value={row.pickup_location} disabled={!canEdit}
                onChange={(e)=>setRow({ ...row, pickup_location: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 disabled:opacity-60" />
            </div>

            <div>
              <label className="text-sm text-slate-700 dark:text-slate-200">Drop off location</label>
              <input value={row.dropoff_location} disabled={!canEdit}
                onChange={(e)=>setRow({ ...row, dropoff_location: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 disabled:opacity-60" />
            </div>

            <div>
              <label className="text-sm text-slate-700 dark:text-slate-200">Price per trip</label>
              <input type="number" min={100} max={99999} value={row.price_per_trip} disabled={!canEdit}
                onChange={(e)=>setRow({ ...row, price_per_trip: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 disabled:opacity-60" />
            </div>

            <div>
              <label className="text-sm text-slate-700 dark:text-slate-200">Payment</label>
              <select value={row.payment_id} disabled={!canEdit}
                onChange={(e)=>setRow({ ...row, payment_id: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 disabled:opacity-60">
                {masters?.payments?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
<div>
  <label className="text-sm text-slate-700 dark:text-slate-200">Collection status</label>
  <select
    value={collectionId ?? ""}
    onChange={(e) => setCollectionId(e.target.value ? Number(e.target.value) : null)}
    disabled={!canEditCollection || busy}
    className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 disabled:opacity-60"
  >
    <option value="">—</option>
    {collections.map((c: CollectionRow) => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))}
  </select>
  <div className="mt-1 text-xs text-slate-500">
    Admin only. Can be updated even after approval.
  </div>
</div>

          </div>

<div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Trip photos (optional)</div>
  <div className="text-xs text-slate-500 mb-4">You can upload/replace photos later while the trip is Pending. After approval, uploading is disabled.</div>

  <div className="grid md:grid-cols-2 gap-6">
    <div className="space-y-3">
      <UploadBox label="Upload pick up photos (exactly 4)" accept="image/*" maxFiles={4} onFiles={setNewPickup} />
      <div className="text-xs text-slate-500">Current: {(row.pickup_photos?.length ?? 0)} file(s)</div>
      <div className="flex flex-wrap gap-2">
        {(row.pickup_photos ?? []).map((u, i) => (
          <a key={i} href={u} target="_blank" rel="noreferrer" className="text-xs underline text-blue-600 dark:text-blue-400">
            Pickup {i + 1}
          </a>
        ))}
      </div>
    </div>

    <div className="space-y-3">
      <UploadBox label="Upload drop off photos (exactly 4)" accept="image/*" maxFiles={4} onFiles={setNewDropoff} />
      <div className="text-xs text-slate-500">Current: {(row.dropoff_photos?.length ?? 0)} file(s)</div>
      <div className="flex flex-wrap gap-2">
        {(row.dropoff_photos ?? []).map((u, i) => (
          <a key={i} href={u} target="_blank" rel="noreferrer" className="text-xs underline text-blue-600 dark:text-blue-400">
            Dropoff {i + 1}
          </a>
        ))}
      </div>
    </div>
  </div>

  <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
    <button
      disabled={!canEdit || busy || (newPickup.length !== 0 && newPickup.length !== 4) || (newDropoff.length !== 0 && newDropoff.length !== 4)}
      onClick={async () => {
        if (!row) return;
        setBusy(true);
        setMsg(null);
        try {
          const pu: string[] = [];
          const dof: string[] = [];

          if (newPickup.length) {
            for (let i = 0; i < newPickup.length; i++) {
              pu.push(await uploadToBucket("trip_photos", `${row.id}/pickup_${i + 1}_${newPickup[i].name}`, newPickup[i]));
            }
          }
          if (newDropoff.length) {
            for (let i = 0; i < newDropoff.length; i++) {
              dof.push(await uploadToBucket("trip_photos", `${row.id}/dropoff_${i + 1}_${newDropoff[i].name}`, newDropoff[i]));
            }
          }

          const patch: any = {};
          if (pu.length) patch.pickup_photos = pu;
          if (dof.length) patch.dropoff_photos = dof;

          if (!Object.keys(patch).length) {
            setMsg("No photos selected.");
            return;
          }

          const { error } = await supabase.from("trips").update(patch).eq("id", row.id);
          if (error) throw error;

          setMsg("Photos uploaded.");
          setNewPickup([]);
          setNewDropoff([]);
          await refreshTrips();
        } catch (e: any) {
          setMsg(e?.message ?? "Failed to upload photos");
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-xl px-4 py-2 text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-60"
    >
      Upload photos
    </button>
    <div className="text-xs text-slate-500">If uploading, choose exactly 4 photos for each side (or leave empty).</div>
  </div>
</div>

          <button disabled={!canEdit || busy} onClick={save}
            className="rounded-xl px-4 py-2 text-sm bg-slate-900 text-white hover:opacity-90 disabled:opacity-60">
            {busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}
