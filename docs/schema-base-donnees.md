# Schéma de base de données — Outil personnel de gestion de tâches
**Version 2 — Suppression du champ login (cadrage §19.5)**
*Dernière mise à jour : 11 juin 2026*

---

## Vue d'ensemble

```
users
  └── projets
        └── taches
              ├── taches (prédécesseur — self-join)
              └── recurrences
preferences (1-1 avec users)
```

6 tables au total. Toutes protégées par Row Level Security (RLS) Supabase — un utilisateur ne voit que ses propres données.

---

## Table 1 — users

Gérée nativement par **Supabase Auth**. On ne la recrée pas — on l'étend via la table `preferences`.

| Colonne | Type | Notes |
|---|---|---|
| id | uuid | Clé primaire (généré par Supabase Auth) |
| email | text | Unique, géré par Supabase Auth |
| created_at | timestamptz | Automatique |

---

## Table 2 — preferences

Extension du profil utilisateur. Relation 1-1 avec `users`.

```sql
create table preferences (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  prenom       text not null,

  -- Horaires notifications (stockés en heure locale HH:MM)
  heure_briefing      time not null default '08:00',
  heure_qualification time not null default '12:00',
  heure_retards       time not null default '18:00',

  -- Seuils d'alerte (configurables)
  seuil_orange integer not null default 15,
  seuil_rouge  integer not null default 20,

  -- Push notifications
  push_subscription jsonb, -- objet WebPushSubscription sérialisé

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint preferences_user_unique unique (user_id)
);
```

**Index**
```sql
create index on preferences(user_id);
```

**RLS**
```sql
alter table preferences enable row level security;
create policy "user voit ses propres préférences"
  on preferences for all
  using (auth.uid() = user_id);
```

---

## Table 3 — projets

Liste fermée des projets de l'utilisateur.

```sql
create type projet_identifiant as enum (
  'couleur', 'icone'
);

create table projets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  nom          text not null,
  ordre        integer not null default 0,  -- pour le tri manuel

  -- Identifiant visuel : couleur hex OU icône emoji (jamais les deux)
  type_identifiant projet_identifiant not null default 'couleur',
  couleur      text,   -- ex: '#4a9eff' — null si type = icone
  icone        text,   -- ex: '🏠'     — null si type = couleur

  actif        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Une couleur ou icône ne peut pas être utilisée deux fois par le même user
  constraint projets_couleur_unique unique (user_id, couleur),
  constraint projets_icone_unique   unique (user_id, icone),
  -- Exactement un des deux doit être renseigné
  constraint projets_identifiant_check check (
    (type_identifiant = 'couleur' and couleur is not null and icone is null) or
    (type_identifiant = 'icone'  and icone  is not null and couleur is null)
  )
);
```

**Index**
```sql
create index on projets(user_id);
create index on projets(user_id, actif);
```

**RLS**
```sql
alter table projets enable row level security;
create policy "user voit ses propres projets"
  on projets for all
  using (auth.uid() = user_id);
```

---

## Table 4 — recurrences

Configuration de récurrence. Relation 1-1 avec une tâche "modèle" (la tâche mère).

```sql
create type frequence_recurrence as enum (
  'quotidienne', 'hebdomadaire', 'mensuelle'
);

create table recurrences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  tache_mere_id   uuid not null references taches(id) on delete cascade,

  frequence       frequence_recurrence not null,

  -- Hebdomadaire : jour de la semaine (0=lundi, 6=dimanche)
  jour_semaine    integer check (jour_semaine between 0 and 6),

  -- Mensuelle : jour du mois (1-31)
  jour_mois       integer check (jour_mois between 1 and 31),

  -- Contrôle de cohérence
  constraint recurrence_hebdo_check check (
    frequence != 'hebdomadaire' or jour_semaine is not null
  ),
  constraint recurrence_mensuelle_check check (
    frequence != 'mensuelle' or jour_mois is not null
  ),

  actif           boolean not null default true,
  created_at      timestamptz not null default now()
);
```

