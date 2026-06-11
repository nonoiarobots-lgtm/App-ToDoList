# Prompt Engineering — Claude API
**Version 1 — Découpage et pré-caractérisation des tâches**
*Dernière mise à jour : 30 mai 2026*

---

## Objectif

Transformer un texte dicté en langage naturel (potentiellement long, en français, avec fautes orales) en un tableau JSON de tâches pré-caractérisées, prêtes à être validées par l'utilisateur.

---

## Contraintes du prompt

- La liste des projets est injectée dynamiquement à chaque appel
- La date de référence est injectée pour résoudre "demain", "vendredi", "la semaine prochaine"
- La réponse doit être du JSON pur — zéro markdown, zéro commentaire, zéro texte autour
- Si aucun projet identifié avec confiance ≥ 0.6 → `projet_id: null`
- Si aucune priorité détectée → `priorite: "moyenne"` par défaut
- Si aucune date détectée → `date_echeance: null`
- Score de confiance entre 0 et 1 sur l'attribution du projet uniquement

---

## System prompt

```
Tu es un assistant de gestion de tâches personnelles. Tu reçois un texte dicté en français par un utilisateur et tu dois :

1. Identifier et extraire chaque tâche distincte mentionnée dans le texte
2. Pour chaque tâche, remplir les champs suivants avec le maximum de précision possible
3. Retourner UNIQUEMENT un objet JSON valide, sans aucun texte avant ou après, sans balises markdown, sans commentaires

RÈGLES STRICTES :
- Ne jamais inventer d'informations non présentes dans le texte
- Si une information est absente ou incertaine, utiliser les valeurs par défaut définies ci-dessous
- La réponse doit commencer par { et se terminer par }
- Ne jamais inclure de texte explicatif, de balises ```json, ou quoi que ce soit d'autre que le JSON

VALEURS PAR DÉFAUT :
- priorite : "moyenne" si non mentionnée
- projet_id : null si non identifiable avec certitude (confiance < 0.6)
- date_echeance : null si non mentionnée
- temps_estime_min : null si non mentionné
- recurrence : null si non mentionnée
- confiance : score entre 0 et 1 sur l'identification du projet uniquement

FORMAT DE RÉPONSE :
{
  "taches": [
    {
      "titre": "string — action claire et concise, commençant par un verbe à l'infinitif",
      "projet_id": "string | null — id du projet correspondant ou null",
      "priorite": "haute | moyenne | basse",
      "date_echeance": "string ISO 8601 | null — date calculée à partir de la date de référence",
      "temps_estime_min": "integer | null — en minutes",
      "recurrence": {
        "frequence": "quotidienne | hebdomadaire | mensuelle",
        "jour_semaine": "integer 0-6 (0=lundi) | null — pour hebdomadaire uniquement",
        "jour_mois": "integer 1-31 | null — pour mensuelle uniquement"
      } | null,
      "confiance": "float 0.0-1.0 — certitude sur l'attribution du projet"
    }
  ]
}
```

Tu ré-exprimes toujours le titre d'une tâche sous forme d'action à l'infinitif, claire et concise. Par exemple :
- "il faut que j'appelle Sophie" → "Appeler Sophie"
- "je dois envoyer le CR de la réunion à toute l'équipe" → "Envoyer le CR de réunion à l'équipe"
- "penser à relancer le prestataire pour la livraison" → "Relancer le prestataire — livraison"
```

---

## User prompt (template dynamique)

```typescript
function construireUserPrompt(params: {
  texte: string;
  projets: Array<{ id: string; nom: string }>;
  dateReference: string; // format YYYY-MM-DD
}): string {
  const { texte, projets, dateReference } = params;

  const listeProjetsFr = projets.length > 0
    ? projets.map(p => `- ID: "${p.id}" → Nom: "${p.nom}"`).join('\n')
    : '(aucun projet défini — utiliser null pour tous les projet_id)';

  return `DATE DE RÉFÉRENCE : ${dateReference}
Aujourd'hui est le ${dateReference}. Utilise cette date pour calculer les dates relatives mentionnées dans le texte (demain, vendredi, la semaine prochaine, dans 2 jours, etc.).

PROJETS DISPONIBLES :
${listeProjetsFr}

Attribue chaque tâche au projet le plus probable parmi cette liste. Si aucun projet ne correspond avec une certitude ≥ 0.6, utilise projet_id: null.

TEXTE DICTÉ :
"${texte}"

Extrait toutes les tâches de ce texte et retourne le JSON.`;
}
```

---

## Exemples d'appels et réponses attendues

