# Uber-architectuur → Moetnu lessen

Het diagram is Uber's **RideRequestFlow** (system design): Rider → Gateway → WebSocket → Kafka → RideService → Assignment Queue → Driver Assignment → Notification Service, met Distributed DB, Location Mapping en Cache.

## De koppeling naar Moetnu

| Uber-patroon | Wat het doet | Moetnu-equivalent | Status |
|---|---|---|---|
| **Gateway + WebSocket** | real-time push naar app | Supabase **Realtime** (bid/boeking/chat live) | 🟡 nog niet — nu alleen e-mail + polling |
| **Kafka (event-driven)** | services praten via events, losgekoppeld | Supabase **Database Webhooks** (trigger op insert → notify) | 🟡 nu frontend-getriggerd |
| **Assignment Queue + Matching Service** | match rider↔driver | `matchProviders` + **"kies winnaar"** | ✅ bestaat |
| **Distributed Lock** | voorkom dubbele toewijzing | race-safe "kies winnaar" (atomic) | 🟡 RLS dekt het deels |
| **Notification Service** | push + sms + e-mail | `notify` edge function (e-mail) | ✅ basis, 🟡 geen in-app/sms |
| **Cache (Redis)** | snelle state | CDN-cache + Supabase | ✅ statisch |

## De 3 lessen die er écht toe doen

### 1. Real-time i.p.v. alleen e-mail
Uber duwt alles live via WebSocket. Moetnu mailt nu (goed begin), maar een klant die een offerte krijgt moet **direct in de app** zien dat er geboden is — niet pas via mail.
→ **Supabase Realtime** op `bids`, `bookings`, `messages`. Stapels al klaar (Supabase = Realtime ingebouwd).

### 2. Notificaties server-side (webhook), niet frontend
Nu roept de frontend `notify` aan ná een actie. Als de frontend faalt, geen notificatie.
→ **Database Webhook**: trigger op `INSERT` in bids/bookings/messages → roept `notify` aan. Onfeilbaar.

### 3. Atomic "kies winnaar" (distributed lock)
Uber voorkomt dat 2 chauffeurs dezelfde rit krijgen. Moetnu's `chooseBid` zet 1 offerte op `gekozen` + rest op `afgewezen` — maar als 2 klanten tegelijk klikken kan het racen.
→ **Race-safe**: `chooseBid` in een edge function met een `UPDATE ... WHERE status='open'` guard (atomic), i.p.v. 3 losse frontend-queries.

## Prioriteit

1. **Mollie-betaling** (nog altijd #1 — zonder geld geen Uber)
2. **Database Webhooks** voor notificaties (snel, maakt notificaties onfeilbaar)
3. **Supabase Realtime** voor in-app live-updates
4. **Atomic choose-bid** (race-safe matching)
