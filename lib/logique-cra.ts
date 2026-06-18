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

// --- Restitution / vue semaine ---

// Date locale au format YYYY-MM-DD
export function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Total CRA par jour : { 'YYYY-MM-DD': minutes }
export function agregerParJour(activites: { date_activite: string; duree_min: number }[]): Record<string, number> {
  const parJour: Record<string, number> = {};
  for (const a of activites) parJour[a.date_activite] = (parJour[a.date_activite] ?? 0) + a.duree_min;
  return parJour;
}

// État de saisie d'un jour (pastille vue semaine, 3 états)
export function etatCraJour(totalMin: number, cibleMin: number): 'complet' | 'partiel' | 'vide' {
  if (totalMin <= 0) return 'vide';
  if (totalMin >= cibleMin) return 'complet';
  return 'partiel';
}

// Pourcentage entier d'un total par rapport à une somme (0 si somme nulle)
export function pourcent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

// Lundi → dimanche contenant la date donnée
export function bornesSemaine(dateISO: string): { from: string; to: string } {
  const d = new Date(`${dateISO}T12:00:00`);
  const offset = (d.getDay() + 6) % 7; // 0 = lundi
  const lundi = new Date(d);
  lundi.setDate(d.getDate() - offset);
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);
  return { from: isoLocal(lundi), to: isoLocal(dimanche) };
}

// 1er → dernier jour du mois contenant la date donnée
export function bornesMois(dateISO: string): { from: string; to: string } {
  const d = new Date(`${dateISO}T12:00:00`);
  const premier = new Date(d.getFullYear(), d.getMonth(), 1);
  const dernier = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: isoLocal(premier), to: isoLocal(dernier) };
}

// Nombre de jours ouvrés (lundi–vendredi) entre deux dates incluses
export function joursOuvres(fromISO: string, toISO: string): number {
  let n = 0;
  const cur = new Date(`${fromISO}T12:00:00`);
  const fin = new Date(`${toISO}T12:00:00`);
  while (cur <= fin) {
    const j = cur.getDay();
    if (j !== 0 && j !== 6) n++;
    cur.setDate(cur.getDate() + 1);
  }
  return n;
}

// Cible d'une période = jours ouvrés × cible journalière
export function ciblePeriode(fromISO: string, toISO: string, cibleJourMin: number): number {
  return joursOuvres(fromISO, toISO) * cibleJourMin;
}

// Liste des dates (YYYY-MM-DD) d'une période incluse
export function listerJours(fromISO: string, toISO: string): string[] {
  const jours: string[] = [];
  const cur = new Date(`${fromISO}T12:00:00`);
  const fin = new Date(`${toISO}T12:00:00`);
  while (cur <= fin) {
    jours.push(isoLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return jours;
}
