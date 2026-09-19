-- ============================================================
-- MOETNU — Supabase schema (Postgres + RLS)
-- Dienstenmarktplaats: vaste diensten (Uber) + vrije klussen (Werkspot)
-- Run dit in de Supabase SQL editor, of: psql -f schema.sql
-- ============================================================

-- ---- Extensies ----
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES — 1:1 met auth.users, rol bepaalt wat je kan
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  voornaam    text,
  achternaam  text,
  rol         text not null default 'klant' check (rol in ('klant','aanbieder','beide')),
  regio       text,               -- bv 'Amsterdam', 'Utrecht'
  bio         text,
  kvk_nummer  text,               -- KVK-verificatie (fase 3)
  kvk_geverifieerd boolean default false,
  telefoon    text,
  avatar_url  text,
  toestemming_avg    boolean not null default false,
  toestemming_avg_op timestamptz,
  meerderjarig       boolean not null default false,
  geverifieerd       boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Profiel automatisch aanmaken bij signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, voornaam, rol, toestemming_avg, toestemming_avg_op, meerderjarig)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'voornaam', ''),
    coalesce(new.raw_user_meta_data->>'rol', 'klant'),
    coalesce((new.raw_user_meta_data->>'toestemming')::boolean, false),
    case when coalesce((new.raw_user_meta_data->>'toestemming')::boolean, false) then now() else null end,
    coalesce((new.raw_user_meta_data->>'meerderjarig')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id    bigint generated always as identity primary key,
  slug  text unique not null,
  naam  text not null,
  icon  text,                      -- emoji als icon
  volgorde int default 0
);

-- ============================================================
-- SERVICES — vaste diensten (Uber-flow)
-- ============================================================
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.profiles(id) on delete cascade,
  category_id  bigint references public.categories(id) on delete set null,
  titel        text not null,
  omschrijving text,
  prijs        numeric(10,2) not null check (prijs > 0),
  prijs_type   text default 'vast' check (prijs_type in ('vast','vanaf','per_uur')),
  regio        text not null,
  foto_urls    text[] default '{}',
  status       text not null default 'actief' check (status in ('actief','pauze','verwijderd')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- JOBS — vrije klussen (Werkspot-flow)
-- ============================================================
create table if not exists public.jobs (
  id           uuid primary key default gen_random_uuid(),
  poster_id    uuid not null references public.profiles(id) on delete cascade,
  category_id  bigint references public.categories(id) on delete set null,
  titel        text not null,
  omschrijving text,
  budget_min   numeric(10,2),
  budget_max   numeric(10,2),
  regio        text not null,
  deadline     date,
  status       text not null default 'open' check (status in ('open','toegewezen','gesloten')),
  created_at   timestamptz not null default now()
);

-- ============================================================
-- BIDS — offertes van aanbieders op een klus
-- ============================================================
create table if not exists public.bids (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.jobs(id) on delete cascade,
  provider_id  uuid not null references public.profiles(id) on delete cascade,
  bedrag       numeric(10,2) not null check (bedrag > 0),
  bericht      text,
  status       text not null default 'open' check (status in ('open','gekozen','afgewezen')),
  created_at   timestamptz not null default now(),
  unique (job_id, provider_id)
);

-- ============================================================
-- BOOKINGS — boeking van een vaste dienst
-- ============================================================
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid not null references public.services(id) on delete cascade,
  customer_id  uuid not null references public.profiles(id) on delete cascade,
  provider_id  uuid not null references public.profiles(id) on delete cascade,
  bedrag       numeric(10,2) not null,
  snelheid     text not null default 'plannen' check (snelheid in ('plannen','vandaag','nu')),
  spoed_toeslag numeric(10,2) not null default 0,
  servicekosten numeric(10,2) not null default 0,
  totaal       numeric(10,2),
  status       text not null default 'aangevraagd'
               check (status in ('aangevraagd','betaald','uitgevoerd','geannuleerd','geschil')),
  gewenste_datum date,
  bericht      text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- REVIEWS — na een uitgevoerde boeking/klus
-- ============================================================
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid references public.bookings(id) on delete set null,
  job_id       uuid references public.jobs(id) on delete set null,
  reviewer_id  uuid not null references public.profiles(id) on delete cascade,
  reviewee_id  uuid not null references public.profiles(id) on delete cascade,
  rating       int not null check (rating between 1 and 5),
  tekst        text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- PAYMENTS — Mollie transacties (fase 2)
-- ============================================================
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid references public.bookings(id) on delete set null,
  mollie_id    text,
  bedrag       numeric(10,2) not null,
  commissie    numeric(10,2),        -- 25% platformfee
  status       text not null default 'open' check (status in ('open','betaald','mislukt','terugbetaald')),
  created_at   timestamptz not null default now()
);

