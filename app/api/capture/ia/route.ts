import { NextResponse } from 'next/server';
import { clientAuthentifie, reponseErreur } from '@/lib/api-utils';
import { capturerTachesIA } from '@/lib/claude-capture';

// POST /api/capture/ia — découpage et pré-caractérisation d'une dictée (Claude Haiku 4.5)
export async function POST(req: Request) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  let body: { texte?: string };
  try {
    body = await req.json();
  } catch {
    return reponseErreur('VALIDATION_ERROR', 'Corps JSON invalide.', 400);
  }
  if (typeof body.texte !== 'string' || !body.texte.trim()) {
    return reponseErreur('VALIDATION_ERROR', 'Le texte dicté est requis.', 400);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return reponseErreur('NOT_IMPLEMENTED', 'Capture IA non configurée (clé API manquante).', 503);
  }

  const { data: projets } = await supabase.from('projets').select('id, nom').eq('actif', true);
  const dateReference = new Date().toISOString().slice(0, 10);
  const debut = Date.now();

  try {
    const taches = await capturerTachesIA(body.texte, projets ?? [], dateReference);
    return NextResponse.json({ taches, duree_ms: Date.now() - debut });
  } catch (e) {
    console.error('capture/ia:', e instanceof Error ? e.message : e);
    return reponseErreur('IA_TIMEOUT', 'Le service IA est indisponible — réessaie dans un instant.', 503);
  }
}
