import { NextResponse } from 'next/server';
import { clientAuthentifie, reponseErreur } from '@/lib/api-utils';
import { ensurePreferences } from '@/lib/preferences-server';
import { calculerNiveauAlerte } from '@/lib/logique-seuils';
import { calculerStatutRetard, statutACapture } from '@/lib/logique-taches';
import type { StatutTache, PrioriteTache } from '@/types/tache';

const STATUTS: StatutTache[] = ['a_qualifier', 'active', 'en_retard', 'en_attente_retour', 'archivee'];
const PRIORITES: PrioriteTache[] = ['haute', 'moyenne', 'basse', 'aucune'];

// GET /api/taches — liste + compteurs. Params : ?statut=...&projet=...
// Par défaut : toutes les tâches non archivées, triées par échéance.
export async function GET(req: Request) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  const url = new URL(req.url);
  const statut = url.searchParams.get('statut');
  const projet = url.searchParams.get('projet');

  let query = supabase
    .from('taches')
    .select('*, projet:projets(*)')
    .order('date_echeance', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (statut && STATUTS.includes(statut as StatutTache)) {
    query = query.eq('statut', statut as StatutTache);
  } else {
    query = query.neq('statut', 'archivee');
  }
  if (projet === 'sans-projet') {
    query = query.is('projet_id', null);
  } else if (projet) {
    query = query.eq('projet_id', projet);
  }

  const [{ data, error }, prefs] = await Promise.all([query, ensurePreferences(supabase, user)]);
  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Données indisponibles — réessaie dans quelques instants.', 503);

  // Statut affiché : retard calculé à la volée (pg_cron ne tourne qu'à minuit)
  const taches = (data ?? []).map(t => ({ ...t, statut: calculerStatutRetard(t) }));
  const nbAQualifier = taches.filter(t => t.statut === 'a_qualifier').length;
  const nbEnRetard = taches.filter(t => t.statut === 'en_retard').length;

  return NextResponse.json({
    data: taches,
    total: taches.length,
    nb_a_qualifier: nbAQualifier,
    nb_en_retard: nbEnRetard,
    alerte: calculerNiveauAlerte(nbAQualifier, prefs?.seuil_orange ?? 15, prefs?.seuil_rouge ?? 20),
  });
}

// POST /api/taches — création (capture rapide → statut a_qualifier)
export async function POST(req: Request) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  let body: {
    titre?: string;
    projet_id?: string | null;
    priorite?: PrioriteTache;
    date_echeance?: string | null;
    notes?: string | null;
    pre_caracterisee_ia?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return reponseErreur('VALIDATION_ERROR', 'Corps JSON invalide.', 400);
  }

  if (!body.titre?.trim()) {
    return reponseErreur('VALIDATION_ERROR', 'Le titre est requis.', 400);
  }
  if (body.priorite && !PRIORITES.includes(body.priorite)) {
    return reponseErreur('VALIDATION_ERROR', 'Priorité invalide.', 400);
  }

  const priorite = body.priorite ?? 'moyenne';
  const projet_id = body.projet_id ?? null;
  const date_echeance = body.date_echeance ?? null;

  const { data, error } = await supabase
    .from('taches')
    .insert({
      user_id: user.id,
      titre: body.titre.trim(),
      projet_id,
      priorite,
      date_echeance,
      notes: body.notes?.trim() || null,
      pre_caracterisee_ia: body.pre_caracterisee_ia ?? false,
      // Tâche déjà entièrement renseignée → 'active' ; sinon 'a_qualifier' (besoin point 2)
      statut: statutACapture({ projet_id, date_echeance, priorite }),
    })
    .select('*, projet:projets(*)')
    .single();

  if (error) return reponseErreur('BDD_INDISPONIBLE', 'Sauvegarde échouée.', 503);
  return NextResponse.json({ tache: data }, { status: 201 });
}