-- ============================================================
-- INDEXEN
-- ============================================================
create index if not exists idx_services_category  on public.services(category_id);
create index if not exists idx_services_regio     on public.services(regio);
create index if not exists idx_services_status    on public.services(status);
create index if not exists idx_jobs_status        on public.jobs(status);
create index if not exists idx_jobs_regio         on public.jobs(regio);
create index if not exists idx_bids_job           on public.bids(job_id);
create index if not exists idx_bookings_customer  on public.bookings(customer_id);
create index if not exists idx_bookings_provider  on public.bookings(provider_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.services   enable row level security;
alter table public.jobs       enable row level security;
alter table public.bids       enable row level security;
alter table public.bookings   enable row level security;
alter table public.reviews    enable row level security;
alter table public.payments   enable row level security;

-- PROFILES: alleen ingelogde gebruikers lezen (PII beschermd tegen anoniem scrapen); eigenaar schrijft
create policy "profiles read"  on public.profiles for select using (auth.role() = 'authenticated');
create policy "profiles write" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- CATEGORIES: iedereen leest, alleen admin schrijft (via service role)
create policy "categories read" on public.categories for select using (true);

-- SERVICES: iedereen leest actieve, aanbieder beheert eigen
create policy "services read"   on public.services for select using (status = 'actief');
create policy "services insert" on public.services for insert with check (auth.uid() = provider_id);
create policy "services update" on public.services for update using (auth.uid() = provider_id);
create policy "services delete" on public.services for delete using (auth.uid() = provider_id);

-- JOBS: iedereen leest open, poster beheert eigen
create policy "jobs read"   on public.jobs for select using (status = 'open');
create policy "jobs insert" on public.jobs for insert with check (auth.uid() = poster_id);
create policy "jobs update" on public.jobs for update using (auth.uid() = poster_id);
create policy "jobs delete" on public.jobs for delete using (auth.uid() = poster_id);

-- BIDS: job-poster en bieder lezen; bieder schrijft eigen
create policy "bids read"   on public.bids for select using (
  auth.uid() = provider_id
  or auth.uid() = (select poster_id from public.jobs where id = job_id)
);
create policy "bids insert" on public.bids for insert with check (auth.uid() = provider_id);
create policy "bids update" on public.bids for update using (auth.uid() = provider_id);

-- Aanbieders mogen hun offerte niet zelf op 'gekozen'/'afgewezen' zetten
-- (alleen de klusposter kiest de winnaar; via service role / RPC)
create or replace function public.prevent_bid_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.provider_id and new.status is distinct from old.status then
    raise exception 'Aanbieder kan de status van een offerte niet zelf wijzigen';
  end if;
  return new;
end;
$$;
drop trigger if exists prevent_bid_status_change on public.bids;
create trigger prevent_bid_status_change
  before update on public.bids
  for each row execute procedure public.prevent_bid_status_change();

-- BOOKINGS: klant en aanbieder lezen/schrijven eigen boeking
create policy "bookings read" on public.bookings for select using (
  auth.uid() = customer_id or auth.uid() = provider_id
);
create policy "bookings insert" on public.bookings for insert with check (auth.uid() = customer_id);
create policy "bookings update" on public.bookings for update using (
  auth.uid() = customer_id or auth.uid() = provider_id
);

-- REVIEWS: iedereen leest, reviewer schrijft eigen
create policy "reviews read"  on public.reviews for select using (true);
create policy "reviews insert" on public.reviews for insert with check (auth.uid() = reviewer_id);

-- PAYMENTS: alleen betrokkenen lezen
create policy "payments read" on public.payments for select using (
  auth.uid() = (select customer_id from public.bookings where id = booking_id)
  or auth.uid() = (select provider_id from public.bookings where id = booking_id)
);

-- ============================================================
-- SEED — categorieën (eenmalig)
-- ============================================================
insert into public.categories (slug, naam, icon, volgorde) values
  ('loodgieter',   'Loodgieter',   '🔧', 1),
  ('elektricien',  'Elektricien',  '⚡', 2),
  ('klussen',      'Klussen',      '🔨', 3),
  ('schoonmaak',   'Schoonmaak',   '🧹', 4),
  ('tuin',         'Tuin & buiten','🌿', 5),
  ('schilderen',   'Schilder',     '🖌️', 6),
  ('verhuizen',    'Verhuizen',    '📦', 7),
  ('ict',          'ICT & tech',   '💻', 8),
  ('zorg',         'Zorg & hulp',  '🤝', 9),
  ('overig',       'Overig',       '➕', 10),
  ('slotensmid',   'Slotensmid',   '🔑', 11),
  ('cv-monteur',   'CV & verwarming','🔥', 12),
  ('dakdekker',    'Dakdekker',    '🏠', 13),
  ('ongedierte',   'Ongediertebestrijding','🐜', 14)
on conflict (slug) do nothing;

-- ============================================================
-- Trigger: updated_at automatisch
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_updated on public.services;
create trigger services_updated before update on public.services
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- VERIFICATIE & CERTIFICERING (NL wet- en regelgeving)
-- ============================================================

-- Categorieën: is certificering verplicht om hier diensten aan te bieden?
alter table public.categories add column if not exists certificering_verplicht boolean not null default false;

-- Profielen: AVG-toestemming + KVK-verificatievelden (uitbreiding)
alter table public.profiles add column if not exists toestemming_avg boolean not null default false;
alter table public.profiles add column if not exists toestemming_avg_op timestamptz;
alter table public.profiles add column if not exists meerderjarig boolean not null default false;
alter table public.profiles add column if not exists geverifieerd boolean not null default false;

-- Certificaten van aanbieders
create table if not exists public.certifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  type         text not null,          -- KVK, VCA, Gasketelwet/CO, NEN3140, NEN1010, Asbest, vakdiploma, anders
  nummer       text,
  status       text not null default 'in_behandeling'
               check (status in ('in_behandeling','geverifieerd','afgewezen')),
  bewijs_url   text,                    -- upload naar Supabase Storage (fase 2) of URL
  opmerking    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_certifications_user on public.certifications(user_id);
create index if not exists idx_certifications_status on public.certifications(status);

alter table public.certifications enable row level security;

-- Certificaten: eigenaar beheert eigen; geverifieerde zijn openbaar leesbaar (voor badge)
create policy "certifications read own" on public.certifications
  for select using (auth.uid() = user_id or (status = 'geverifieerd'));
create policy "certifications insert" on public.certifications
  for insert with check (auth.uid() = user_id);
create policy "certifications update" on public.certifications
  for update using (auth.uid() = user_id);
create policy "certifications delete" on public.certifications
  for delete using (auth.uid() = user_id);

-- Trigger voor updated_at op certificaten
drop trigger if exists certs_updated on public.certifications;
create trigger certs_updated before update on public.certifications
  for each row execute procedure public.set_updated_at();

-- Risico-categorieën: certificering verplicht (gas/loodgieter, elektra, cv-monteur)
update public.categories set certificering_verplicht = true where slug in ('loodgieter','elektricien','cv-monteur');

-- ============================================================
-- AVG — dataverzoeken log (recht op inzage/wissen bijhouden)
-- ============================================================
create table if not exists public.data_verzoeken (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('inzage','export','wissen','rectificatie')),
  status      text not null default 'open' check (status in ('open','afgehandeld')),
  created_at  timestamptz not null default now(),
  afgehandeld_op timestamptz
);

