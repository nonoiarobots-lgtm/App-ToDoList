import { NextResponse } from 'next/server';
import { clientAuthentifie, reponseErreur } from '@/lib/api-utils';
import type { Database } from '@/lib/database.types';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/activites/[id] — modifier une activité
export async function PATCH(req: Request, { params }: Params) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reponseErreur('VALIDATION_ERROR', 'Corps JSON invalide.', 400);
  }

  const maj: Record<string, unknown> = {};
  for (const champ of ['date_activite', 'type_activite_id', 'projet_id', 'duree_min', 'commentaire']) {
    if (champ in body) maj[champ] = body[champ];
  }
  if (
    maj.duree_min !== undefined &&
    (typeof maj.duree_min !== 'number' || maj.duree_min <= 0 || maj.duree_min % 15 !== 0)
  ) {
    return reponseErreur('VALIDATION_ERROR', 'La durée doit être un multiple de 15 minutes.', 400);
  }
  if (Object.keys(maj).length === 0) {
    return reponseErreur('VALIDATION_ERROR', 'Aucun champ à mettre à jour.', 400);
  }

  const { data, error } = await supabase
    .from('activites')
    .update(maj as Database['public']['Tables']['activites']['Update'])
    .eq('id', id)
    .select('*, type_activite:types_activite(id, nom), projet:projets(*)')
    .maybeSingle();

  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Sauvegarde échouée.', 503);
  if (!data) return reponseErreur('ACTIVITE_NOT_FOUND', 'Activité introuvable.', 404);
  return NextResponse.json({ activite: data });
}

// DELETE /api/activites/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  const { id } = await params;
  const { error } = await supabase.from('activites').delete().eq('id', id);
  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Suppression échouée.', 503);
  return NextResponse.json({ ok: true });
}
