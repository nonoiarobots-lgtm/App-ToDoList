-- Correctifs issus de l'audit du 11/06/2026 (advisors Supabase)

-- 1. Sécurité : figer le search_path des fonctions (lint 0011)
alter function set_updated_at() set search_path = public;
alter function set_date_cloture() set search_path = public;
alter function creer_tache_recurrente() set search_path = public;
alter function update_statuts_retard() set search_path = public;
alter function process_notifications() set search_path = public;

-- 2. Performance : auth.uid() évalué une fois par requête au lieu d'une fois
--    par ligne dans les politiques RLS (lint 0003)
drop policy "preferences_user" on preferences;
drop policy "projets_user" on projets;
drop policy "taches_user" on taches;
drop policy "recurrences_user" on recurrences;
drop policy "jobs_user" on jobs_notifications;

create policy "preferences_user" on preferences for all using ((select auth.uid()) = user_id);
create policy "projets_user" on projets for all using ((select auth.uid()) = user_id);
create policy "taches_user" on taches for all using ((select auth.uid()) = user_id);
create policy "recurrences_user" on recurrences for all using ((select auth.uid()) = user_id);
create policy "jobs_user" on jobs_notifications for all using ((select auth.uid()) = user_id);

-- 3. Performance : index couvrant les clés étrangères de taches (lint 0001)
--    Les index composites (user_id, ...) ne couvrent pas les lookups FK seuls
--    (cascades on delete set null).
create index on taches(projet_id);
create index on taches(predecesseur_id);
create index on taches(recurrence_id);
