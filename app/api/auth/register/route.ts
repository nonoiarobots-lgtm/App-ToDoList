import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { reponseErreur } from '@/lib/api-utils';
import { classerErreur } from '@/lib/logique-erreurs';

// POST /api/auth/register — création de compte (connexion par email, cadrage §19.5)
export async function POST(req: Request) {
  let body: { prenom?: string; email?: string; password?: string; timezone?: string };
  try {
    body = await req.json();
  } catch {
    return reponseErreur('VALIDATION_ERROR', 'Corps JSON invalide.', 400);
  }

  const { prenom, email, password, timezone } = body;
  if (!prenom?.trim() || !email?.trim() || !password) {
    return reponseErreur('VALIDATION_ERROR', 'Prénom, email et mot de passe sont requis.', 400);
  }
  if (password.length < 8) {
    return reponseErreur('VALIDATION_ERROR', 'Le mot de passe doit faire au moins 8 caractères.', 400);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      // Stocké en métadonnées — la ligne preferences est créée au premier accès authentifié
      data: { prenom: prenom.trim(), timezone: timezone || 'Europe/Paris' },
    },
  });

  if (error) {
    const code = classerErreur(error);
    const message =
      code === 'EMAIL_DEJA_UTILISE' ? 'Un compte existe déjà avec cet email.' : error.message;
    return reponseErreur(code, message, 400);
  }

  return NextResponse.json(
    {
      user_id: data.user?.id ?? null,
      // true si Supabase exige la confirmation de l'email avant la première connexion
      email_confirmation_requise: !data.session,
    },
    { status: 201 }
  );
}
