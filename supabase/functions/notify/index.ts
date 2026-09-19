// notify — stuurt e-mailnotificaties via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND = Deno.env.get("RESEND_API_KEY") || "";
const FROM = "Moetnu <noreply@moetnu.nl>";

serve(async (req) => {
  try {
    const { to, subject, html } = await req.json();
    if (!to || !subject) {
      return new Response(JSON.stringify({ error: "to en subject verplicht" }), { status: 400 });
    }
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    const d = await r.json();
    return new Response(JSON.stringify(d), { status: r.status });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
