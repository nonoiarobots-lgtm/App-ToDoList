import { NextResponse } from 'next/server';
import { clientAuthentifie, reponseErreur } from '@/lib/api-utils';
import { ensurePreferences } from '@/lib/preferences-server';
import { decompteMin, totalMinutes, CIBLE_JOUR_DEFAUT_MIN } from '@/lib/logique-cra';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/activites?date=YYYY-MM-DD — activités du jour + total + décompte
export async function GET(req: Request) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  const date = new URL(req.url).searchParams.get('date');
  if (!date || !DATE_REGEX.test(date)) {
    return reponseErreur('VALIDATION_ERROR', 'Paramètre date requis (YYYY-MM-DD).', 400);
  }

  const [{ data, error }, prefs] = await Promise.all([
    supabase
      .from('activites')
      .select('*, type_activite:types_activite(id, nom), projet:projets(*)')
      .eq('date_activite', date)
      .order('created_at'),
    ensurePreferences(supabase, user),
  ]);

  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Données indisponibles.', 503);

  const activites = data ?? [];
  const total = totalMinutes(activites);
  const cible = prefs?.cible_jour_min ?? CIBLE_JOUR_DEFAUT_MIN;

  return NextResponse.json({
    activites,
    total_min: total,
    cible_min: cible,
    decompte_min: decompteMin(total, cible),
  });
}

// POST /api/activites — saisie d'une activité (durée au quart d'heure)
export async function POST(req: Request) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  let body: {
    date_activite?: string;
    type_activite_id?: string | null;
    projet_id?: string | null;
    duree_min?: number;
    commentaire?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return reponseErreur('VALIDATION_ERROR', 'Corps JSON invalide.', 400);
  }

  if (!body.date_activite || !DATE_REGEX.test(body.date_activite)) {
    return reponseErreur('VALIDATION_ERROR', 'Date invalide (YYYY-MM-DD).', 400);
  }
  if (
    typeof body.duree_min !== 'number' ||
    body.duree_min <= 0 ||
    body.duree_min % 15 !== 0
  ) {
    return reponseErreur('VALIDATION_ERROR', 'La durée doit être un multiple de 15 minutes.', 400);
  }

  const { data, error } = await supabase
    .from('activites')
    .insert({
      user_id: user.id,
      date_activite: body.date_activite,
      type_activite_id: body.type_activite_id ?? null,
      projet_id: body.projet_id ?? null,
      duree_min: body.duree_min,
      commentaire: body.commentaire?.trim() || null,
    })
    .select('*, type_activite:types_activite(id, nom), projet:projets(*)')
    .single();

  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Sauvegarde échouée.', 503);
  return NextResponse.json({ activite: data }, { status: 201 });
}
