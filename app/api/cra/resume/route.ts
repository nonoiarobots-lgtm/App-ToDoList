import { NextResponse } from 'next/server';
import { clientAuthentifie, reponseErreur } from '@/lib/api-utils';
import { ensurePreferences } from '@/lib/preferences-server';
import {
  agregerParJour,
  ciblePeriode,
  totalMinutes,
  CIBLE_JOUR_DEFAUT_MIN,
} from '@/lib/logique-cra';
import type { Activite } from '@/types/activite';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/cra/resume?from=YYYY-MM-DD&to=YYYY-MM-DD
// Agrégats CRA d'une période : total, par jour, par type, par projet.
export async function GET(req: Request) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (!from || !to || !DATE_REGEX.test(from) || !DATE_REGEX.test(to)) {
    return reponseErreur('VALIDATION_ERROR', 'Paramètres from/to requis (YYYY-MM-DD).', 400);
  }

  const [{ data, error }, prefs] = await Promise.all([
    supabase
      .from('activites')
      .select('*, type_activite:types_activite(id, nom), projet:projets(*)')
      .gte('date_activite', from)
      .lte('date_activite', to)
      .order('date_activite'),
    ensurePreferences(supabase, user),
  ]);

  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Données indisponibles.', 503);

  const activites = (data ?? []) as Activite[];
  const total = totalMinutes(activites);
  const cibleJour = prefs?.cible_jour_min ?? CIBLE_JOUR_DEFAUT_MIN;

  // Par type
  const typesMap = new Map<string, { id: string; nom: string; total_min: number }>();
  for (const a of activites) {
    const id = a.type_activite?.id ?? 'sans-type';
    const nom = a.type_activite?.nom ?? 'Sans type';
    const e = typesMap.get(id) ?? { id, nom, total_min: 0 };
    e.total_min += a.duree_min;
    typesMap.set(id, e);
  }

  // Par projet
  const projetsMap = new Map<
    string,
    { projet_id: string; nom: string; couleur: string | null; icone: string | null; total_min: number }
  >();
  for (const a of activites) {
    const id = a.projet?.id ?? 'sans-projet';
    const e =
      projetsMap.get(id) ??
      {
        projet_id: id,
        nom: a.projet?.nom ?? 'Sans projet',
        couleur: a.projet?.couleur ?? null,
        icone: a.projet?.icone ?? null,
        total_min: 0,
      };
    e.total_min += a.duree_min;
    projetsMap.set(id, e);
  }

  const parJour = agregerParJour(activites);

  return NextResponse.json({
    from,
    to,
    total_min: total,
    cible_jour_min: cibleJour,
    cible_periode_min: ciblePeriode(from, to, cibleJour),
    jours_saisis: Object.values(parJour).filter(m => m > 0).length,
    par_jour: parJour,
    par_type: [...typesMap.values()].sort((a, b) => b.total_min - a.total_min),
    par_projet: [...projetsMap.values()].sort((a, b) => b.total_min - a.total_min),
    lignes: activites.map(a => ({
      date: a.date_activite,
      type: a.type_activite?.nom ?? 'Sans type',
      projet: a.projet?.nom ?? 'Sans projet',
      duree_min: a.duree_min,
      commentaire: a.commentaire ?? '',
    })),
  });
}
