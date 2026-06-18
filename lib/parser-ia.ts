// Parsing et validation de la réponse Claude API (prompts : docs/prompt-engineering.md).
// Pur et testable — aucune dépendance réseau.
import type { TacheIA, PrioriteTache, FrequenceRecurrence } from '@/types/tache';

const PRIORITES: PrioriteTache[] = ['haute', 'moyenne', 'basse', 'aucune'];
const FREQUENCES: FrequenceRecurrence[] = ['quotidienne', 'hebdomadaire', 'mensuelle'];
const SEUIL_CONFIANCE = 0.6; // en dessous, le projet est jugé incertain → projet_id null

// Extrait le JSON d'une réponse brute (tolère le markdown ```json``` résiduel).
export function parserReponseIA(brut: string): TacheIA[] {
  const nettoye = brut.replace(/```json/gi, '').replace(/```/g, '').trim();
  const debut = nettoye.indexOf('{');
  const fin = nettoye.lastIndexOf('}');
  if (debut === -1 || fin === -1 || fin < debut) return [];
  try {
    const parsed = JSON.parse(nettoye.slice(debut, fin + 1)) as { taches?: unknown };
    return validerReponseIA(parsed?.taches);
  } catch {
    return [];
  }
}

function validerRecurrence(valeur: unknown): TacheIA['recurrence'] {
  if (!valeur || typeof valeur !== 'object') return null;
  const r = valeur as Record<string, unknown>;
  if (typeof r.frequence !== 'string' || !FREQUENCES.includes(r.frequence as FrequenceRecurrence)) {
    return null;
  }
  return {
    frequence: r.frequence as FrequenceRecurrence,
    jour_semaine: typeof r.jour_semaine === 'number' ? r.jour_semaine : undefined,
    jour_mois: typeof r.jour_mois === 'number' ? r.jour_mois : undefined,
  };
}

// Valide et normalise le tableau de tâches. Élimine les entrées sans titre.
export function validerReponseIA(taches: unknown): TacheIA[] {
  if (!Array.isArray(taches)) return [];
  const resultat: TacheIA[] = [];
  for (const t of taches) {
    if (!t || typeof t !== 'object') continue;
    const o = t as Record<string, unknown>;
    const titre = typeof o.titre === 'string' ? o.titre.trim() : '';
    if (!titre) continue;

    const confiance = typeof o.confiance === 'number' ? o.confiance : 0;
    const priorite: PrioriteTache =
      typeof o.priorite === 'string' && PRIORITES.includes(o.priorite as PrioriteTache)
        ? (o.priorite as PrioriteTache)
        : 'moyenne';
    const projetIncertain = confiance < SEUIL_CONFIANCE || o.projet_id == null;

    resultat.push({
      titre,
      projet_id: projetIncertain || typeof o.projet_id !== 'string' ? null : o.projet_id,
      priorite,
      date_echeance: typeof o.date_echeance === 'string' ? o.date_echeance : null,
      temps_estime_min: typeof o.temps_estime_min === 'number' ? o.temps_estime_min : null,
      recurrence: validerRecurrence(o.recurrence),
      confiance,
      projet_incertain: projetIncertain,
    });
  }
  return resultat;
}
