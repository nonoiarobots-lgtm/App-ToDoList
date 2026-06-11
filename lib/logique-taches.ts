// Logique métier des tâches (specs : docs/tests-tdd.md)
import type { Tache, StatutTache } from '@/types/tache';

// Statuts considérés comme "en cours" — éligibles au passage en retard
const STATUTS_ACTIFS: StatutTache[] = ['active', 'en_attente_retour', 'en_retard'];

// Statut affiché : 'en_retard' si l'échéance est dépassée et la tâche non clôturée.
// Le statut stocké est mis à jour par pg_cron chaque nuit ; ce calcul couvre la journée courante.
export function calculerStatutRetard(
  tache: Pick<Tache, 'statut' | 'date_echeance'>,
  maintenant: Date = new Date()
): StatutTache {
  if (
    STATUTS_ACTIFS.includes(tache.statut) &&
    tache.date_echeance &&
    new Date(tache.date_echeance) < maintenant
  ) {
    return 'en_retard';
  }
  return tache.statut;
}

// Champs à mettre à jour pour archiver une tâche.
// date_cloture et avancement=100 sont posés par le trigger SQL set_date_cloture.
export function preparerArchivage(): Pick<Tache, 'statut'> {
  return { statut: 'archivee' };
}

export function estEnRetard(
  tache: Pick<Tache, 'statut' | 'date_echeance'>,
  maintenant: Date = new Date()
): boolean {
  return calculerStatutRetard(tache, maintenant) === 'en_retard';
}

// Nombre de jours de retard (badge "+Xj" de la relance retards)
export function joursDeRetard(dateEcheance: string, maintenant: Date = new Date()): number {
  const diff = maintenant.getTime() - new Date(dateEcheance).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}
