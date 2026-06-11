// Logique de récurrence — implémentation en tranche ⑤ (testée dans tests-tdd.md)
import type { Recurrence, Tache } from '@/types/tache';

export function calculerProchaineEcheance(_echeance: string, _recurrence: Recurrence): string {
  // TODO tranche ⑤ : +1 jour / +7 jours / +1 mois selon la fréquence
  throw new Error('NOT_IMPLEMENTED');
}

export function creerTacheSuivante(_tache: Tache, _recurrence: Recurrence): Partial<Tache> {
  // TODO tranche ⑤ : clone de la tâche avec nouvelle échéance, avancement 0
  throw new Error('NOT_IMPLEMENTED');
}
