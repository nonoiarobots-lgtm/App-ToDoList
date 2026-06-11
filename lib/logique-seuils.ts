// Seuils d'alerte du stock "à qualifier" (cadrage §6)
import type { NiveauAlerte } from '@/types/api';

export function calculerNiveauAlerte(
  nbAQualifier: number,
  seuilOrange: number,
  seuilRouge: number
): NiveauAlerte {
  if (nbAQualifier >= seuilRouge) return 'rouge';
  if (nbAQualifier >= seuilOrange) return 'orange';
  return null;
}
