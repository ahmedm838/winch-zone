import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ResendSendRequest = { from: string; to: string[]; subject: string; html: string };

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const { trip_id } = await req.json().catch(() => ({}));
    if (!trip_id || typeof trip_id !== "number") {
      return new Response(JSON.stringify({ error: "trip_id is required (number)" }), { status: 400, headers: { "content-type": "application/json" } });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
    const FROM = Deno.env.get("NOTIFY_FROM_EMAIL") ?? "";
    const SUBJECT_PREFIX = Deno.env.get("NOTIFY_SUBJECT_PREFIX") ?? "[Winch Zone]";
    if (!RESEND_API_KEY || !FROM) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY or NOTIFY_FROM_EMAIL" }), { status: 500, headers: { "content-type": "application/json" } });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }), { status: 500, headers: { "content-type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("id, trip_no, trip_date, pickup_location, dropoff_location, price_per_trip, status, notes, customers(name), services(name), vehicles(name), payments(name), collection(name)")
      .eq("id", trip_id)
      .maybeSingle();

    if (tripErr || !trip) {
      return new Response(JSON.stringify({ error: "Trip not found", details: tripErr?.message }), { status: 404, headers: { "content-type": "application/json" } });
    }

    const { data: admins, error: adminErr } = await supabase
      .from("profiles")
      .select("user_id, user_directory(email), role_id")
      .eq("role_id", 1);

    if (adminErr) {
      return new Response(JSON.stringify({ error: "Failed to load admins", details: adminErr.message }), { status: 500, headers: { "content-type": "application/json" } });
    }

    const emails = (admins ?? []).map((r: any) => r?.user_directory?.email).filter((e: any) => typeof e === "string" && e.includes("@"));

    if (emails.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, message: "No admin emails found" }), { headers: { "content-type": "application/json" } });
    }

    const tripNo = (trip as any).trip_no ?? String(trip.id);
    const date = (trip as any).trip_date ?? "";
    const customer = Array.isArray((trip as any).customers) ? (trip as any).customers?.[0]?.name : (trip as any).customers?.name;
    const service = Array.isArray((trip as any).services) ? (trip as any).services?.[0]?.name : (trip as any).services?.name;
    const vehicle = Array.isArray((trip as any).vehicles) ? (trip as any).vehicles?.[0]?.name : (trip as any).vehicles?.name;
    const payment = Array.isArray((trip as any).payments) ? (trip as any).payments?.[0]?.name : (trip as any).payments?.name;
    const collection = Array.isArray((trip as any).collection) ? (trip as any).collection?.[0]?.name : (trip as any).collection?.name;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>${escapeHtml(SUBJECT_PREFIX)} New Trip Recorded</h2>
        <table cellpadding="6" cellspacing="0" border="1" style="border-collapse: collapse;">
          <tr><td><b>Trip No.</b></td><td>${escapeHtml(String(tripNo))}</td></tr>
          <tr><td><b>Date</b></td><td>${escapeHtml(String(date))}</td></tr>
          <tr><td><b>Status</b></td><td>${escapeHtml(String((trip as any).status ?? ""))}</td></tr>
          <tr><td><b>Customer</b></td><td>${escapeHtml(String(customer ?? ""))}</td></tr>
          <tr><td><b>Service</b></td><td>${escapeHtml(String(service ?? ""))}</td></tr>
          <tr><td><b>Vehicle</b></td><td>${escapeHtml(String(vehicle ?? ""))}</td></tr>
          <tr><td><b>Pickup</b></td><td>${escapeHtml(String((trip as any).pickup_location ?? ""))}</td></tr>
          <tr><td><b>Dropoff</b></td><td>${escapeHtml(String((trip as any).dropoff_location ?? ""))}</td></tr>
          <tr><td><b>Price</b></td><td>${escapeHtml(String((trip as any).price_per_trip ?? ""))}</td></tr>
          <tr><td><b>Payment</b></td><td>${escapeHtml(String(payment ?? ""))}</td></tr>
          <tr><td><b>Collection</b></td><td>${escapeHtml(String(collection ?? ""))}</td></tr>
          <tr><td><b>Notes</b></td><td>${escapeHtml(String((trip as any).notes ?? ""))}</td></tr>
        </table>
        <p style="margin-top: 14px; color: #666; font-size: 12px;">This is an automated notification from Winch Zone.</p>
      </div>
    `;

    const subject = `${SUBJECT_PREFIX} Trip ${tripNo} recorded`;

    const body: ResendSendRequest = { from: FROM, to: emails, subject, html };

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify(body),
    });

    const respJson = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "Email provider error", status: resp.status, details: respJson }), { status: 502, headers: { "content-type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, sent: emails.length, provider: respJson }), { headers: { "content-type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), { status: 500, headers: { "content-type": "application/json" } });
  }
});