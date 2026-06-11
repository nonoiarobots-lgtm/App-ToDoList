-- Index preferences
create index on preferences(user_id);

-- Index projets
create index on projets(user_id);
create index on projets(user_id, actif);

-- Index taches
create index on taches(user_id, statut);
create index on taches(user_id, projet_id);
create index on taches(user_id, date_echeance);
create index on taches(user_id, priorite);
create index on taches(user_id, statut, date_echeance)
  where statut in ('active', 'en_retard', 'en_attente_retour');
create index on taches(user_id, created_at)
  where statut = 'a_qualifier';
create index on taches(user_id, date_cloture)
  where statut = 'archivee';

-- Index recurrences
create index on recurrences(tache_mere_id);
create index on recurrences(user_id, actif);

-- Index jobs_notifications
create index on jobs_notifications(user_id, type, planifiee_at);
create index on jobs_notifications(statut, planifiee_at)
  where statut = 'planifiee';
