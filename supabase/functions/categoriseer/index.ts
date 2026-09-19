// ============================================================
// MOETNU — AI categorisatie (Supabase Edge Function, DeepSeek)
// Fase 2: vrije tekst "vertel je probleem" → categorie, locatie,
// personen, duur, prijsindicatie.
//
// Deploy:
//   supabase secrets set DEEPSEEK_API_KEY=sk-xxx
//   supabase functions deploy categoriseer --no-verify-jwt
//
// Endpoint: POST { tekst: "..." }
// ============================================================

const DEEPSEEK = "https://api.deepseek.com/chat/completions";

const CATEGORIES = [
  { id: 1, naam: "Loodgieter" },
  { id: 2, naam: "Elektricien" },
  { id: 3, naam: "Klussen" },
  { id: 4, naam: "Schoonmaak" },
  { id: 5, naam: "Tuin & buiten" },
  { id: 6, naam: "Schilder" },
  { id: 7, naam: "Verhuizen" },
  { id: 8, naam: "ICT & tech" },
  { id: 9, naam: "Zorg & hulp" },
  { id: 10, naam: "Overig" },
];

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "Alleen POST" }, 405);
  }
  let body;
  try { body = await req.json(); } catch {
    return json({ ok: false, error: "Ongeldige JSON" }, 400);
  }
  const tekst = (body.tekst || "").trim();
  if (!tekst) return json({ ok: false, error: "tekst verplicht" }, 400);

  const key = Deno.env.get("DEEPSEEK_API_KEY") ?? "";
  if (!key) return json({ ok: false, error: "DEEPSEEK_API_KEY niet geconfigureerd" }, 500);

  const catList = CATEGORIES.map(c => `${c.id}:${c.naam}`).join(", ");
  const prompt = `Je bent de categoriseerder van een dienstenplatform. Classificeer de aanvraag en geef een prijsindicatie.

Categorieën (id:naam): ${catList}

Aanvraag: "${tekst}"

Geef ALLEEN geldige JSON terug, geen toelichting, met dit schema:
{
  "category_id": <int 1-10>,
  "category_naam": "<naam>",
  "personen": <int, 1-3>,
  "duur": "<bijv. '30-60 min'>",
  "locatie": "<plaatsnaam of null>",
  "prijs_min": <int euro>,
  "prijs_max": <int euro>,
  "skills": ["<skill1>", "<skill2>"]
}
Prijzen zijn realistische Nederlandse markttarieven vóór spoedtoeslag.`;

  try {
    const res = await fetch(DEEPSEEK, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });
    const data = await res.json();
    if (!res.ok) return json({ ok: false, error: data.error?.message || "DeepSeek fout" }, res.status);

    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return json({ ok: true, ...parsed });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});

function json(obj: any, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
