import { NextResponse } from 'next/server';
import { clientAuthentifie, reponseErreur } from '@/lib/api-utils';
import { ensurePreferences } from '@/lib/preferences-server';
import type { Database } from '@/lib/database.types';

const HEURE_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

// GET /api/preferences
export async function GET() {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  const preferences = await ensurePreferences(supabase, user);
  if (!preferences) return reponseErreur('BDD_INDISPONIBLE', 'Données indisponibles.', 503);
  return NextResponse.json({ preferences, email: user.email });
}

// PATCH /api/preferences — prénom, horaires, seuils, timezone, push_subscription
export async function PATCH(req: Request) {
  const { supabase, user } = await clientAuthentifie();
  if (!user) return reponseErreur('UNAUTHORIZED', 'Session expirée — reconnecte-toi.', 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reponseErreur('VALIDATION_ERROR', 'Corps JSON invalide.', 400);
  }

  const maj: Record<string, unknown> = {};
  for (const champ of [
    'prenom',
    'heure_briefing',
    'heure_qualification',
    'heure_retards',
    'seuil_orange',
    'seuil_rouge',
    'timezone',
    'push_subscription',
  ]) {
    if (champ in body) maj[champ] = body[champ];
  }

  if (typeof maj.prenom === 'string' && !maj.prenom.trim()) {
    return reponseErreur('VALIDATION_ERROR', 'Le prénom ne peut pas être vide.', 400);
  }
  for (const h of ['heure_briefing', 'heure_qualification', 'heure_retards']) {
    if (maj[h] !== undefined && !HEURE_REGEX.test(String(maj[h]))) {
      return reponseErreur('VALIDATION_ERROR', `Format d'heure invalide pour ${h} (attendu HH:MM).`, 400);
    }
  }
  if (Object.keys(maj).length === 0) {
    return reponseErreur('VALIDATION_ERROR', 'Aucun champ à mettre à jour.', 400);
  }

  await ensurePreferences(supabase, user);
  const { data, error } = await supabase
    .from('preferences')
    .update(maj as Database['public']['Tables']['preferences']['Update'])
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) {
    // 23514 = violation de contrainte check (seuils, timezone)
    if (error.code === '23514') {
      return reponseErreur('VALIDATION_ERROR', 'Valeur invalide (le seuil rouge doit être supérieur au seuil orange).', 400);
    }
    return reponseErreur('BDD_INDISPONIBLE', 'Sauvegarde échouée.', 503);
  }
  return NextResponse.json({ preferences: data });
}