**Index**
```sql
create index on recurrences(tache_mere_id);
create index on recurrences(user_id, actif);
```

---

## Table 5 — taches

Table centrale. Contient toutes les tâches, tous statuts confondus.

```sql
create type statut_tache as enum (
  'a_qualifier',
  'active',
  'en_retard',
  'en_attente_retour',
  'archivee'
);

create type priorite_tache as enum (
  'haute', 'moyenne', 'basse', 'aucune'
);

create table taches (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  projet_id         uuid references projets(id) on delete set null,

  -- Contenu
  titre             text not null,
  notes             text,
  statut            statut_tache not null default 'a_qualifier',
  priorite          priorite_tache not null default 'aucune',

  -- Planification
  date_debut        date,
  date_echeance     timestamptz,
  date_cloture      timestamptz,     -- renseignée automatiquement à l'archivage

  -- Responsable
  responsable       text not null default 'Moi',

  -- Avancement
  avancement        integer not null default 0
                    check (avancement between 0 and 100),

  -- Temps
  temps_estime_min  integer,         -- en minutes (converti depuis h ou min à la saisie)

  -- Récurrence
  recurrence_id     uuid references recurrences(id) on delete set null,
  -- Si cette tâche a été créée par une récurrence, on garde la référence
  -- pour pouvoir retracer la chaîne

  -- Prédécesseur (mode avancé)
  predecesseur_id   uuid references taches(id) on delete set null,

  -- Métadonnées IA
  pre_caracterisee_ia boolean not null default false,
  -- true = pré-remplie par Claude API, en attente de validation utilisateur

  -- Horodatages
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
```

**Index**
```sql
-- Requêtes fréquentes backlog
create index on taches(user_id, statut);
create index on taches(user_id, projet_id);
create index on taches(user_id, date_echeance);
create index on taches(user_id, priorite);

-- Vue briefing matin : tâches du jour + en retard
create index on taches(user_id, statut, date_echeance)
  where statut in ('active', 'en_retard', 'en_attente_retour');

-- File à qualifier
create index on taches(user_id, created_at)
  where statut = 'a_qualifier';

-- Archives
create index on taches(user_id, date_cloture)
  where statut = 'archivee';
```

**RLS**
```sql
alter table taches enable row level security;
create policy "user voit ses propres tâches"
  on taches for all
  using (auth.uid() = user_id);
```

---

## Table 6 — jobs_notifications

Suivi des notifications envoyées. Permet le fallback email et d'éviter les doublons.

```sql
create type type_notification as enum (
  'briefing_matin', 'qualification', 'relance_retards',
  'alerte_seuil'
);

create type canal_notification as enum (
  'push', 'email'
);

create type statut_notification as enum (
  'planifiee', 'envoyee', 'echouee'
);

create table jobs_notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         type_notification not null,
  canal        canal_notification not null,
  statut       statut_notification not null default 'planifiee',
  planifiee_at timestamptz not null,
  envoyee_at   timestamptz,
  erreur       text,
  created_at   timestamptz not null default now()
);
```

**Index**
```sql
create index on jobs_notifications(user_id, type, planifiee_at);
create index on jobs_notifications(statut, planifiee_at)
  where statut = 'planifiee';
```

---

## Triggers automatiques

### Mise à jour de updated_at

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger taches_updated_at
  before update on taches
  for each row execute function set_updated_at();

create trigger preferences_updated_at
  before update on preferences
  for each row execute function set_updated_at();

create trigger projets_updated_at
  before update on projets
  for each row execute function set_updated_at();
```

### Archivage automatique au cochage

Quand `avancement` passe à 100 ou `statut` passe à `archivee`, `date_cloture` est renseignée.

```sql
create or replace function set_date_cloture()
returns trigger as $$
begin
  if new.statut = 'archivee' and old.statut != 'archivee' then
    new.date_cloture = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger taches_cloture
  before update on taches
  for each row execute function set_date_cloture();
