# Moetnu — QA-rapport

**Datum:** 2026-09-19
**Tester:** QA (geautomatiseerde browser- + API-checks)
**Scope:** volledige live app op moetnu.nl + Supabase backend

---

## 1. Samenvatting

De app is **functioneel compleet voor een MVP**. Alle eerder gemelde kritieke bugs zijn opgelost en live geverifieerd. Restant: 1 grote feature (betaling) + 2 kleinere UI-onderwerpen.

**Oordeel:** ✅ Klaar voor een gesloten beta (na Mollie-betaling).

---

## 2. Testresultaten

### 2.1 Pagina's (HTTP-status + content)
| Check | Resultaat |
|---|---|
| Homepage | ✅ 2 echte diensten, 0 nep-kaarten, 0 JS-fouten |
| Diensten / Klussen (lijst + filter) | ✅ |
| Dienst-detail + aanbieder-profiel | ✅ bio + portfolio + reviews renderen |
| Plaatsen (dienst + klus form) | ✅ categorie-voorbeelden per categorie |
| Login / registratie | ✅ (incl. 18+ en AVG-checkbox) |
| Dashboard (alle secties) | ✅ |
| SEO (robots, sitemap, llms.txt, JSON-LD) | ✅ HTTP 200 |
| Landingspagina's (12 diensten + 2 klussen) | ✅ 0 dode links |

### 2.2 Functies (functioneel getest)
| Functie | Status |
|---|---|
| Auth + branded e-mail + wachtwoord-reset | ✅ |
| Spoedtoeslag (Plannen 0% / Vandaag +10% / NU +25%) | ✅ rekenkundig geverifieerd (€60 → €67,95 / €73,95 / €82,95) |
| Portfolio uploaden/verwijderen | ✅ |
| Klus verwijderen/voltooien + kies winnaar | ✅ |
| Dienst pauzeren/activeren/verwijderen | ✅ (webview-veilige 2-klik-bevestiging) |
| Notificaties (e-mail bij offerte/boeking/chat) | ✅ edge function gedeployed |
| AVG account-verwijderen | ✅ edge function gedeployed |

### 2.3 Beveiliging (RLS)
| Policy | Status |
|---|---|
| profiles niet anoniem scrapebaar | ✅ |
| bieder kan offerte niet zelf "gekozen" zetten | ✅ |
| poster mag bids op eigen klus bijwerken | ✅ |
| portfolio/opslag alleen eigenaar | ✅ |

---

## 3. Openstaand (prioriteit)

| # | Item | Impact |
|---|---|---|
| 1 | **Mollie-betaling** (key leeg, functie niet gedeployed) | 🔴 geld stroomt niet |
| 2 | Review-UI (addReview bestaat, geen scherm) | 🟡 |
| 3 | Boeking-acceptatie (aanbieder accepteert/weigert) | 🟡 |
| 4 | CDN-cache: directe .js/.css-URL's (zonder ?v=) nog 1 jaar oud | ⚪ lost op na purge |

---

## 4. Aanbevelingen (Uber-architectuur lessen)

Zie `docs/uber-lessen.md` voor de koppeling van Uber's RideRequestFlow naar Moetnu.
