// Seuils d'alerte du stock "à qualifier" — implémentation en tranche ③
import type { NiveauAlerte } from '@/types/api';

export function calculerNiveauAlerte(
  _nbAQualifier: number,
  _seuilOrange: number,
  _seuilRouge: number
): NiveauAlerte {
  // TODO tranche ③ : null / 'orange' / 'rouge' selon les seuils
  throw new Error('NOT_IMPLEMENTED');
}
