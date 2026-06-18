// Logique métier du compte-rendu d'activité (CRA) — besoin point 7.
// Le pas de saisie est le quart d'heure ; on stocke des minutes (multiples de 15).

export const PAS_MIN = 15;
export const CIBLE_JOUR_DEFAUT_MIN = 450; // 7h30

// Heures décimales → minutes (1,25 h → 75 min)
export function heuresEnMinutes(heures: number): number {
  return Math.round(heures * 60);
}

// Minutes → heures décimales (75 → 1,25)
export function minutesEnHeures(min: number): number {
  return min / 60;
}

// Une durée saisie en heures est valide si elle est strictement positive
// et tombe sur un quart d'heure (multiple de 0,25 h).
export function estDureeValide(heures: number): boolean {
  if (!(heures > 0)) return false;
  const quarts = heures * 4;
  return Math.abs(quarts - Math.round(quarts)) < 1e-9;
}

// Total des minutes saisies sur une liste d'activités
export function totalMinutes(activites: { duree_min: number }[]): number {
  return activites.reduce((somme, a) => somme + a.duree_min, 0);
}

// Décompte restant par rapport à la cible du jour. Peut être négatif (dépassement).
export function decompteMin(totalMin: number, cibleMin: number): number {
  return cibleMin - totalMin;
}

// Formatage français : 90 → "1,5 h", 75 → "1,25 h", 450 → "7,5 h", -90 → "-1,5 h"
export function formatHeures(min: number): string {
  const arrondi = Math.round((min / 60) * 100) / 100;
  const s = arrondi.toFixed(2).replace(/\.?0+$/, '');
  return `${s.replace('.', ',')} h`;
}
