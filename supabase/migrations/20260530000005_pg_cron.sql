-- Mise à jour quotidienne des statuts en retard (minuit UTC)
select cron.schedule(
  'update-statuts-retard',
  '0 0 * * *',
  'select update_statuts_retard()'
);

-- Scheduling des notifications (toutes les 5 minutes)
select cron.schedule(
  'process-notifications',
  '*/5 * * * *',
  'select process_notifications()'
);
