import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from './supabase-server';
import { erreurAPI } from './logique-erreurs';
import type { CodeErreur } from '@/types/api';

export function reponseErreur(code: CodeErreur, message: string, status: number) {
  return NextResponse.json(erreurAPI(code, message, status), { status });
}

// Récupère le client Supabase + l'utilisateur authentifié.
// Le proxy garantit déjà l'auth, mais on revérifie (défense en profondeur).
export async function clientAuthentifie() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null };
  }
  return { supabase, user };
}
