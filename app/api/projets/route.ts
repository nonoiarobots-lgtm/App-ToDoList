import { NextResponse } from 'next/server';
import { clientAuthentifie, reponseErreur } from '@/lib/api-utils';
import { PALETTE_COULEURS, PALETTE_ICONES } from '@/lib/palette';

// GET /api/projets — liste + palette disponible (cadrage §13)
export async function GET() {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  const { data, error } = await supabase
    .from('projets')
    .select('*')
    .order('ordre')
    .order('created_at');

  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Données indisponibles.', 503);

  const projets = data ?? [];
  const couleursUtilisees = new Set(projets.map(p => p.couleur).filter(Boolean));
  const iconesUtilisees = new Set(projets.map(p => p.icone).filter(Boolean));

  return NextResponse.json({
    projets,
    palette: {
      couleurs: PALETTE_COULEURS.filter(c => !couleursUtilisees.has(c)),
      icones: PALETTE_ICONES.filter(i => !iconesUtilisees.has(i)),
    },
  });
}

// POST /api/projets — création. Couleur auto-attribuée si non fournie ;
// bascule sur les icônes quand la palette couleurs est épuisée.
export async function POST(req: Request) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  let body: { nom?: string; couleur?: string; icone?: string };
  try {
    body = await req.json();
  } catch {
    return reponseErreur('VALIDATION_ERROR', 'Corps JSON invalide.', 400);
  }
  if (!body.nom?.trim()) return reponseErreur('VALIDATION_ERROR', 'Le nom est requis.', 400);

  const { data: existants } = await supabase.from('projets').select('couleur, icone');
  const couleursUtilisees = new Set((existants ?? []).map(p => p.couleur).filter(Boolean));
  const iconesUtilisees = new Set((existants ?? []).map(p => p.icone).filter(Boolean));

  let couleur = body.couleur ?? null;
  let icone = body.icone ?? null;

  if (!couleur && !icone) {
    couleur = PALETTE_COULEURS.find(c => !couleursUtilisees.has(c)) ?? null;
    if (!couleur) icone = PALETTE_ICONES.find(i => !iconesUtilisees.has(i)) ?? null;
    if (!couleur && !icone) {
      return reponseErreur('VALIDATION_ERROR', 'Palette épuisée — supprime un projet inutilisé.', 400);
    }
  }
  if (couleur && couleursUtilisees.has(couleur)) {
    return reponseErreur('COULEUR_DEJA_UTILISEE', 'Cette couleur est déjà attribuée.', 400);
  }
  if (icone && iconesUtilisees.has(icone)) {
    return reponseErreur('ICONE_DEJA_UTILISEE', 'Cette icône est déjà attribuée.', 400);
  }

  const { data, error } = await supabase
    .from('projets')
    .insert({
      user_id: user.id,
      nom: body.nom.trim(),
      type_identifiant: couleur ? 'couleur' : 'icone',
      couleur: couleur,
      icone: couleur ? null : icone,
      ordre: (existants?.length ?? 0) + 1,
    })
    .select('*')
    .single();

  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Sauvegarde échouée.', 503);
  return NextResponse.json({ projet: data }, { status: 201 });
}