alter table public.data_verzoeken enable row level security;
create policy "data_verzoeken read own" on public.data_verzoeken
  for select using (auth.uid() = user_id);
create policy "data_verzoeken insert" on public.data_verzoeken
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- SECURITY — verificatie-velden vergrendelen
-- Alleen de service_role (platform/admin) mag de verificatie-status
-- wijzigen. Gewone gebruikers kunnen zichzelf NIET "geverifieerd" maken.
-- ============================================================

-- Profiles: geverifieerd / kvk_geverifieerd zijn admin-only
create or replace function public.protect_profile_verificatie()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role'
     and (new.geverifieerd is distinct from old.geverifieerd
          or new.kvk_geverifieerd is distinct from old.kvk_geverifieerd) then
    raise exception 'Verificatie-status kan alleen door het platform worden gewijzigd.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_verificatie on public.profiles;
create trigger protect_profile_verificatie
  before update on public.profiles
  for each row execute procedure public.protect_profile_verificatie();

-- Certifications: status wordt bij INSERT gedwongen op 'in_behandeling';
-- een wijziging van status is admin-only.
create or replace function public.protect_cert_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' then
    if tg_op = 'INSERT' then
      new.status := 'in_behandeling';
    elsif new.status is distinct from old.status then
      raise exception 'Certificaat-status kan alleen door het platform worden gewijzigd.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_cert_status on public.certifications;
