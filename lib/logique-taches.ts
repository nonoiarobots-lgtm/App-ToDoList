// Logique métier des tâches (specs : docs/tests-tdd.md)
import type { Tache, StatutTache, PrioriteTache } from '@/types/tache';

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

// Une tâche est "qualifiable" quand ses champs de qualification sont tous renseignés :
// un projet, une échéance et une priorité explicite (≠ 'aucune'). Dans ce cas il n'y a
// plus rien à qualifier → elle peut basculer directement en 'active' (cf. besoin point 2).
export function estQualifiable(
  tache: Pick<Tache, 'projet_id' | 'date_echeance' | 'priorite'>
): boolean {
  return tache.projet_id != null && tache.date_echeance != null && tache.priorite !== 'aucune';
}

// Statut de capture : 'active' si la tâche est déjà entièrement qualifiée, sinon 'a_qualifier'.
export function statutACapture(
  tache: Pick<Tache, 'projet_id' | 'date_echeance' | 'priorite'>
): StatutTache {
  return estQualifiable(tache) ? 'active' : 'a_qualifier';
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

// Filtres du backlog (besoin point 5 — ergonomie). Chaque critère vide = "tout".
// 'sans-projet' est la clé conventionnelle des tâches sans projet.
export interface FiltresBacklog {
  recherche: string;
  statuts: StatutTache[];
  priorites: PrioriteTache[];
  projetIds: string[];
}

export const FILTRES_VIDES: FiltresBacklog = {
  recherche: '',
  statuts: [],
  priorites: [],
  projetIds: [],
};

// Nombre de critères actifs (pour le badge du bouton "Filtres").
export function nombreFiltresActifs(f: FiltresBacklog): number {
  return (
    (f.recherche.trim() ? 1 : 0) + f.statuts.length + f.priorites.length + f.projetIds.length
  );
}

// Applique tous les critères. Recherche insensible à la casse sur titre + notes.
export function filtrerTaches(
  taches: Tache[],
  f: FiltresBacklog
): Tache[] {
  const recherche = f.recherche.trim().toLowerCase();
  return taches.filter(t => {
    if (recherche && !`${t.titre} ${t.notes ?? ''}`.toLowerCase().includes(recherche)) return false;
    if (f.statuts.length && !f.statuts.includes(t.statut)) return false;
    if (f.priorites.length && !f.priorites.includes(t.priorite)) return false;
    if (f.projetIds.length && !f.projetIds.includes(t.projet_id ?? 'sans-projet')) return false;
    return true;
  });
}
