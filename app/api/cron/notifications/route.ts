import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { calculerStatutRetard, joursDeRetard } from '@/lib/logique-taches';
import {
  dateDansFuseau,
  estDue,
  hhmmEnMinutes,
  minutesDuJour,
} from '@/lib/logique-notifications';
import { emailBriefing, emailRelance, type TacheEmail } from '@/lib/emails';
import { envoyerEmail } from '@/lib/mailer';
import type { StatutTache, PrioriteTache } from '@/types/tache';

type TypeNotif = Database['public']['Enums']['type_notification'];

interface TacheRow {
  titre: string;
  priorite: PrioriteTache;
  statut: StatutTache;
  date_echeance: string | null;
  projet: { nom: string } | null;
}

// Types de rappels actifs (le 12h "qualification" est volontairement désactivé pour l'instant)
const RAPPELS: { type: TypeNotif; champHeure: 'heure_briefing' | 'heure_retards' }[] = [
  { type: 'briefing_matin', champHeure: 'heure_briefing' },
  { type: 'relance_retards', champHeure: 'heure_retards' },
];

// GET /api/cron/notifications — appelé toutes les 5 min par pg_cron (via pg_net).
// Protégé par CRON_SECRET. Envoie les rappels dus, en une fois par jour et par type.
export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app-taches-bay.vercel.app';
  const now = new Date();

  // Mode test : ?force=briefing_matin ou ?force=relance_retards envoie tout de suite,
  // en ignorant l'heure et l'idempotence (toujours protégé par CRON_SECRET).
  const force = new URL(req.url).searchParams.get('force') as TypeNotif | null;

  const { data: prefs, error } = await admin
    .from('preferences')
    .select('user_id, prenom, heure_briefing, heure_retards, timezone');
  if (error) return NextResponse.json({ error: 'prefs', detail: error.message }, { status: 503 });

  const envoyes: string[] = [];

  for (const pref of prefs ?? []) {
    const tz = pref.timezone || 'Europe/Paris';
    const nowMin = minutesDuJour(now, tz);
    const todayLocal = dateDansFuseau(now, tz);

    const dus = force
      ? RAPPELS.filter(r => r.type === force)
      : RAPPELS.filter(r => estDue(hhmmEnMinutes(pref[r.champHeure]), nowMin));
    if (dus.length === 0) continue;

    for (const rappel of dus) {
      // Idempotence : déjà envoyé dans les 12 dernières heures ? (ignorée en mode test)
      if (!force) {
        const depuis = new Date(now.getTime() - 12 * 3600_000).toISOString();
        const { count } = await admin
          .from('jobs_notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', pref.user_id)
          .eq('type', rappel.type)
          .eq('statut', 'envoyee')
          .gte('planifiee_at', depuis);
        if ((count ?? 0) > 0) continue;
      }

      try {
        const { data: userData } = await admin.auth.admin.getUserById(pref.user_id);
        const email = userData.user?.email;
        if (!email) throw new Error('email utilisateur introuvable');

        const { data: tachesData } = await admin
          .from('taches')
          .select('titre, priorite, statut, date_echeance, projet:projets(nom)')
          .eq('user_id', pref.user_id)
          .neq('statut', 'archivee')
          .not('date_echeance', 'is', null);
        const taches = (tachesData ?? []) as unknown as TacheRow[];

        const toEmail = (t: TacheRow): TacheEmail => ({
          titre: t.titre,
          projetNom: t.projet?.nom ?? 'Sans projet',
          priorite: t.priorite,
          joursRetard: t.date_echeance ? joursDeRetard(t.date_echeance, now) : 0,
        });

        const enRetard = taches.filter(t => calculerStatutRetard(t, now) === 'en_retard');

        let contenu;
        if (rappel.type === 'briefing_matin') {
          const duJour = taches.filter(
            t => t.date_echeance && dateDansFuseau(new Date(t.date_echeance), tz) === todayLocal
          );
          // Tâches du jour + en retard (dédupliquées par titre + échéance)
          const map = new Map<string, TacheRow>();
          for (const t of [...enRetard, ...duJour]) map.set(`${t.titre}|${t.date_echeance}`, t);
          contenu = emailBriefing(pref.prenom, `${appUrl}/backlog`, [...map.values()].map(toEmail));
        } else {
          contenu = emailRelance(pref.prenom, `${appUrl}/backlog`, enRetard.map(toEmail));
        }

        await envoyerEmail({ to: email, sujet: contenu.sujet, html: contenu.html, text: contenu.text });

        await admin.from('jobs_notifications').insert({
          user_id: pref.user_id,
          type: rappel.type,
          canal: 'email',
          statut: 'envoyee',
          planifiee_at: now.toISOString(),
          envoyee_at: now.toISOString(),
          user_timezone: tz,
        });
        envoyes.push(`${rappel.type}→${email}`);
      } catch (e) {
        await admin.from('jobs_notifications').insert({
          user_id: pref.user_id,
          type: rappel.type,
          canal: 'email',
          statut: 'echouee',
          planifiee_at: now.toISOString(),
          erreur: e instanceof Error ? e.message : 'erreur inconnue',
          user_timezone: tz,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, at: now.toISOString(), envoyes });
}