```

### Mise à jour automatique du statut "en_retard"

Gérée par pg_cron (voir section Jobs) — pas en trigger pour éviter la charge à chaque lecture.

### Création de la tâche suivante après archivage d'une récurrente

```sql
create or replace function creer_tache_recurrente()
returns trigger as $$
declare
  rec recurrences%rowtype;
  nouvelle_echeance timestamptz;
begin
  -- Seulement si la tâche archivée a une récurrence
  if new.statut = 'archivee'
    and old.statut != 'archivee'
    and new.recurrence_id is not null
  then
    select * into rec from recurrences where id = new.recurrence_id and actif = true;

    if found then
      -- Calcul de la prochaine échéance
      nouvelle_echeance := case rec.frequence
        when 'quotidienne'   then new.date_echeance + interval '1 day'
        when 'hebdomadaire'  then new.date_echeance + interval '7 days'
        when 'mensuelle'     then new.date_echeance + interval '1 month'
      end;

      -- Création de la nouvelle tâche
      insert into taches (
        user_id, projet_id, titre, notes, statut, priorite,
        date_echeance, responsable, temps_estime_min, recurrence_id
      ) values (
        new.user_id, new.projet_id, new.titre, new.notes,
        'active', new.priorite,
        nouvelle_echeance, new.responsable,
        new.temps_estime_min, new.recurrence_id
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger taches_recurrence
  after update on taches
  for each row execute function creer_tache_recurrente();
```

---

## Jobs pg_cron

### Mise à jour quotidienne des statuts "en_retard"

```sql
-- Tous les jours à minuit
select cron.schedule(
  'update-statuts-retard',
  '0 0 * * *',
  $$
    update taches
    set statut = 'en_retard'
    where statut = 'active'
      and date_echeance < now();
  $$
);
```

### Envoi des notifications quotidiennes

Les 3 jobs suivants créent les entrées dans `jobs_notifications`. Une Supabase Edge Function les traite ensuite (Web Push + Resend).

```sql
-- Briefing matin : créer les jobs pour chaque user selon son heure configurée
-- Géré via Edge Function déclenchée par pg_cron à intervalles réguliers
-- (voir section API)

select cron.schedule('notifications-briefing',    '*/5 * * * *', 'select process_notifications()');
select cron.schedule('notifications-qualification','*/5 * * * *', 'select process_notifications()');
select cron.schedule('notifications-retards',      '*/5 * * * *', 'select process_notifications()');
```

---

## Requêtes clés

### Briefing matin — tâches du jour + en retard par projet

```sql
select
  p.id as projet_id,
  p.nom as projet_nom,
  p.couleur,
  p.icone,
  count(*) as nb_taches,
  count(*) filter (where t.statut = 'en_retard') as nb_retard,
  sum(t.temps_estime_min) as temps_total_min,
  json_agg(
    json_build_object(
      'id', t.id,
      'titre', t.titre,
      'statut', t.statut,
      'priorite', t.priorite,
      'date_echeance', t.date_echeance,
      'avancement', t.avancement,
      'pre_caracterisee_ia', t.pre_caracterisee_ia
    )
    order by
      case t.statut when 'en_retard' then 0 else 1 end,
      case t.priorite when 'haute' then 0 when 'moyenne' then 1 when 'basse' then 2 else 3 end
  ) as taches
from taches t
join projets p on p.id = t.projet_id
where t.user_id = $1
  and t.statut in ('active', 'en_retard', 'en_attente_retour')
  and (
    t.date_echeance::date = current_date  -- tâches du jour
    or t.statut = 'en_retard'             -- retards
  )
group by p.id, p.nom, p.couleur, p.icone
order by count(*) desc;  -- projets triés par volume décroissant
```

### Vue semaine — matrice projets × jours

```sql
select
  p.id as projet_id,
  p.nom,
  p.couleur,
  p.icone,
  t.date_echeance::date as jour,
  count(*) as nb_taches,
  json_agg(json_build_object('id', t.id, 'titre', t.titre, 'priorite', t.priorite)) as taches
from taches t
join projets p on p.id = t.projet_id
where t.user_id = $1
  and t.statut in ('active', 'en_retard', 'en_attente_retour')
  and t.date_echeance::date between $2 and $3  -- lundi → dimanche
group by p.id, p.nom, p.couleur, p.icone, t.date_echeance::date
order by p.ordre, jour;
```

### File à qualifier — triée par date de capture

```sql
select * from taches
where user_id = $1
  and statut = 'a_qualifier'
order by created_at asc;
```

### Relance retards — tâches en retard + en attente de retour

```sql
select t.*, p.nom as projet_nom, p.couleur, p.icone
from taches t
left join projets p on p.id = t.projet_id
where t.user_id = $1
  and t.statut in ('en_retard', 'en_attente_retour')
  and (t.date_echeance is null or t.date_echeance < now())
order by
  case t.statut when 'en_retard' then 0 else 1 end,
  t.date_echeance asc;
```

---

## Résumé du schéma

| Table | Rôle | Lignes estimées V1 |
|---|---|---|
| auth.users | Compte utilisateur | 1 |
| preferences | Profil + paramètres | 1 |
| projets | Liste des projets | 3 à 5 |
| recurrences | Config récurrences | 5 à 20 |
| taches | Toutes les tâches (actives + archivées) | 500 à 2000 |
| jobs_notifications | Historique notifications | 100 à 500/mois |

Volume très faible — le plan gratuit Supabase (500MB) est largement suffisant pour plusieurs années d'usage.

---

## Prochaine étape

- API principales (endpoints, logique métier)
- Prompt engineering Claude API

---

## Mises à jour post-analyse critique

### Projet nullable

`projet_id` est nullable sur la table `taches`. La contrainte SQL est allégée :

```sql
-- Avant
projet_id uuid references projets(id) on delete set null,

-- Après (inchangé en SQL, mais la contrainte applicative "obligatoire" est supprimée)
-- projet_id reste nullable — une tâche sans projet est valide à tous les statuts
```

Les requêtes du briefing et du backlog doivent gérer le cas `projet_id IS NULL` :

```sql
-- Ajout du groupe "Sans projet" dans la requête briefing
select
  coalesce(p.id::text, 'sans-projet') as projet_id,
  coalesce(p.nom, 'Sans projet') as projet_nom,
  coalesce(p.couleur, '#555555') as couleur,
  p.icone,
  count(*) as nb_taches,
  ...
from taches t
left join projets p on p.id = t.projet_id  -- LEFT JOIN au lieu de JOIN
where t.user_id = $1
  and t.statut in ('active', 'en_retard', 'en_attente_retour')
  and (t.date_echeance::date = current_date or t.statut = 'en_retard')
group by coalesce(p.id::text, 'sans-projet'), coalesce(p.nom, 'Sans projet'), p.couleur, p.icone
order by count(*) desc;
```

### Fuseau horaire

Ajout du champ `timezone` dans `preferences` :

```sql
alter table preferences
  add column timezone text not null default 'Europe/Paris';
```

Contrainte de validation :

```sql
alter table preferences
  add constraint preferences_timezone_check
  check (timezone ~ '^[A-Za-z]+/[A-Za-z_]+$');
```

Le scheduling pg_cron est adapté pour calculer l'heure UTC :

```sql
-- Insertion des jobs en tenant compte de la timezone utilisateur
insert into jobs_notifications (user_id, type, canal, planifiee_at)
select
  p.user_id,
  'briefing_matin',
  'push',
  -- Convertit l'heure locale en UTC selon la timezone de l'utilisateur
  (current_date::text || ' ' || p.heure_briefing::text)::timestamptz
    at time zone p.timezone
from preferences p
where not exists (
  select 1 from jobs_notifications j
  where j.user_id = p.user_id
    and j.type = 'briefing_matin'
    and j.planifiee_at::date = current_date
);
```

### Table jobs_notifications — ajout timezone

```sql
alter table jobs_notifications
  add column user_timezone text;
-- Stocké pour debug et audit des envois
```