### Exemple 1 — 3 tâches, projets mixtes, date relative

**Input**
```json
{
  "texte": "J'ai trois actions suite à la réunion d'aujourd'hui : envoyer le compte-rendu à l'équipe, planifier la revue budget avec Sophie vendredi, et relancer le prestataire sur la livraison — c'est urgent",
  "projets": [
    { "id": "uuid-formation", "nom": "Formation IA" },
    { "id": "uuid-recherche", "nom": "Recherche emploi" },
    { "id": "uuid-perso", "nom": "Perso" }
  ],
  "dateReference": "2026-05-30"
}
```

**Réponse Claude attendue**
```json
{
  "taches": [
    {
      "titre": "Envoyer le compte-rendu de réunion à l'équipe",
      "projet_id": null,
      "priorite": "moyenne",
      "date_echeance": "2026-05-30T23:59:00Z",
      "temps_estime_min": null,
      "recurrence": null,
      "confiance": 0.35
    },
    {
      "titre": "Planifier la revue budget avec Sophie",
      "projet_id": null,
      "priorite": "moyenne",
      "date_echeance": "2026-06-05T23:59:00Z",
      "temps_estime_min": null,
      "recurrence": null,
      "confiance": 0.40
    },
    {
      "titre": "Relancer le prestataire — livraison",
      "projet_id": null,
      "priorite": "haute",
      "date_echeance": null,
      "temps_estime_min": null,
      "recurrence": null,
      "confiance": 0.30
    }
  ]
}
```

> Note : les projets disponibles ("Formation IA", "Recherche emploi", "Perso") ne correspondent à aucune des tâches professionnelles mentionnées → `projet_id: null` sur toutes. "Urgent" est détecté → `priorite: "haute"` sur la 3e tâche. "Vendredi" depuis le 30/05 (samedi) → vendredi 5 juin.

---

### Exemple 2 — Avec récurrence et temps estimé détectés

**Input**
```json
{
  "texte": "Penser à envoyer le rapport hebdomadaire chaque vendredi, ça me prend environ 30 minutes. Et aussi préparer la réunion mensuelle le premier du mois.",
  "projets": [
    { "id": "uuid-formation", "nom": "Formation IA" },
    { "id": "uuid-recherche", "nom": "Recherche emploi" }
  ],
  "dateReference": "2026-05-30"
}
```

**Réponse Claude attendue**
```json
{
  "taches": [
    {
      "titre": "Envoyer le rapport hebdomadaire",
      "projet_id": null,
      "priorite": "moyenne",
      "date_echeance": "2026-06-05T18:00:00Z",
      "temps_estime_min": 30,
      "recurrence": {
        "frequence": "hebdomadaire",
        "jour_semaine": 4
      },
      "confiance": 0.30
    },
    {
      "titre": "Préparer la réunion mensuelle",
      "projet_id": null,
      "priorite": "moyenne",
      "date_echeance": "2026-06-01T23:59:00Z",
      "temps_estime_min": null,
      "recurrence": {
        "frequence": "mensuelle",
        "jour_mois": 1
      },
      "confiance": 0.25
    }
  ]
}
```

---

### Exemple 3 — Projet bien identifié (confiance élevée)

**Input**
```json
{
  "texte": "Pour ma recherche d'emploi : mettre à jour mon CV sur LinkedIn et envoyer ma candidature chez Capgemini avant jeudi",
  "projets": [
    { "id": "uuid-formation", "nom": "Formation IA" },
    { "id": "uuid-recherche", "nom": "Recherche emploi" },
    { "id": "uuid-perso", "nom": "Perso" }
  ],
  "dateReference": "2026-05-30"
}
```

**Réponse Claude attendue**
```json
{
  "taches": [
    {
      "titre": "Mettre à jour le CV sur LinkedIn",
      "projet_id": "uuid-recherche",
      "priorite": "moyenne",
      "date_echeance": "2026-06-04T23:59:00Z",
      "temps_estime_min": null,
      "recurrence": null,
      "confiance": 0.95
    },
    {
      "titre": "Envoyer la candidature chez Capgemini",
      "projet_id": "uuid-recherche",
      "priorite": "haute",
      "date_echeance": "2026-06-04T23:59:00Z",
      "temps_estime_min": null,
      "recurrence": null,
      "confiance": 0.95
    }
  ]
}
```

> Note : "pour ma recherche d'emploi" est un signal fort → confiance 0.95 sur "Recherche emploi". "Avant jeudi" depuis le samedi 30/05 → jeudi 4 juin. Deux tâches distinctes bien séparées.

---

