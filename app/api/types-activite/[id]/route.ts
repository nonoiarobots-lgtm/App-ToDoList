import { NextResponse } from 'next/server';
import { clientAuthentifie, reponseErreur } from '@/lib/api-utils';
import type { Database } from '@/lib/database.types';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/types-activite/[id] — renommer ou (dés)activer
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
  for (const champ of ['nom', 'ordre', 'actif']) {
    if (champ in body) maj[champ] = body[champ];
  }
  if (typeof maj.nom === 'string' && !maj.nom.trim()) {
    return reponseErreur('VALIDATION_ERROR', 'Le nom ne peut pas être vide.', 400);
  }
  if (Object.keys(maj).length === 0) {
    return reponseErreur('VALIDATION_ERROR', 'Aucun champ à mettre à jour.', 400);
  }

  const { data, error } = await supabase
    .from('types_activite')
    .update(maj as Database['public']['Tables']['types_activite']['Update'])
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return reponseErreur('VALIDATION_ERROR', 'Ce type d’activité existe déjà.', 400);
    }
    return reponseErreur('BDD_INDISPONIBLE', 'Sauvegarde échouée.', 503);
  }
  if (!data) return reponseErreur('TYPE_ACTIVITE_NOT_FOUND', 'Type introuvable.', 404);
  return NextResponse.json({ type: data });
}

// DELETE /api/types-activite/[id] — les activités liées passent à type null (on delete set null)
export async function DELETE(_req: Request, { params }: Params) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  const { id } = await params;
  const { error } = await supabase.from('types_activite').delete().eq('id', id);
  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Suppression échouée.', 503);
  return NextResponse.json({ ok: true });
}
