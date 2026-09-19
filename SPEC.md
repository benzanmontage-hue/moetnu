# Moetnu — Spec (klusjes-marketplace)

Marktplaats voor klusjes à la Werkspot/Zoofy/ListMinut. Twee manieren om hulp te regelen:
1. **Klus plaatsen** (Werkspot-model): klant omschrijft het probleem, vakmensen reageren met offertes.
2. **Vaste dienst boeken** (Uber-model): aanbieder zet een dienst met vaste prijs neer, klant boekt direct.

---

## 1. Rollen

| Rol | Wat je kan |
|---|---|
| **Klant** | klussen plaatsen, diensten boeken, offertes vergelijken & kiezen, reviews geven |
| **Aanbieder** | diensten aanbieden, op klussen reageren (offertes), portfolio + certificaten beheren |
| **Beide** | beide rollen |

---

## 2. Workflow A — Klus (Werkspot-model)

```
1. Klant plaatst klus         → categorie, omschrijving, budget, regio, deadline, foto's
2. Matching                   → klus wordt getoond aan passende aanbieders (regio + categorie)
3. Aanbieders reageren        → offerte = prijs + bericht
4. Klant KIEST aanbieder      → "Kies"-knop: 1 offerte wordt 'gekozen', rest 'afgewezen'
5. Chat                       → details + afspraak maken
6. Klus uitgevoerd
7. Betaling                   → via Mollie (25% commissie)
8. Review                     → beide kanten
9. Status                     → open → toegewezen → voltooid (of gesloten/geannuleerd)
```

**Statussen klus:** `open` → `toegewezen` → `voltooid` | `gesloten` (geannuleerd)
**Statussen offerte:** `open` → `gekozen` / `afgewezen`

---

## 3. Workflow B — Dienst (Uber-model)

```
1. Aanbieder maakt dienst     → titel, prijs, prijsvorm, regio, categorie, omschrijving
2. Klant bladert + filtert    → per categorie/regio/prijs
3. Klant boekt                → datum + bericht → status 'aangevraagd'
4. Aanbieder accepteert       → status 'betaald' (na betaling) / 'geannuleerd'
5. Uitvoering                 → status 'uitgevoerd'
6. Review
```

**Statussen boeking:** `aangevraagd` → `betaald` → `uitgevoerd` | `geannuleerd` | `geschil`
**Statussen dienst:** `actief` / `pauze` / `verwijderd`

---

## 4. Features — status

### ✅ Klaar (live)
- Auth: signup, login, e-mailbevestiging (branded), wachtwoord-reset
- Profiel: voornaam, regio, rol, **bio ("wat ik doe")**
- **Portfolio**: werkfoto's uploaden + verwijderen
- Certificering/verificatie (KVK, VCA, Gasketelwet, etc.)
- Vakgebieden + beschikbaarheid
- Matching (regio + categorie, radius)
- Offertes plaatsen + **klant kiest winnaar** (nieuw)
- Klus: plaatsen, **verwijderen**, **voltooid**, status-badge
- Dienst: maken, **pauzeren/activeren/verwijderen**
- Chat (poster ↔ bieder)
- Foto's bij klus
- SEO + AI-zichtbaarheid (sitemap, robots, JSON-LD, llms.txt)
- AVG (verwijderen account, data-export)

### 🟡 Ontbreekt nog (geprioriteerd)
| # | Feature | Impact |
|---|---|---|
| 1 | **Betaling (Mollie iDEAL)** | Geld stroomt niet — de kern van verdienen |
| 2 | **Notificaties** (offerte/boeking/chat per mail + in-app) | Anders hoort de gebruiker niks |
| 3 | **Review-UI** (na voltooide klus een review achterlaten) | `addReview` bestaat, geen scherm |
| 4 | **Aanbieder accepteert/weigert boeking** | Boeking heeft alleen 'aangevraagd', geen acceptatie-stap |
| 5 | **Zoek/filter verbeteren** | zit er basis in, uitbreiden |
| 6 | **Admin-paneel** | nu via Supabase Studio |

---

## 5. Wat er mis was in de workflow (nu gefixt)

De poster kon offertes **zien** maar niet **kiezen**. Dat is het hart van het Werkspot-model en ontbrak. Nu zit er een "Kies"-knop die:
- 1 offerte op `gekozen` zet
- de rest op `afgewezen` zet
- de klus op `toegewezen` zet

---

## 6. Roadmap (spec-driven)

1. **Betaling (Mollie)** — klus + dienst, iDEAL, 25% commissie
2. **Notificaties** — e-mail bij offerte/boeking/chat
3. **Review-UI** — na voltooiing
4. **Boeking-acceptatie** — aanbieder accepteert/weigert
5. **Admin + zoek/filter**

*Dit document is de bron van waarheid. Elke volgende stap bouwt hierop.*
