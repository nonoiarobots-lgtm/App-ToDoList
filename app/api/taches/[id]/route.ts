import { NextResponse } from 'next/server';
import { clientAuthentifie, reponseErreur } from '@/lib/api-utils';
import type { Database } from '@/lib/database.types';
import type { StatutTache, PrioriteTache } from '@/types/tache';

const STATUTS: StatutTache[] = ['a_qualifier', 'active', 'en_retard', 'en_attente_retour', 'archivee'];
const PRIORITES: PrioriteTache[] = ['haute', 'moyenne', 'basse', 'aucune'];

type Params = { params: Promise<{ id: string }> };

// GET /api/taches/[id]
export async function GET(_req: Request, { params }: Params) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  const { id } = await params;
  const { data, error } = await supabase
    .from('taches')
    .select('*, projet:projets(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Données indisponibles.', 503);
  if (!data) return reponseErreur('TACHE_NOT_FOUND', 'Tâche introuvable.', 404);
  return NextResponse.json({ tache: data });
}

// PATCH /api/taches/[id] — mise à jour partielle (qualification, clôture, report...)
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

  // Whitelist des champs modifiables
  const maj: Record<string, unknown> = {};
  for (const champ of [
    'titre',
    'projet_id',
    'priorite',
    'statut',
    'date_debut',
    'date_echeance',
    'responsable',
    'avancement',
    'temps_estime_min',
    'notes',
  ]) {
    if (champ in body) maj[champ] = body[champ];
  }

  if (typeof maj.titre === 'string' && !maj.titre.trim()) {
    return reponseErreur('VALIDATION_ERROR', 'Le titre ne peut pas être vide.', 400);
  }
  if (maj.statut !== undefined && !STATUTS.includes(maj.statut as StatutTache)) {
    return reponseErreur('VALIDATION_ERROR', 'Statut invalide.', 400);
  }
  if (maj.priorite !== undefined && !PRIORITES.includes(maj.priorite as PrioriteTache)) {
    return reponseErreur('VALIDATION_ERROR', 'Priorité invalide.', 400);
  }
  if (
    maj.avancement !== undefined &&
    (typeof maj.avancement !== 'number' || maj.avancement < 0 || maj.avancement > 100)
  ) {
    return reponseErreur('VALIDATION_ERROR', "L'avancement doit être entre 0 et 100.", 400);
  }
  if (Object.keys(maj).length === 0) {
    return reponseErreur('VALIDATION_ERROR', 'Aucun champ à mettre à jour.', 400);
  }

  const { data, error } = await supabase
    .from('taches')
    .update(maj as Database['public']['Tables']['taches']['Update'])
    .eq('id', id)
    .select('*, projet:projets(*)')
    .maybeSingle();

  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Sauvegarde échouée.', 503);
  if (!data) return reponseErreur('TACHE_NOT_FOUND', 'Tâche introuvable.', 404);
  return NextResponse.json({ tache: data });
}

// DELETE /api/taches/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  const { id } = await params;
  const { error } = await supabase.from('taches').delete().eq('id', id);
  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Suppression échouée.', 503);
  return NextResponse.json({ ok: true });
}
