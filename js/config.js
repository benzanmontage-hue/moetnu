// ============================================================
// MOETNU — configuratie
// Live: Supabase gekoppeld (demo-modus uit).
// ============================================================

window.MOETNU_CONFIG = {
  // ---- Supabase (live) ----
  SUPABASE_URL: "https://jbpkiznjykwinqsenbte.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_JZI67BBxWIsN5OUJna26kw_HQJAJfpC",

  // ---- Platform ----
  COMMISSIE_PERCENT: 25,   // % commissie per opdracht (20-30%)
  PLATFORM_NAAM: "Moetnu",
  SITE_URL: "https://moetnu.nl",

  // ---- Servicekosten (per boeking, afhankelijk van orderwaarde) ----
  SERVICEKOSTEN: [
    { tot: 50,   bedrag: 4.95 },
    { tot: 100,  bedrag: 7.95 },
    { tot: 200,  bedrag: 9.95 },
    { tot: Infinity, bedrag: 14.95 },
  ],

  // ---- Snelheidstiers (voorkeur van de klant; géén opgelegde toeslag) ----
  // De aanbieder bepaalt zelf zijn tarief. Spoed is een wens die de klant
  // aangeeft; de aanbieder kan in zijn offerte zelf bepalen wat hij daarvoor vraagt.
  SPOED_TIERS: {
    plannen: { label: "Plannen",  omschrijving: "Morgen of later" },
    vandaag: { label: "Vandaag",  omschrijving: "Vandaag uitgevoerd" },
    nu:      { label: "NU",       omschrijving: "Binnen 60–120 min" },
  },

  // ---- Mollie (fase 2) ----
  MOLLIE_API_KEY: "",      // komt in een Supabase Edge Function, NIET in frontend

  // ---- AI categorisatie (fase 2) ----
  // URL van de Supabase Edge Function 'categoriseer' (DeepSeek).
  // Leeg = regel-gebaseerde categorisatie (werkt altijd).
  CATEGORISEER_URL: "",

  // ---- Account verwijderen (AVG art. 17) ----
  // URL van de Supabase Edge Function 'delete-account'.
  DELETE_ACCOUNT_URL: "https://jbpkiznjykwinqsenbte.supabase.co/functions/v1/delete-account",
};
