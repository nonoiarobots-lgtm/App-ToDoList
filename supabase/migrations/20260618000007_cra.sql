-- Module compte-rendu d'activité (CRA) — besoin point 7
-- Tables additives : ne touche pas à l'existant.

-- Cible journalière en minutes dans preferences (défaut 7h30 = 450, paramétrable)
alter table preferences
  add column cible_jour_min integer not null default 450
  check (cible_jour_min > 0);

-- Types d'activité, paramétrables par utilisateur
-- (réunion, expression de besoin, cahier des charges, recette, cadrage, copil, formation...)
create table types_activite (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nom         text not null,
  ordre       integer not null default 0,
  actif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint types_activite_nom_unique unique (user_id, nom)
);

-- Activités saisies. Durée au quart d'heure : multiple de 15 minutes, strictement positive.
create table activites (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  date_activite     date not null default current_date,
  type_activite_id  uuid references types_activite(id) on delete set null,
  projet_id         uuid references projets(id) on delete set null,
  duree_min         integer not null check (duree_min > 0 and duree_min % 15 = 0),
  commentaire       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Triggers updated_at (réutilise la fonction générique existante, search_path déjà figé)
create trigger types_activite_updated_at before update on types_activite
  for each row execute function set_updated_at();
create trigger activites_updated_at before update on activites
  for each row execute function set_updated_at();

-- Index
create index on types_activite(user_id, actif);
create index on activites(user_id, date_activite);
create index on activites(type_activite_id);
create index on activites(projet_id);

-- RLS (même convention que la migration audit_fixes : (select auth.uid()))
alter table types_activite enable row level security;
alter table activites enable row level security;
create policy "types_activite_user" on types_activite for all using ((select auth.uid()) = user_id);
create policy "activites_user" on activites for all using ((select auth.uid()) = user_id);