create trigger protect_cert_status
  before insert or update on public.certifications
  for each row execute procedure public.protect_cert_status();

-- ============================================================
-- MESSAGES — chat klant ↔ klusser (bij klus of boeking)
-- ============================================================
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid references public.jobs(id) on delete cascade,
  booking_id   uuid references public.bookings(id) on delete cascade,
  sender_id    uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  tekst        text not null,
  gelezen      boolean not null default false,
  created_at   timestamptz not null default now(),
  check (job_id is not null or booking_id is not null)
);

create index if not exists idx_messages_job       on public.messages(job_id);
create index if not exists idx_messages_booking   on public.messages(booking_id);
create index if not exists idx_messages_sender    on public.messages(sender_id);
create index if not exists idx_messages_recipient on public.messages(recipient_id);

alter table public.messages enable row level security;

create policy "messages read" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "messages insert" on public.messages
  for insert with check (auth.uid() = sender_id);

-- ============================================================
-- FOTO'S — klusfoto's (opslag in Storage-bucket klus-fotos)
-- ============================================================
alter table public.jobs add column if not exists foto_urls text[] default '{}';

insert into storage.buckets (id, name, public) values ('klus-fotos', 'klus-fotos', true)
on conflict (id) do nothing;

drop policy if exists "klus-fotos public read" on storage.objects;
create policy "klus-fotos public read" on storage.objects
  for select using (bucket_id = 'klus-fotos');
drop policy if exists "klus-fotos auth insert" on storage.objects;
create policy "klus-fotos auth insert" on storage.objects
  for insert with check (bucket_id = 'klus-fotos' and auth.role() = 'authenticated');

-- ============================================================
-- VAKGEBIEDEN — aanbieder ↔ categorie
-- ============================================================
create table if not exists public.provider_categories (
  provider_id uuid not null references public.profiles(id) on delete cascade,
  category_id bigint not null references public.categories(id) on delete cascade,
  primary key (provider_id, category_id)
);
alter table public.provider_categories enable row level security;
drop policy if exists "pc read"   on public.provider_categories;
drop policy if exists "pc write"  on public.provider_categories;
drop policy if exists "pc delete" on public.provider_categories;
create policy "pc read"   on public.provider_categories for select using (true);
create policy "pc write"  on public.provider_categories for insert with check (auth.uid() = provider_id);
create policy "pc delete" on public.provider_categories for delete using (auth.uid() = provider_id);

-- ============================================================
-- BESCHIKBAARHEID — agenda per aanbieder
-- ============================================================
create table if not exists public.availability (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles(id) on delete cascade,
  dag         text not null check (dag in ('ma','di','wo','do','vr','za','zo')),
  start_tijd  time not null,
  eind_tijd   time not null,
  check (eind_tijd > start_tijd),
  unique (provider_id, dag)
);
alter table public.availability enable row level security;
drop policy if exists "avail read"   on public.availability;
drop policy if exists "avail write"  on public.availability;
drop policy if exists "avail delete" on public.availability;
create policy "avail read"   on public.availability for select using (true);
create policy "avail write"  on public.availability for insert with check (auth.uid() = provider_id);
create policy "avail delete" on public.availability for delete using (auth.uid() = provider_id);



