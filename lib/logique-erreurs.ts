// Classification des erreurs utilisateur (cadrage §19.3)
import type { CodeErreur, ErreurAPI } from '@/types/api';

export function erreurAPI(code: CodeErreur, message: string, status: number): ErreurAPI {
  return { error: { code, message, status } };
}

export function classerErreur(_erreur: unknown): CodeErreur {
  // TODO tranche ① : mapper les erreurs Supabase/Claude/réseau vers CodeErreur
  throw new Error('NOT_IMPLEMENTED');
}
