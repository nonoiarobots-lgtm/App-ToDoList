// Classification des erreurs utilisateur (cadrage §19.3)
import type { CodeErreur, ErreurAPI } from '@/types/api';

export function erreurAPI(code: CodeErreur, message: string, status: number): ErreurAPI {
  return { error: { code, message, status } };
}

// Mappe une erreur brute (Supabase, réseau, IA) vers un code applicatif
export function classerErreur(erreur: unknown): CodeErreur {
  const message =
    typeof erreur === 'object' && erreur !== null && 'message' in erreur
      ? String((erreur as { message: unknown }).message)
      : String(erreur);

  if (/already registered|already exists/i.test(message)) return 'EMAIL_DEJA_UTILISE';
  if (/invalid login credentials|invalid claim|jwt/i.test(message)) return 'UNAUTHORIZED';
  if (/timeout|timed out/i.test(message)) return 'IA_TIMEOUT';
  if (/fetch failed|network|ECONNREFUSED|unavailable/i.test(message)) return 'BDD_INDISPONIBLE';
  return 'VALIDATION_ERROR';
}
