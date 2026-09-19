-- ============================================================
-- MOETNU — Migratie: 4 nieuwe spoed-categorieën
-- Run dit in de Supabase SQL Editor (eenmalig).
-- ============================================================

insert into public.categories (slug, naam, icon, volgorde) values
  ('slotensmid', 'Slotensmid', '🔑', 11),
  ('cv-monteur', 'CV & verwarming', '🔥', 12),
  ('dakdekker', 'Dakdekker', '🏠', 13),
  ('ongedierte', 'Ongediertebestrijding', '🐜', 14)
on conflict (slug) do nothing;

-- cv-monteur (gas) vereist certificering
update public.categories set certificering_verplicht = true where slug = 'cv-monteur';
