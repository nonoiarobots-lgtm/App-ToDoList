-- Extensions nécessaires
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- Types enum
create type projet_identifiant as enum ('couleur', 'icone');
create type statut_tache as enum (
  'a_qualifier', 'active', 'en_retard',
  'en_attente_retour', 'archivee'
);
create type priorite_tache as enum ('haute', 'moyenne', 'basse', 'aucune');
create type frequence_recurrence as enum ('quotidienne', 'hebdomadaire', 'mensuelle');

-- Table preferences
create table preferences (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  prenom              text not null,
  heure_briefing      time not null default '08:00',
  heure_qualification time not null default '12:00',
  heure_retards       time not null default '18:00',
  seuil_orange        integer not null default 15,
  seuil_rouge         integer not null default 20,
  timezone            text not null default 'Europe/Paris',
  push_subscription   jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint preferences_user_unique unique (user_id),
  constraint preferences_seuils_check check (seuil_rouge > seuil_orange),
  constraint preferences_seuil_min_check check (seuil_orange >= 1),
  constraint preferences_timezone_check check (timezone ~ '^[A-Za-z]+/[A-Za-z_]+$')
);

-- Table projets
create table projets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  nom               text not null,
  ordre             integer not null default 0,
  type_identifiant  projet_identifiant not null default 'couleur',
  couleur           text,
  icone             text,
  actif             boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint projets_couleur_unique unique (user_id, couleur),
  constraint projets_icone_unique unique (user_id, icone),
  constraint projets_identifiant_check check (
    (type_identifiant = 'couleur' and couleur is not null and icone is null) or
    (type_identifiant = 'icone' and icone is not null and couleur is null)
  )
);

-- Table taches (projet_id nullable — décision 19.1)
create table taches (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  projet_id           uuid references projets(id) on delete set null,  -- nullable
  titre               text not null,
  notes               text,
  statut              statut_tache not null default 'a_qualifier',
  priorite            priorite_tache not null default 'moyenne',
  date_debut          date,
  date_echeance       timestamptz,
  date_cloture        timestamptz,
  responsable         text not null default 'Moi',
  avancement          integer not null default 0 check (avancement between 0 and 100),
  temps_estime_min    integer,
  recurrence_id       uuid,  -- FK ajoutée après création de recurrences
  predecesseur_id     uuid references taches(id) on delete set null,
  pre_caracterisee_ia boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Table recurrences (après taches pour la FK circulaire)
create table recurrences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  tache_mere_id   uuid not null references taches(id) on delete cascade,
  frequence       frequence_recurrence not null,
  jour_semaine    integer check (jour_semaine between 0 and 6),
  jour_mois       integer check (jour_mois between 1 and 31),
  actif           boolean not null default true,
  created_at      timestamptz not null default now(),
  constraint recurrence_hebdo_check check (
    frequence != 'hebdomadaire' or jour_semaine is not null
  ),
  constraint recurrence_mensuelle_check check (
    frequence != 'mensuelle' or jour_mois is not null
  )
);

-- Ajouter la FK recurrence_id sur taches maintenant que recurrences existe
alter table taches
  add constraint taches_recurrence_fk
  foreign key (recurrence_id) references recurrences(id) on delete set null;

-- Table jobs_notifications
create type type_notification as enum (
  'briefing_matin', 'qualification', 'relance_retards', 'alerte_seuil'
);
create type canal_notification as enum ('push', 'email');
create type statut_notification as enum ('planifiee', 'envoyee', 'echouee');

create table jobs_notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          type_notification not null,
  canal         canal_notification not null,
  statut        statut_notification not null default 'planifiee',
  planifiee_at  timestamptz not null,
  envoyee_at    timestamptz,
  erreur        text,
  user_timezone text,
  created_at    timestamptz not null default now()
);
