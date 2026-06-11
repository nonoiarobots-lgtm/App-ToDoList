-- Fonction updated_at générique
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger taches_updated_at before update on taches
  for each row execute function set_updated_at();
create trigger preferences_updated_at before update on preferences
  for each row execute function set_updated_at();
create trigger projets_updated_at before update on projets
  for each row execute function set_updated_at();

-- Archivage automatique → date_cloture
create or replace function set_date_cloture()
returns trigger as $$
begin
  if new.statut = 'archivee' and old.statut != 'archivee' then
    new.date_cloture = now();
    new.avancement = 100;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger taches_cloture before update on taches
  for each row execute function set_date_cloture();

-- Création tâche récurrente suivante
create or replace function creer_tache_recurrente()
returns trigger as $$
declare
  rec recurrences%rowtype;
  nouvelle_echeance timestamptz;
begin
  if new.statut = 'archivee'
    and old.statut != 'archivee'
    and new.recurrence_id is not null
  then
    select * into rec from recurrences
    where id = new.recurrence_id and actif = true;

    if found then
      nouvelle_echeance := case rec.frequence
        when 'quotidienne'  then new.date_echeance + interval '1 day'
        when 'hebdomadaire' then new.date_echeance + interval '7 days'
        when 'mensuelle'    then new.date_echeance + interval '1 month'
      end;

      insert into taches (
        user_id, projet_id, titre, notes, statut, priorite,
        date_echeance, responsable, temps_estime_min,
        recurrence_id, predecesseur_id, avancement
      ) values (
        new.user_id, new.projet_id, new.titre, new.notes,
        'active', new.priorite, nouvelle_echeance,
        new.responsable, new.temps_estime_min,
        new.recurrence_id, new.predecesseur_id, 0
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger taches_recurrence after update on taches
  for each row execute function creer_tache_recurrente();

-- Mise à jour statut en_retard (appelée par pg_cron)
create or replace function update_statuts_retard()
returns void as $$
begin
  update taches
  set statut = 'en_retard'
  where statut in ('active', 'en_attente_retour')
    and date_echeance < now();
end;
$$ language plpgsql;

-- Stub process_notifications — implémentation réelle en tranche ④
-- (lecture de jobs_notifications + déclenchement Edge Function push/email).
-- Le stub permet à la migration pg_cron de s'appliquer sans erreur.
create or replace function process_notifications()
returns void as $$
begin
  -- TODO tranche ④ : sélectionner les jobs 'planifiee' arrivés à échéance
  -- et appeler l'Edge Function d'envoi (Web Push, fallback Resend).
  null;
end;
$$ language plpgsql;
