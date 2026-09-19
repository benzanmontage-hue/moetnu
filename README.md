# ⚡ Moetnu

Tweezijdige dienstenmarktplaats — **"de klus, direct geregeld"**. Hybride model:

- **Vaste diensten** (Uber-flow): aanbieder zet dienst met vaste prijs online, klant boekt direct en betaalt via iDEAL.
- **Vrije klussen** (Werkspot-flow): klant plaatst een klus met budget, aanbieders reageren met offertes.

**Verdienmodel:** 25% commissie per opdracht · servicekosten €4,95–14,95 per boeking · spoedtoeslag (NU/VANDAAG/PLANNEN) · credits/lead voor klussen · zakelijke abonnementen (Business €99 / PRO €299).

## Architectuur

```
Frontend (statisch, Cloudflare Pages)  ←→  Supabase (Postgres + Auth)
            │                                  │
            └──────────── Mollie (iDEAL) ←──────┘   via Supabase Edge Function
```

- **Frontend:** vanilla HTML/CSS/JS, zero build, deployt naar Cloudflare Pages (jouw standaard stack).
- **Backend:** Supabase — auth, database, Row Level Security, storage.
- **Betaling:** Mollie iDEAL via een Supabase Edge Function (fase 2).

## Bestanden

| Pad | Wat |
|---|---|
| `index.html` … `dashboard.html` | Frontend-pagina's (incl. `vraag.html` = "vertel je probleem") |
| `js/config.js` | **Vul hier Supabase-gegevens in** |
| `js/db.js` | Data-laag (Supabase of demo-mode) |
| `js/categoriseer.js` | Regel-gebaseerde categoriseerder (vrije tekst → categorie/locatie/prijs) |
| `js/geo.js` | Geodata + haversine-afstand (NL steden) voor radius-matching |
| `js/app.js` | Gedeelde UI (header, auth, toasts, cookie-banner) |
| `privacy.html`, `voorwaarden.html` | Privacyverklaring (AVG) + algemene voorwaarden |
| `supabase/schema.sql` | Tabellen + RLS + certificering + AVG-velden + seed |
| `supabase/functions/mollie/index.ts` | iDEAL-betaling (fase 2) |
| `supabase/functions/categoriseer/index.ts` | AI-categorisatie (DeepSeek, fase 2) |
| `verify.py` … `verify4.py` | Playwright-testen (59 checks) |

> **Zonder Supabase draait de site in DEMO-mode** (voorbeelddata in localStorage). Zo kan je de hele UI direct bekijken en testen.

## Live maken (3 stappen)

