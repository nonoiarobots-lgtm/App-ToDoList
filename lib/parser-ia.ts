// Parsing et validation de la réponse Claude API — implémentation en tranche ②
// (prompts documentés dans docs/prompt-engineering.md)
import type { TacheIA } from '@/types/tache';

export function parserReponseIA(_brut: string): TacheIA[] {
  // TODO tranche ② : parser le JSON, tolérer le markdown autour
  throw new Error('NOT_IMPLEMENTED');
}

export function validerReponseIA(_taches: unknown): TacheIA[] {
  // TODO tranche ② : valider chaque champ, confiance 0 si invalide
  throw new Error('NOT_IMPLEMENTED');
}