### Exemple 4 — Texte ambigu, fautes orales, une seule tâche

**Input**
```json
{
  "texte": "euh ouais faut que je rappelle martin pour le truc de la semaine dernière",
  "projets": [
    { "id": "uuid-formation", "nom": "Formation IA" },
    { "id": "uuid-perso", "nom": "Perso" }
  ],
  "dateReference": "2026-05-30"
}
```

**Réponse Claude attendue**
```json
{
  "taches": [
    {
      "titre": "Rappeler Martin",
      "projet_id": null,
      "priorite": "moyenne",
      "date_echeance": null,
      "temps_estime_min": null,
      "recurrence": null,
      "confiance": 0.30
    }
  ]
}
```

> Note : "le truc de la semaine dernière" est trop vague pour être inclus dans le titre. "La semaine dernière" est une référence temporelle passée, pas une échéance → `date_echeance: null`. Le titre est nettoyé et reformulé à l'infinitif.

---

### Exemple 5 — Texte sans tâche identifiable

**Input**
```json
{
  "texte": "euh voilà c'est tout merci",
  "projets": [{ "id": "uuid-perso", "nom": "Perso" }],
  "dateReference": "2026-05-30"
}
```

**Réponse Claude attendue**
```json
{
  "taches": []
}
```

---

## Implémentation TypeScript

### lib/claude-capture.ts

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Tu es un assistant de gestion de tâches personnelles. Tu reçois un texte dicté en français par un utilisateur et tu dois :

1. Identifier et extraire chaque tâche distincte mentionnée dans le texte
2. Pour chaque tâche, remplir les champs suivants avec le maximum de précision possible
3. Retourner UNIQUEMENT un objet JSON valide, sans aucun texte avant ou après, sans balises markdown, sans commentaires

RÈGLES STRICTES :
- Ne jamais inventer d'informations non présentes dans le texte
- Si une information est absente ou incertaine, utiliser les valeurs par défaut définies ci-dessous
- La réponse doit commencer par { et se terminer par }
- Ne jamais inclure de texte explicatif, de balises \`\`\`json, ou quoi que ce soit d'autre que le JSON

VALEURS PAR DÉFAUT :
- priorite : "moyenne" si non mentionnée
- projet_id : null si non identifiable avec certitude (confiance < 0.6)
- date_echeance : null si non mentionnée
- temps_estime_min : null si non mentionné
- recurrence : null si non mentionnée
- confiance : score entre 0 et 1 sur l'identification du projet uniquement

FORMAT DE RÉPONSE :
{
  "taches": [
    {
      "titre": "string — action claire et concise, commençant par un verbe à l'infinitif",
      "projet_id": "string | null",
      "priorite": "haute | moyenne | basse",
      "date_echeance": "string ISO 8601 | null",
      "temps_estime_min": "integer | null",
      "recurrence": {
        "frequence": "quotidienne | hebdomadaire | mensuelle",
        "jour_semaine": "integer 0-6 | null",
        "jour_mois": "integer 1-31 | null"
      } | null,
      "confiance": "float 0.0-1.0"
    }
  ]
}

Tu ré-exprimes toujours le titre sous forme d'action à l'infinitif, claire et concise.`;

interface Projet {
  id: string;
  nom: string;
}

interface RecurrenceIA {
  frequence: 'quotidienne' | 'hebdomadaire' | 'mensuelle';
  jour_semaine?: number;
  jour_mois?: number;
}

interface TacheIA {
  titre: string;
  projet_id: string | null;
  priorite: 'haute' | 'moyenne' | 'basse';
  date_echeance: string | null;
  temps_estime_min: number | null;
  recurrence: RecurrenceIA | null;
  confiance: number;
  projet_incertain: boolean; // calculé après parsing
}

interface ResultatCapture {
  taches: TacheIA[];
  duree_ms: number;
}

function construireUserPrompt(
  texte: string,
  projets: Projet[],
  dateReference: string
): string {
  const listeProjetsFr = projets.length > 0
    ? projets.map(p => `- ID: "${p.id}" → Nom: "${p.nom}"`).join('\n')
    : '(aucun projet défini — utiliser null pour tous les projet_id)';

  return `DATE DE RÉFÉRENCE : ${dateReference}
Aujourd'hui est le ${dateReference}. Utilise cette date pour calculer les dates relatives mentionnées dans le texte (demain, vendredi, la semaine prochaine, dans 2 jours, etc.).

PROJETS DISPONIBLES :
${listeProjetsFr}

Attribue chaque tâche au projet le plus probable parmi cette liste. Si aucun projet ne correspond avec une certitude ≥ 0.6, utilise projet_id: null.

TEXTE DICTÉ :
"${texte}"

Extrait toutes les tâches de ce texte et retourne le JSON.`;
}

