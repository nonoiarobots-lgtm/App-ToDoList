// Logique métier des tâches — implémentation en tranche ① (testée dans tests-tdd.md)
import type { Tache, StatutTache } from '@/types/tache';

export function calculerStatutRetard(_tache: Pick<Tache, 'statut' | 'date_echeance'>): StatutTache {
  // TODO tranche ① : 'en_retard' si échéance dépassée et statut actif
  throw new Error('NOT_IMPLEMENTED');
}

export function preparerArchivage(_tache: Tache): Partial<Tache> {
  // TODO tranche ① : statut 'archivee' + date_cloture + avancement 100
  throw new Error('NOT_IMPLEMENTED');
}
