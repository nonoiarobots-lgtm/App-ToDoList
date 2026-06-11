import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { reponseErreur } from '@/lib/api-utils';

// POST /api/auth/reset-password — envoi de l'email de réinitialisation (BU-17)
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return reponseErreur('VALIDATION_ERROR', 'Corps JSON invalide.', 400);
  }

  if (!body.email?.trim()) {
    return reponseErreur('VALIDATION_ERROR', 'Email requis.', 400);
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(body.email.trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  // Toujours 200 — pas d'énumération d'utilisateurs
  return NextResponse.json({ ok: true });
}