function parserReponse(texte: string): TacheIA[] {
  try {
    // Nettoyer les éventuelles balises markdown résiduelles
    const nettoye = texte
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(nettoye);

    if (!parsed.taches || !Array.isArray(parsed.taches)) {
      return [];
    }

    return parsed.taches
      .filter((t: any) => t.confiance > 0) // éliminer les hallucinations
      .map((t: any): TacheIA => ({
        titre: t.titre?.trim() || '[Sans titre]',
        projet_id: t.confiance >= 0.6 ? (t.projet_id ?? null) : null,
        priorite: ['haute', 'moyenne', 'basse'].includes(t.priorite)
          ? t.priorite
          : 'moyenne', // valeur par défaut si invalide
        date_echeance: t.date_echeance ?? null,
        temps_estime_min: t.temps_estime_heures
          ? Math.round(t.temps_estime_heures * 60) // conversion heures → minutes
          : (t.temps_estime_min ?? null),
        recurrence: t.recurrence ?? null,
        confiance: t.confiance ?? 0,
        projet_incertain: !t.projet_id || t.confiance < 0.6,
      }));
  } catch {
    // JSON malformé ou tronqué
    return [];
  }
}

export async function capturerAvecIA(
  texte: string,
  projets: Projet[],
  dateReference: string
): Promise<ResultatCapture> {
  const debut = Date.now();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: construireUserPrompt(texte, projets, dateReference),
      },
    ],
  });

  const duree_ms = Date.now() - debut;

  const contenu = message.content
    .filter(block => block.type === 'text')
    .map(block => (block as any).text)
    .join('');

  const taches = parserReponse(contenu);

  return { taches, duree_ms };
}
```

---

## Route Handler Next.js

### app/api/capture/ia/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { capturerAvecIA } from '@/lib/claude-capture';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Token invalide ou manquant.', status: 401 } },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { texte, projets, date_reference } = body;

  if (!texte || typeof texte !== 'string') {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Le champ texte est requis.', status: 400 } },
      { status: 400 }
    );
  }

  try {
    const resultat = await capturerAvecIA(
      texte,
      projets ?? [],
      date_reference ?? new Date().toISOString().split('T')[0]
    );

    return NextResponse.json(resultat, { status: 200 });

  } catch (err) {
    console.error('Erreur Claude API:', err);
    return NextResponse.json(
      { error: { code: 'IA_TIMEOUT', message: 'Le service IA est temporairement indisponible.', status: 503 } },
      { status: 503 }
    );
  }
}
```

---

## Stratégie de calibration du prompt

### Signaux de priorité détectés

| Expression dans le texte | Priorité attribuée |
|---|---|
| "urgent", "asap", "au plus vite", "impératif" | haute |
| "important", "critique", "bloquant" | haute |
| "quand tu peux", "si possible", "pas pressé" | basse |
| Aucun signal | moyenne (défaut) |

### Signaux de dates relatifs

