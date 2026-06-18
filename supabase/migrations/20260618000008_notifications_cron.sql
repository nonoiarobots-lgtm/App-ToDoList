-- Rappels email (besoin point 6) — infrastructure de planification.
-- Architecture : pg_cron (toutes les 5 min) → route Vercel /api/cron/notifications
-- (via pg_net), qui vérifie l'heure locale et envoie les emails dus via Gmail SMTP.
--
-- L'extension est activée ici. Le job cron lui-même contient le CRON_SECRET :
-- il est donc créé MANUELLEMENT dans le SQL Editor (hors git) — voir le guide de
-- déploiement. SQL à exécuter (en remplaçant les deux valeurs) :
--
--   select cron.unschedule('process-notifications');  -- retire l'ancien stub
--   select cron.schedule(
--     'notifs-email', '*/5 * * * *',
--     $$ select net.http_get(
--          url := 'https://app-taches-bay.vercel.app/api/cron/notifications',
--          headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
--        ); $$
--   );

-- pg_net dans le schéma dédié `extensions` (pas `public` — advisor sécurité 0014)
create extension if not exists pg_net with schema extensions;
