// ============================================================
// MOETNU — Account verwijderen (Supabase Edge Function)
// Recht op vergetelheid (AVG art. 17). Verwijdert de auth.user
// écht via de service_role; alle gerelateerde data (profiel,
// diensten, klussen, offertes, boekingen, reviews, certificaten)
// volgt via de ON DELETE CASCADE foreign keys.
//
// Deploy:
//   supabase functions deploy delete-account --no-verify-jwt
// Endpoint:
//   POST /   Authorization: Bearer <access_token>
//   → verifieert de token, wist de bijbehorende gebruiker + cascade
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Service-role client (voor admin.deleteUser)
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "Alleen POST" }, 405);
  }

  // 1. Verifieer de gebruiker via zijn eigen access token.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ ok: false, error: "Geen token" }, 401);

  const userClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !user) {
    return json({ ok: false, error: "Ongeldige token" }, 401);
  }
  const userId = user.id;

  // 2. Log het verzoek (audittrail) vóór het wissen.
  await admin.from("data_verzoeken").insert({
    user_id: userId,
    type: "wissen",
    status: "afgehandeld",
    afgehandeld_op: new Date().toISOString(),
  });

  // 3. Verwijder de auth.user; cascade wist de rest.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return json({ ok: false, error: error.message }, 500);
  }

  return json({ ok: true });
});

function json(obj: any, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
