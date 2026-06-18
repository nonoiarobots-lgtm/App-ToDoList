import { NextResponse } from 'next/server';
import { clientAuthentifie, reponseErreur } from '@/lib/api-utils';
import { ensureTypesActivite } from '@/lib/types-activite-server';

// GET /api/types-activite — liste (sème les défauts au premier accès)
export async function GET() {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  const types = await ensureTypesActivite(supabase, user);
  return NextResponse.json({ types });
}

// POST /api/types-activite — ajout d'un type paramétrable
export async function POST(req: Request) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  let body: { nom?: string };
  try {
    body = await req.json();
  } catch {
    return reponseErreur('VALIDATION_ERROR', 'Corps JSON invalide.', 400);
  }
  if (!body.nom?.trim()) return reponseErreur('VALIDATION_ERROR', 'Le nom est requis.', 400);

  const { count } = await supabase
    .from('types_activite')
    .select('id', { count: 'exact', head: true });

  const { data, error } = await supabase
    .from('types_activite')
    .insert({ user_id: user.id, nom: body.nom.trim(), ordre: count ?? 0 })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return reponseErreur('VALIDATION_ERROR', 'Ce type d’activité existe déjà.', 400);
    }
    return reponseErreur('BDD_INDISPONIBLE', 'Sauvegarde échouée.', 503);
  }
  return NextResponse.json({ type: data }, { status: 201 });
}
