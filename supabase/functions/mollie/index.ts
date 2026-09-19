// ============================================================
// MOETNU — Mollie betaling (Supabase Edge Function)
// Fase 2: iDEAL-betaling + 25% commissie.
//
// Deploy:
//   supabase secrets set MOLLIE_API_KEY=test_xxxx
//   supabase functions deploy mollie --no-verify-jwt
//
// Endpoints:
//   POST /create-payment  { booking_id, bedrag }  → betaal-url
//   POST /webhook         (Mollie roept dit aan)  → verwerkt status
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const MOLLIE = "https://api.mollie.com/v2";
const API_KEY = Deno.env.get("MOLLIE_API_KEY") ?? "";
const COMMISSIE = 25; // % commissie per opdracht (20-30%)

const sb = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/+|\/+$/g, "");

  if (req.method === "POST" && (path === "create-payment" || path === "mollie/create-payment")) {
    return createPayment(req);
  }
  if (req.method === "POST" && (path === "webhook" || path === "mollie/webhook")) {
    return webhook(req);
  }
  return new Response(JSON.stringify({ ok: false, error: "Onbekend endpoint" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
});

async function createPayment(req: Request): Promise<Response> {
  let body: any;
  try { body = await req.json(); } catch {
    return json({ ok: false, error: "Ongeldige JSON" }, 400);
  }
  const { booking_id, bedrag } = body;
  if (!booking_id || !bedrag) return json({ ok: false, error: "booking_id en bedrag verplicht" }, 400);

  // Booking ophalen
  const { data: booking } = await sb.from("bookings").select("*").eq("id", booking_id).single();
  if (!booking) return json({ ok: false, error: "Boeking niet gevonden" }, 404);

  const amount = String((Number(bedrag) * 100).toFixed(0)); // naar centen
  const res = await fetch(`${MOLLIE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: { currency: "EUR", value: (Number(bedrag)).toFixed(2) },
      description: `Moetnu boeking ${booking_id}`,
      method: "ideal",
      redirectUrl: `${Deno.env.get("SITE_URL") ?? "http://localhost"}/dashboard.html?betaling=ok`,
      webhookUrl: `${Deno.env.get("FUNCTION_URL")}/mollie/webhook`,
      metadata: { booking_id },
    }),
  });
  const payment = await res.json();
  if (!res.ok) return json({ ok: false, error: payment.detail || "Mollie fout" }, res.status);

  // Registreer betaling (25% commissie)
  await sb.from("payments").insert({
    booking_id,
    mollie_id: payment.id,
    bedrag,
    commissie: (Number(bedrag) * COMMISSIE / 100),
    status: "open",
  });

  return json({ ok: true, checkout_url: payment._links.checkout.href });
}

async function webhook(req: Request): Promise<Response> {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return json({ ok: false }, 400);

  const res = await fetch(`${MOLLIE}/payments/${id}`, {
    headers: { Authorization: "Bearer " + API_KEY },
  });
  const payment = await res.json();
  const booking_id = payment.metadata?.booking_id;
  if (!booking_id) return json({ ok: false, error: "Geen booking_id" }, 400);

  let status = "open";
  if (payment.status === "paid") status = "betaald";
  else if (payment.status === "failed" || payment.status === "canceled" || payment.status === "expired") status = "mislukt";
  else if (payment.status === "refunded") status = "terugbetaald";

  await sb.from("payments").update({ status }).eq("mollie_id", id);
  if (status === "betaald") {
    await sb.from("bookings").update({ status: "betaald" }).eq("id", booking_id);
  }

  return json({ ok: true, status });
}

function json(obj: any, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