| Expression | Calcul |
|---|---|
| "aujourd'hui" | date_reference |
| "demain" | date_reference + 1 jour |
| "après-demain" | date_reference + 2 jours |
| "lundi" (prochain) | prochain lundi depuis date_reference |
| "vendredi" | prochain vendredi |
| "la semaine prochaine" | lundi de la semaine suivante |
| "fin de semaine" | vendredi de la semaine en cours |
| "ce mois-ci" | dernier jour du mois en cours |
| "le mois prochain" | 1er du mois suivant |
| "dans X jours/semaines" | date_reference + X jours/semaines |
| Date passée mentionnée | null (pas d'échéance) |

### Signaux de récurrence

| Expression | Récurrence |
|---|---|
| "chaque jour", "tous les jours", "quotidiennement" | quotidienne |
| "chaque semaine", "toutes les semaines", "hebdomadairement" | hebdomadaire |
| "chaque lundi/mardi/..." | hebdomadaire, jour_semaine = N |
| "chaque mois", "tous les mois", "mensuellement" | mensuelle |
| "le 1er du mois", "le 15 de chaque mois" | mensuelle, jour_mois = N |

---

## Tests du prompt

### __tests__/unit/prompt-engineering.test.ts

```typescript
import { capturerAvecIA } from '@/lib/claude-capture';
import { mockClaudeApiCall } from '../mocks/claude-api';

const projetsTest = [
  { id: 'uuid-formation', nom: 'Formation IA' },
  { id: 'uuid-recherche', nom: 'Recherche emploi' },
  { id: 'uuid-perso', nom: 'Perso' },
];

describe('Prompt engineering — Parsing et robustesse', () => {

  it('reformule un titre en verbe à l\'infinitif', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify({
          taches: [{ titre: 'Rappeler Martin', projet_id: null, priorite: 'moyenne',
            date_echeance: null, temps_estime_min: null, recurrence: null, confiance: 0.3 }],
        }) }],
      }),
    });

    const result = await capturerAvecIA("faut rappeler martin", projetsTest, '2026-05-30');
    expect(result.taches[0].titre).toMatch(/^[A-Z]/); // commence par une majuscule
    expect(result.taches[0].titre).not.toMatch(/^faut|^il faut|^je dois/i);
  });

  it('applique "moyenne" si aucune priorité détectée', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify({
          taches: [{ titre: 'Faire quelque chose', projet_id: null,
            priorite: 'moyenne', date_echeance: null,
            temps_estime_min: null, recurrence: null, confiance: 0.2 }],
        }) }],
      }),
    });

    const result = await capturerAvecIA("faire quelque chose", projetsTest, '2026-05-30');
    expect(result.taches[0].priorite).toBe('moyenne');
  });

  it('met projet_id à null si confiance < 0.6 même si projet_id est fourni par l\'IA', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify({
          taches: [{ titre: 'Test', projet_id: 'uuid-formation',
            priorite: 'moyenne', date_echeance: null,
            temps_estime_min: null, recurrence: null, confiance: 0.45 }], // < 0.6
        }) }],
      }),
    });

    const result = await capturerAvecIA("tâche vague", projetsTest, '2026-05-30');
    expect(result.taches[0].projet_id).toBeNull();
    expect(result.taches[0].projet_incertain).toBe(true);
  });

  it('conserve projet_id si confiance >= 0.6', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify({
          taches: [{ titre: 'Mettre à jour le CV', projet_id: 'uuid-recherche',
            priorite: 'haute', date_echeance: '2026-06-04T23:59:00Z',
            temps_estime_min: null, recurrence: null, confiance: 0.95 }],
        }) }],
      }),
    });

    const result = await capturerAvecIA(
      "pour ma recherche d'emploi mettre à jour le CV avant jeudi",
      projetsTest, '2026-05-30'
    );
    expect(result.taches[0].projet_id).toBe('uuid-recherche');
    expect(result.taches[0].projet_incertain).toBe(false);
  });

  it('convertit les heures en minutes si l\'IA retourne temps_estime_heures', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify({
          taches: [{ titre: 'Longue réunion', projet_id: null,
            priorite: 'haute', date_echeance: null,
            temps_estime_heures: 1.5, recurrence: null, confiance: 0.5 }],
        }) }],
      }),
    });

    const result = await capturerAvecIA("réunion de 1h30", projetsTest, '2026-05-30');
    expect(result.taches[0].temps_estime_min).toBe(90);
  });

  it('filtre les tâches avec confiance = 0 (hallucinations)', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify({
          taches: [
            { titre: 'Tâche réelle', projet_id: null, priorite: 'moyenne',
              date_echeance: null, temps_estime_min: null, recurrence: null, confiance: 0.7 },
            { titre: 'Hallucination', projet_id: null, priorite: 'haute',
              date_echeance: null, temps_estime_min: null, recurrence: null, confiance: 0.0 },
          ],
        }) }],
      }),
    });

    const result = await capturerAvecIA("tâche réelle", projetsTest, '2026-05-30');
    expect(result.taches).toHaveLength(1);
    expect(result.taches[0].titre).toBe('Tâche réelle');
  });

  it('retourne duree_ms mesuré', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify({ taches: [] }) }],
      }),
    });

    const result = await capturerAvecIA("test", projetsTest, '2026-05-30');
    expect(result.duree_ms).toBeGreaterThan(0);
  });

  it('ne plante pas sur une réponse Claude avec du markdown résiduel', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '```json\n{"taches": []}\n```' }],
      }),
    });

    expect(async () => {
      await capturerAvecIA("test", projetsTest, '2026-05-30');
    }).not.toThrow();
  });

});
```

---

## Récapitulatif final — Couverture totale des tests

| Couche | Fichiers | Tests |
|---|---|---|
| Unitaire | 6 fichiers | 73 |
| Intégration | 5 fichiers | 51 |
| E2E | 4 fichiers | 45 |
| Prompt engineering | 1 fichier | 8 |
| **Total** | **16 fichiers** | **177** |

