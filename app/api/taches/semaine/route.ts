import { NextResponse } from 'next/server';
import { clientAuthentifie, reponseErreur } from '@/lib/api-utils';
import { calculerStatutRetard } from '@/lib/logique-taches';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/taches/semaine?from=YYYY-MM-DD&to=YYYY-MM-DD
// Tâches non archivées dont l'échéance tombe dans la semaine (pour la matrice projets × jours).
export async function GET(req: Request) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (!from || !to || !DATE_REGEX.test(from) || !DATE_REGEX.test(to)) {
    return reponseErreur('VALIDATION_ERROR', 'Paramètres from/to requis (YYYY-MM-DD).', 400);
  }

  // Borne haute exclusive au lendemain de `to` pour couvrir toute la journée (timestamptz)
  const finExclusive = new Date(`${to}T00:00:00`);
  finExclusive.setDate(finExclusive.getDate() + 1);

  const { data, error } = await supabase
    .from('taches')
    .select('*, projet:projets(*)')
    .neq('statut', 'archivee')
    .gte('date_echeance', `${from}T00:00:00`)
    .lt('date_echeance', finExclusive.toISOString())
    .order('date_echeance', { ascending: true });

  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Données indisponibles.', 503);

  const taches = (data ?? []).map(t => ({ ...t, statut: calculerStatutRetard(t) }));
  return NextResponse.json({ taches });
}
