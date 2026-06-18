// Découpage vocal via Claude API (Haiku 4.5). Clé API côté serveur uniquement.
// Prompts documentés dans docs/prompt-engineering.md.
import Anthropic from '@anthropic-ai/sdk';
import type { Projet } from '@/types/projet';
import type { TacheIA } from '@/types/tache';
import { parserReponseIA } from './parser-ia';

const SYSTEM_PROMPT = `Tu es un assistant de gestion de tâches personnelles. Tu reçois un texte dicté en français et tu dois :
1. Identifier et extraire chaque tâche distincte mentionnée
2. Pour chaque tâche, remplir les champs ci-dessous avec le maximum de précision
3. Retourner UNIQUEMENT un objet JSON valide, sans aucun texte avant ou après, sans balises markdown

RÈGLES :
- Ne jamais inventer d'information absente du texte
- Reformuler chaque titre en action à l'infinitif, claire et concise ("il faut que j'appelle Sophie" → "Appeler Sophie")
- Valeurs par défaut : priorite "moyenne" ; projet_id null si non identifiable avec confiance ≥ 0.6 ; date_echeance, temps_estime_min, recurrence à null si non mentionnés
- confiance : score 0.0–1.0 sur l'attribution du projet uniquement

FORMAT :
{"taches":[{"titre":"string","projet_id":"string|null","priorite":"haute|moyenne|basse","date_echeance":"ISO 8601|null","temps_estime_min":"int|null","recurrence":{"frequence":"quotidienne|hebdomadaire|mensuelle","jour_semaine":"0-6|null","jour_mois":"1-31|null"}|null,"confiance":0.0}]}`;

function construireUserPrompt(
  texte: string,
  projets: Pick<Projet, 'id' | 'nom'>[],
  dateReference: string
): string {
  const liste =
    projets.length > 0
      ? projets.map(p => `- ID: "${p.id}" → Nom: "${p.nom}"`).join('\n')
      : '(aucun projet défini — utiliser null pour tous les projet_id)';

  return `DATE DE RÉFÉRENCE : ${dateReference}
Utilise cette date pour calculer les dates relatives (demain, vendredi, la semaine prochaine, dans 2 jours…).

PROJETS DISPONIBLES :
${liste}

Attribue chaque tâche au projet le plus probable. Si aucun ne correspond avec une certitude ≥ 0.6, utilise projet_id: null.

TEXTE DICTÉ :
"${texte}"

Extrait toutes les tâches et retourne le JSON.`;
}

export async function capturerTachesIA(
  dictee: string,
  projets: Pick<Projet, 'id' | 'nom'>[],
  dateReference: string
): Promise<TacheIA[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: construireUserPrompt(dictee, projets, dateReference) }],
  });

  const texte = message.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  const taches = parserReponseIA(texte);

  // Sécurité : écarter un projet_id halluciné qui ne correspond à aucun projet réel
  const idsValides = new Set(projets.map(p => p.id));
  return taches.map(t =>
    t.projet_id && !idsValides.has(t.projet_id)
      ? { ...t, projet_id: null, projet_incertain: true }
      : t
  );
}