### 1. Supabase aanmaken (gratis, 5 min)
1. Ga naar [supabase.com](https://supabase.com) → **Start your project**.
2. Kies een naam (`moetnu`), een regio (EU), en een database-wachtwoord.
3. Open **SQL Editor** → plak de inhoud van `supabase/schema.sql` → **Run**.
4. Ga naar **Project Settings → API** → kopieer **Project URL** en **anon public key**.

### 2. Credentials invullen
Open `js/config.js` en plak:
```js
SUPABASE_URL: "https://xxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...",
```
Daarna is demo-mode automatisch uit en draait alles op je echte database.

### 3. Deployen naar Cloudflare Pages
```bash
# build-command: leeg · output-directory: / (root)
wrangler pages deploy /opt/data/home/moetnu --project-name moetnu
```
Of via de Cloudflare dashboard (Pages → Upload). Koppel daarna je domein `moetnu.nl`.

## Security (data-veiligheid)

- **Row Level Security** op álle tabellen — lees/schrijf-rechten per rij, afgedwongen óók bij directe API-aanroepen.
- **Verificatie vergrendeld:** gebruikers kunnen hun eigen `geverifieerd`-status en certificaat-status **niet** wijzigen (database-triggers blokkeren dit; alleen de service_role/admin kan verifiëren). Zo kan niemand zichzelf een "Geverifieerd"-badge geven.
- **Secrets nooit in de frontend:** Mollie- en DeepSeek-keys leven in Supabase Edge Functions (`Deno.env`), niet in de browser.
- **Wachtwoordbeleid:** minimaal 8 tekens; hashing via Supabase Auth (bcrypt, nooit plaintext).
- **XSS-bescherming:** alle gebruikersinvoer wordt geëscaped (`esc()` in `app.js`) vóór het in de DOM komt.
- **Encryptie at rest:** Supabase/Postgres versleutelt data op schijf.
- **AVG:** data-export, recht op vergetelheid en consent (zie hierboven).

> Demo-modus draait in localStorage (per browser, alleen jij ziet je eigen data) — puur voor lokaal testen. Alle echte beveiliging zit in de Supabase-laag hierboven.

## "Vertel je probleem" + AI-categorisatie (fase 2)

De homepage draait om één groot vrij tekstveld ("Wat wil je geregeld hebben?"). De klant beschrijft zijn probleem in eigen woorden; het platform bepaalt de categorie, locatie, benodigde personen, duur en prijsindicatie.

- **Regel-gebaseerd** (`js/categoriseer.js`): werkt direct, herkent trefwoorden → categorie, Nederlandse plaatsnamen → locatie, "twee personen" → capaciteit, en geeft een prijsindicatie per categorie.
- **AI (DeepSeek)** — optioneel: deploy `supabase/functions/categoriseer` en zet `CATEGORISEER_URL` in `config.js`. Zodra die gevuld is gebruikt het platform de AI; anders valt het terug op de regel-gebaseerde categoriseerder.
  ```bash
  supabase secrets set DEEPSEEK_API_KEY=***
  supabase functions deploy categoriseer --no-verify-jwt
  ```

Flow: `index.html` (vrije tekst) → `vraag.html` (categorisatie + prijsindicatie + snelheidstiers) → klus plaatsen → matching (fase 3).

## Matching & dynamische prijs (fase 3)

Zodra een klus geplaatst is, gaat het systeem uitvoerders zoeken:

- **Radius-expansie:** 5 km → 10 km → 20 km (op basis van tijd zonder acceptatie).
- **Dynamische vergoeding:** de vergoeding voor de uitvoerder stijgt automatisch +10% per 5 minuten (max +40%) om uitvoerders aan te trekken, terwijl de klant een vaste totaalprijs ziet.
- **Live matching-panel** op `klus.html`: zoekradius, actuele vergoeding, aantal benaderde uitvoerders en hun afstand.
- Geodata (`js/geo.js`) met haversine-afstand over Nederlandse steden.

> Realtime push-notificaties naar uitvoerders (Supabase Realtime) volgen zodra Supabase live is; in demo-modus werkt matching met een lokale timer + polling.

## Fase 2: iDEAL-betaling (Mollie)

1. Maak een [Mollie](https://mollie.com) account → **API keys** → kopieer de **test key**.
2. ```bash
   supabase secrets set MOLLIE_API_KEY=test_xxx SITE_URL=https://moetnu.nl FUNCTION_URL=https://<project>.supabase.co/functions/v1
   supabase functions deploy mollie --no-verify-jwt
   ```
3. Vervang in `dienst.html` de `boek()`-functie door een call naar de edge function (create-payment) i.p.v. alleen de booking aan te maken. De functie rekent 25% commissie en stuurt de klant naar de iDEAL-checkout.

## NL compliance (ingebouwd)

### Verificatie & certificering
- **Certificaten-flow:** aanbieders dienen certificaten in (KVK, VCA, Gasketelwet/CO, NEN 3140, NEN 1010, SCIOS, Asbest, vakdiploma) → status `in_behandeling` → handmatige controle door platform → `geverifieerd`.
- **"Geverifieerd"-badge** verschijnt op het profiel en bij de dienst zodra er een geverifieerd certificaat is.
- **Risico-categorieën verplicht:** gas/loodgieter en elektra zijn gemarkeerd `certificering_verplicht`. Zonder verificatie kan een aanbieder daar **geen** dienst plaatsen (wordt geblokkeerd).
- Handmatige controle: zet in de Supabase tabel `certifications` de status op `geverifieerd` (of op `profiles.geverifieerd = true`).

### AVG / GDPR
- **Privacyverklaring** (`privacy.html`) en **algemene voorwaarden** (`voorwaarden.html`) — beide ingebouwd en gelinkt.
- **Cookie-banner** met expliciete keuze (alleen noodzakelijk / akkoord), opgeslagen in localStorage.
- **Toestemming verplicht** bij registratie (checkbox, gekoppeld aan voorwaarden + privacyverklaring).
- **Rechten van betrokkenen** in het dashboard: data-export (JSON, recht op overdraagbaarheid) en account verwijderen (recht op vergetelheid). Data-verzoeken worden gelogd in tabel `data_verzoeken`.

### Nog te regelen (extern)
- [ ] KVK-verificatie koppelen aan de KVK-API (nu handmatig).
- [ ] Verwerkersovereenkomsten tekenen met Supabase en Mollie.
- [ ] Functionaris Gegevensbescherming / AVG-register bijhouden.
- [ ] BTW: 25% commissie is een belaste dienst (21% BTW).
- [ ] 14-dagen herroepingsrecht staat al in de voorwaarden; koppel de annulatie-flow eraan.

## Lokaal testen

```bash
cd /opt/data/home/moetnu
python3 -m http.server 8000
# open http://localhost:8000
```
