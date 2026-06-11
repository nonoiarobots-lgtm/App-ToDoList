import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { reponseErreur } from '@/lib/api-utils';
import { ensurePreferences } from '@/lib/preferences-server';

// POST /api/auth/login — connexion par email (cadrage §19.5)
export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return reponseErreur('VALIDATION_ERROR', 'Corps JSON invalide.', 400);
  }

  const { email, password } = body;
  if (!email?.trim() || !password) {
    return reponseErreur('VALIDATION_ERROR', 'Email et mot de passe sont requis.', 400);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user) {
    // Message générique : pas d'énumération d'utilisateurs
    return reponseErreur('UNAUTHORIZED', 'Email ou mot de passe incorrect.', 401);
  }

  const preferences = await ensurePreferences(supabase, data.user);
  return NextResponse.json({ preferences });
}
