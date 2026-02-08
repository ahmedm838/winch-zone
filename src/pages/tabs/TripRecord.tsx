import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { fetchCustomers, fetchMasters, uploadToBucket, Customer, SimpleRow } from "./_shared";
import { UploadBox } from "../../components/UploadBox";
import { fmtMoney } from "../../lib/format";

export default function TripRecord() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [masters, setMasters] = useState<{ services: SimpleRow[]; vehicles: SimpleRow[]; payments: SimpleRow[] } | null>(null);

  const [tripDate, setTripDate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [serviceId, setServiceId] = useState<number | "">("");
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [price, setPrice] = useState("");
  const [paymentId, setPaymentId] = useState<number | "">("");

  const [pickupFiles, setPickupFiles] = useState<File[]>([]);
  const [dropoffFiles, setDropoffFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchCustomers(), fetchMasters()])
      .then(([c, m]) => { setCustomers(c); setMasters(m); })
      .catch((e) => setMsg(e?.message ?? "Failed to load"));
  }, []);

  const priceNum = useMemo(() => {
    const n = Number(price.replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }, [price]);

  function validate() {
    if (!tripDate) return "Trip date is required.";
    if (!customerId) return "Customer is required.";
    if (!serviceId) return "Service is required.";
    if (!vehicleId) return "Vehicle is required.";
    if (!pickup.trim()) return "Pick up location is required.";
    if (!dropoff.trim()) return "Drop off location is required.";
    if (!Number.isFinite(priceNum) || priceNum < 100 || priceNum > 99999) return "Price must be 3 to 5 digits.";
    if (!paymentId) return "Payment is required.";
    if (pickupFiles.length > 0 && pickupFiles.length !== 4) return "Pick up photos must be 4 files (or leave empty to upload later).";
    if (dropoffFiles.length > 0 && dropoffFiles.length !== 4) return "Drop off photos must be 4 files (or leave empty to upload later).";
    return null;
  }

  async function onSave() {
    const v = validate();
    if (v) return setMsg(v);

    setBusy(true);
    setMsg(null);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("Not logged in");

      const { data: ins, error } = await supabase
        .from("trips")
        .insert({
          trip_date: tripDate,
          customer_id: customerId,
          service_id: serviceId,
          vehicle_id: vehicleId,
          pickup_location: pickup.trim(),
          dropoff_location: dropoff.trim(),
          price_per_trip: priceNum,
          payment_id: paymentId,
          created_by: uid,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw error;

      const tripId = ins.id as number;
      const pu: string[] = [];
const dof: string[] = [];

if (pickupFiles.length) {
  for (let i = 0; i < pickupFiles.length; i++) {
    pu.push(await uploadToBucket("trip_photos", `${tripId}/pickup_${i + 1}_${pickupFiles[i].name}`, pickupFiles[i]));
  }
}
if (dropoffFiles.length) {
  for (let i = 0; i < dropoffFiles.length; i++) {
    dof.push(await uploadToBucket("trip_photos", `${tripId}/dropoff_${i + 1}_${dropoffFiles[i].name}`, dropoffFiles[i]));
  }
}

if (pu.length || dof.length) {
  const { error: upErr } = await supabase.from("trips").update({ pickup_photos: pu, dropoff_photos: dof }).eq("id", tripId);
  if (upErr) throw upErr;
}


      setMsg("Trip recorded (Pending).");
      setTripDate(""); setCustomerId(""); setServiceId(""); setVehicleId("");
      setPickup(""); setDropoff(""); setPrice(""); setPaymentId("");
      setPickupFiles([]); setDropoffFiles([]);
    } catch (e: any) {
      setMsg(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Record trip</div>
        <div className="text-xs text-slate-500">Admin & User. Photos are optional now (you can upload later while trip is Pending). If you upload, use exactly 4 pickup + 4 dropoff.</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">Date</label>
          <input type="date" value={tripDate} onChange={(e)=>setTripDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2" />
        </div>

        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">Customer</label>
          <select value={customerId} onChange={(e)=>setCustomerId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2">
            <option value="">Select...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">Service</label>
          <select value={serviceId} onChange={(e)=>setServiceId(e.target.value ? Number(e.target.value) : "")}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2">
            <option value="">Select...</option>
            {masters?.services?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">Vehicle</label>
          <select value={vehicleId} onChange={(e)=>setVehicleId(e.target.value ? Number(e.target.value) : "")}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2">
            <option value="">Select...</option>
            {masters?.vehicles?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">Pick up location</label>
          <input value={pickup} onChange={(e)=>setPickup(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2" />
        </div>

        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">Drop off location</label>
          <input value={dropoff} onChange={(e)=>setDropoff(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2" />
        </div>

        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">Price per trip</label>
          <input value={price} onChange={(e)=>setPrice(e.target.value.replace(/[^0-9,]/g,""))} placeholder="e.g. 2,500"
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2" />
          <div className="text-xs text-slate-500 mt-1">{Number.isFinite(priceNum) ? `Preview: ${fmtMoney(priceNum)}` : ""}</div>
        </div>

        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">Payment method</label>
          <select value={paymentId} onChange={(e)=>setPaymentId(e.target.value ? Number(e.target.value) : "")}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2">
            <option value="">Select...</option>
            {masters?.payments?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <UploadBox label="Pick up photos (4)" accept="image/*" maxFiles={4} onFiles={setPickupFiles} />
        <UploadBox label="Drop off photos (4)" accept="image/*" maxFiles={4} onFiles={setDropoffFiles} />
      </div>

      {msg ? <div className="text-sm text-slate-700 dark:text-slate-200">{msg}</div> : null}

      <button disabled={busy} onClick={onSave} className="rounded-xl px-4 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:opacity-90 disabled:opacity-60">
        {busy ? "Saving..." : "Save trip"}
      </button>
    </div>
  );
}
