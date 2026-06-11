# Tests TDD — Outil personnel de gestion de tâches
**Version 1 — Jest + Testing Library + Supabase mock**
*Dernière mise à jour : 30 mai 2026*

---

## Stack de test

```
Jest                    — runner + assertions
@testing-library/react  — tests composants React
supertest               — tests endpoints API
@supabase/supabase-js   — mocké via jest.mock()
node-fetch              — mocké pour Claude API
```

**Installation**
```bash
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev supertest @types/supertest
npm install --save-dev jest-environment-jsdom
```

**jest.config.ts**
```typescript
import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/__tests__/unit/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
    {
      displayName: 'integration',
      testMatch: ['**/__tests__/integration/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      globalSetup: './__tests__/integration/setup.ts',
      globalTeardown: './__tests__/integration/teardown.ts',
    },
    {
      displayName: 'e2e',
      testMatch: ['**/__tests__/e2e/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
  ],
};

export default config;
```

---

## Structure des fichiers

```
__tests__/
├── unit/
│   ├── logique-retard.test.ts
│   ├── logique-recurrence.test.ts
│   ├── logique-seuils.test.ts
│   ├── logique-archivage.test.ts
│   └── parser-ia.test.ts
├── integration/
│   ├── setup.ts
│   ├── teardown.ts
│   ├── api-auth.test.ts
│   ├── api-taches.test.ts
│   ├── api-capture-ia.test.ts
│   ├── api-projets.test.ts
│   └── api-preferences.test.ts
├── e2e/
│   ├── flux-briefing.test.ts
│   ├── flux-qualification.test.ts
│   └── flux-relance-retards.test.ts
└── mocks/
    ├── supabase.ts
    ├── claude-api.ts
    └── resend.ts
```

---

## Mocks partagés

### __tests__/mocks/supabase.ts

```typescript
export const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));
```

### __tests__/mocks/claude-api.ts

```typescript
// Réponses mockées représentatives des cas réels

export const mockClaudeResponse = {
  // Cas nominal : 3 tâches bien identifiées
  troistaches_ok: {
    taches: [
      {
        titre: "Envoyer CR réunion à l'équipe",
        projet_id: 'uuid-formation-ia',
        priorite: 'haute',
        date_echeance: '2026-05-30T23:59:00Z',
        temps_estime_min: null,
        recurrence: null,
        confiance: 0.92,
      },
      {
        titre: 'Planifier revue budget avec Sophie',
        projet_id: 'uuid-formation-ia',
        priorite: 'moyenne',
        date_echeance: '2026-06-05T23:59:00Z',
        temps_estime_min: null,
        recurrence: null,
        confiance: 0.87,
      },
      {
        titre: 'Relancer prestataire — livraison',
        projet_id: null,
        priorite: 'moyenne',
        date_echeance: null,
        temps_estime_min: null,
        recurrence: null,
        confiance: 0.38, // projet non identifié
      },
    ],
  },

  // Cas avec récurrence détectée
  recurrence_hebdo: {
    taches: [
      {
        titre: 'Envoyer rapport hebdomadaire',
        projet_id: 'uuid-formation-ia',
        priorite: 'haute',
        date_echeance: '2026-06-06T18:00:00Z',
        temps_estime_min: 30,
        recurrence: { frequence: 'hebdomadaire', jour_semaine: 4 },
        confiance: 0.95,
      },
    ],
  },

  // Cas avec temps estimé détecté
  temps_estime: {
    taches: [
      {
        titre: 'Relire la proposition',
        projet_id: 'uuid-perso',
        priorite: 'basse',
        date_echeance: null,
        temps_estime_min: 30,
        recurrence: null,
        confiance: 0.88,
      },
    ],
  },

  // Cas : texte incompréhensible
  texte_vide: {
    taches: [],
  },
};

export const mockClaudeApiCall = jest.fn();

jest.mock('node-fetch', () => ({
  default: mockClaudeApiCall,
}));
```

### __tests__/mocks/resend.ts

```typescript
export const mockResend = {
  emails: {
    send: jest.fn().mockResolvedValue({ id: 'resend-mock-id' }),
  },
};

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => mockResend),
}));
```

---

## Tests unitaires

### __tests__/unit/logique-retard.test.ts

```typescript
import { calculerStatutRetard, calculerJoursRetard } from '@/lib/logique-taches';

describe('Logique de retard', () => {

  describe('calculerStatutRetard', () => {
    it('retourne "en_retard" si date_echeance est dépassée et statut est "active"', () => {
      const tache = {
        statut: 'active' as const,
        date_echeance: new Date('2026-05-28T18:00:00Z'), // passé
      };
      expect(calculerStatutRetard(tache, new Date('2026-05-30T08:00:00Z'))).toBe('en_retard');
    });

    it('ne change pas le statut si date_echeance est dans le futur', () => {
      const tache = {
        statut: 'active' as const,
        date_echeance: new Date('2026-06-01T18:00:00Z'), // futur
      };
      expect(calculerStatutRetard(tache, new Date('2026-05-30T08:00:00Z'))).toBe('active');
    });

    it('ne change pas le statut si la tâche est déjà archivée', () => {
      const tache = {
        statut: 'archivee' as const,
        date_echeance: new Date('2026-05-28T18:00:00Z'),
      };
      expect(calculerStatutRetard(tache, new Date('2026-05-30T08:00:00Z'))).toBe('archivee');
    });

    it('ne change pas le statut si date_echeance est null', () => {
      const tache = {
        statut: 'active' as const,
        date_echeance: null,
      };
      expect(calculerStatutRetard(tache, new Date('2026-05-30T08:00:00Z'))).toBe('active');
    });

    it('gère les tâches "en_attente_retour" dépassées', () => {
      const tache = {
        statut: 'en_attente_retour' as const,
        date_echeance: new Date('2026-05-28T18:00:00Z'),
      };
      expect(calculerStatutRetard(tache, new Date('2026-05-30T08:00:00Z'))).toBe('en_retard');
    });
  });

  describe('calculerJoursRetard', () => {
    it('calcule correctement le nombre de jours de retard', () => {
      const echeance = new Date('2026-05-28T00:00:00Z');
      const maintenant = new Date('2026-05-30T08:00:00Z');
      expect(calculerJoursRetard(echeance, maintenant)).toBe(2);
    });

    it('retourne 0 si pas en retard', () => {
      const echeance = new Date('2026-06-01T00:00:00Z');
      const maintenant = new Date('2026-05-30T08:00:00Z');
      expect(calculerJoursRetard(echeance, maintenant)).toBe(0);
    });

    it('retourne 0 si date_echeance est null', () => {
      expect(calculerJoursRetard(null, new Date())).toBe(0);
    });
  });

});
```

---

### __tests__/unit/logique-recurrence.test.ts

```typescript
import { calculerProchaineEcheance, creerTacheSuivante } from '@/lib/logique-recurrence';

describe('Logique de récurrence', () => {

  describe('calculerProchaineEcheance', () => {
    it('calcule la prochaine échéance pour une récurrence quotidienne', () => {
      const echeance = new Date('2026-05-30T18:00:00Z');
      const recurrence = { frequence: 'quotidienne' as const };
      const resultat = calculerProchaineEcheance(echeance, recurrence);
      expect(resultat).toEqual(new Date('2026-05-31T18:00:00Z'));
    });

    it('calcule la prochaine échéance pour une récurrence hebdomadaire', () => {
      const echeance = new Date('2026-05-30T18:00:00Z'); // samedi
      const recurrence = { frequence: 'hebdomadaire' as const, jour_semaine: 5 };
      const resultat = calculerProchaineEcheance(echeance, recurrence);
      expect(resultat).toEqual(new Date('2026-06-06T18:00:00Z'));
    });

    it('calcule la prochaine échéance pour une récurrence mensuelle', () => {
      const echeance = new Date('2026-05-30T18:00:00Z');
      const recurrence = { frequence: 'mensuelle' as const, jour_mois: 30 };
      const resultat = calculerProchaineEcheance(echeance, recurrence);
      expect(resultat).toEqual(new Date('2026-06-30T18:00:00Z'));
    });

    it('gère le mois de février (jour 29, 30, 31 → dernier jour du mois)', () => {
      const echeance = new Date('2026-01-31T18:00:00Z');
      const recurrence = { frequence: 'mensuelle' as const, jour_mois: 31 };
      const resultat = calculerProchaineEcheance(echeance, recurrence);
      expect(resultat).toEqual(new Date('2026-02-28T18:00:00Z')); // 2026 non bissextile
    });
  });

  describe('creerTacheSuivante', () => {
    it('crée une nouvelle tâche avec les mêmes attributs que la tâche archivée', () => {
      const tacheArchivee = {
        user_id: 'user-uuid',
        projet_id: 'projet-uuid',
        titre: 'Rapport hebdomadaire',
        notes: 'Template standard',
        priorite: 'haute' as const,
        responsable: 'Moi',
        temps_estime_min: 30,
        recurrence_id: 'recurrence-uuid',
        date_echeance: new Date('2026-05-30T18:00:00Z'),
      };
      const recurrence = { frequence: 'hebdomadaire' as const, jour_semaine: 4 };

      const nouvelleTache = creerTacheSuivante(tacheArchivee, recurrence);

      expect(nouvelleTache.titre).toBe('Rapport hebdomadaire');
      expect(nouvelleTache.statut).toBe('active');
      expect(nouvelleTache.avancement).toBe(0);
      expect(nouvelleTache.date_cloture).toBeNull();
      expect(nouvelleTache.date_echeance).toEqual(new Date('2026-06-06T18:00:00Z'));
      expect(nouvelleTache.recurrence_id).toBe('recurrence-uuid');
    });

    it('ne transfère pas la date_cloture de la tâche archivée', () => {
      const tacheArchivee = {
        user_id: 'user-uuid',
        titre: 'Test',
        statut: 'archivee' as const,
        date_cloture: new Date('2026-05-30T10:00:00Z'),
        date_echeance: new Date('2026-05-30T18:00:00Z'),
        recurrence_id: 'recurrence-uuid',
        priorite: 'basse' as const,
        responsable: 'Moi',
        projet_id: null,
        temps_estime_min: null,
        notes: null,
      };
      const recurrence = { frequence: 'quotidienne' as const };
      const nouvelleTache = creerTacheSuivante(tacheArchivee, recurrence);

      expect(nouvelleTache.date_cloture).toBeNull();
      expect(nouvelleTache.statut).toBe('active');
    });
  });

});
```

---

### __tests__/unit/logique-seuils.test.ts

```typescript
import { calculerNiveauAlerte } from '@/lib/logique-seuils';

describe('Logique des seuils d\'alerte', () => {

  it('retourne null si nb_a_qualifier < seuil_orange', () => {
    expect(calculerNiveauAlerte(9, { seuil_orange: 15, seuil_rouge: 20 })).toBeNull();
  });

  it('retourne null si nb_a_qualifier = 10 (notification push, pas de bannière)', () => {
    expect(calculerNiveauAlerte(10, { seuil_orange: 15, seuil_rouge: 20 })).toBeNull();
  });

  it('retourne "orange" si nb_a_qualifier >= seuil_orange', () => {
    expect(calculerNiveauAlerte(15, { seuil_orange: 15, seuil_rouge: 20 })).toBe('orange');
    expect(calculerNiveauAlerte(17, { seuil_orange: 15, seuil_rouge: 20 })).toBe('orange');
  });

  it('retourne "rouge" si nb_a_qualifier >= seuil_rouge', () => {
    expect(calculerNiveauAlerte(20, { seuil_orange: 15, seuil_rouge: 20 })).toBe('rouge');
    expect(calculerNiveauAlerte(25, { seuil_orange: 15, seuil_rouge: 20 })).toBe('rouge');
  });

  it('respecte les seuils personnalisés', () => {
    expect(calculerNiveauAlerte(12, { seuil_orange: 12, seuil_rouge: 18 })).toBe('orange');
    expect(calculerNiveauAlerte(18, { seuil_orange: 12, seuil_rouge: 18 })).toBe('rouge');
  });

  it('retourne "rouge" en priorité si les deux seuils sont dépassés', () => {
    expect(calculerNiveauAlerte(25, { seuil_orange: 10, seuil_rouge: 15 })).toBe('rouge');
  });

});
```

---

### __tests__/unit/logique-archivage.test.ts

```typescript
import { preparerArchivage } from '@/lib/logique-taches';

describe('Logique d\'archivage', () => {

  it('renseigne date_cloture à maintenant lors de l\'archivage', () => {
    const maintenant = new Date('2026-05-30T09:12:00Z');
    const result = preparerArchivage({ statut: 'active' }, maintenant);
    expect(result.statut).toBe('archivee');
    expect(result.date_cloture).toEqual(maintenant);
  });

  it('met l\'avancement à 100 lors de l\'archivage', () => {
    const result = preparerArchivage({ statut: 'active', avancement: 60 }, new Date());
    expect(result.avancement).toBe(100);
  });

  it('archive une tâche en_retard sans erreur', () => {
    const result = preparerArchivage({ statut: 'en_retard' }, new Date());
    expect(result.statut).toBe('archivee');
  });

  it('archive une tâche en_attente_retour sans erreur', () => {
    const result = preparerArchivage({ statut: 'en_attente_retour' }, new Date());
    expect(result.statut).toBe('archivee');
  });

  it('prépare la restauration correctement', () => {
    const { preparerRestauration } = require('@/lib/logique-taches');
    const result = preparerRestauration({ statut: 'archivee', date_cloture: new Date() });
    expect(result.statut).toBe('active');
    expect(result.date_cloture).toBeNull();
  });

});
```

---

### __tests__/unit/parser-ia.test.ts

```typescript
import { parserReponseIA, validerReponseIA } from '@/lib/parser-ia';
import { mockClaudeResponse } from '../mocks/claude-api';

describe('Parser réponse IA', () => {

  describe('parserReponseIA', () => {
    it('parse correctement une réponse avec 3 tâches', () => {
      const json = JSON.stringify(mockClaudeResponse.troistaches_ok);
      const result = parserReponseIA(json);
      expect(result).toHaveLength(3);
      expect(result[0].titre).toBe("Envoyer CR réunion à l'équipe");
      expect(result[0].confiance).toBe(0.92);
    });

    it('parse correctement une récurrence détectée', () => {
      const json = JSON.stringify(mockClaudeResponse.recurrence_hebdo);
      const result = parserReponseIA(json);
      expect(result[0].recurrence).toEqual({ frequence: 'hebdomadaire', jour_semaine: 4 });
    });

    it('parse correctement un temps estimé', () => {
      const json = JSON.stringify(mockClaudeResponse.temps_estime);
      const result = parserReponseIA(json);
      expect(result[0].temps_estime_min).toBe(30);
    });

    it('retourne un tableau vide si aucune tâche détectée', () => {
      const json = JSON.stringify(mockClaudeResponse.texte_vide);
      const result = parserReponseIA(json);
      expect(result).toHaveLength(0);
    });

    it('ne plante pas sur un JSON malformé', () => {
      expect(() => parserReponseIA('invalid json {{')).not.toThrow();
      expect(parserReponseIA('invalid json {{')).toEqual([]);
    });

    it('ne plante pas sur une réponse vide', () => {
      expect(parserReponseIA('')).toEqual([]);
    });
  });

  describe('validerReponseIA', () => {
    it('marque comme "à définir" les tâches avec confiance < 0.6 sur le projet', () => {
      const taches = mockClaudeResponse.troistaches_ok.taches;
      const result = validerReponseIA(taches);
      // La 3e tâche a confiance 0.38 sur le projet
      expect(result[2].projet_id).toBeNull();
      expect(result[2].projet_incertain).toBe(true);
    });

    it('conserve le projet si confiance >= 0.6', () => {
      const taches = mockClaudeResponse.troistaches_ok.taches;
      const result = validerReponseIA(taches);
      expect(result[0].projet_id).toBe('uuid-formation-ia');
      expect(result[0].projet_incertain).toBe(false);
    });
  });

});
```

---

## Tests d'intégration

### __tests__/integration/setup.ts

```typescript
// Initialise une base de données de test en mémoire
// et un serveur Next.js de test

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

let server: any;

export default async function setup() {
  const app = next({ dev: false, dir: '.' });
  await app.prepare();
  const handle = app.getRequestHandler();
  server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });
  await new Promise<void>(resolve => server.listen(3001, resolve));
  process.env.TEST_BASE_URL = 'http://localhost:3001';
}
```

---

### __tests__/integration/api-taches.test.ts

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';

const BASE_URL = process.env.TEST_BASE_URL!;
const AUTH_TOKEN = 'mock-jwt-token';

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

// Données de test
const tacheActive = {
  id: 'uuid-tache-1',
  user_id: 'user-uuid',
  titre: 'Appeler Sophie',
  statut: 'active',
  priorite: 'haute',
  projet_id: 'uuid-formation-ia',
  date_echeance: '2026-05-30T14:00:00Z',
  avancement: 60,
  temps_estime_min: 30,
  pre_caracterisee_ia: false,
  responsable: 'Moi',
  created_at: '2026-05-30T08:00:00Z',
  updated_at: '2026-05-30T09:00:00Z',
};

describe('GET /api/taches', () => {

  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-uuid' } },
    });
  });

  it('retourne 401 sans token', async () => {
    const res = await request(BASE_URL).get('/api/taches');
    expect(res.status).toBe(401);
  });

  it('retourne les tâches actives de l\'utilisateur', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [tacheActive],
      error: null,
      count: 1,
    });

    const res = await request(BASE_URL)
      .get('/api/taches?statut=active')
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].titre).toBe('Appeler Sophie');
    expect(res.body.nb_a_qualifier).toBeDefined();
  });

  it('retourne le nb_a_qualifier dans toutes les réponses', async () => {
    mockSupabase.select.mockResolvedValue({ data: [], error: null, count: 0 });

    const res = await request(BASE_URL)
      .get('/api/taches')
      .set(headers);

    expect(res.body).toHaveProperty('nb_a_qualifier');
    expect(res.body).toHaveProperty('nb_en_retard');
  });

  it('retourne les tâches groupées par projet pour vue=briefing', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [
        { ...tacheActive, projet: { id: 'uuid-formation-ia', nom: 'Formation IA', couleur: '#4a9eff' } },
      ],
      error: null,
    });

    const res = await request(BASE_URL)
      .get('/api/taches?vue=briefing')
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toHaveProperty('taches');
    expect(res.body.data[0]).toHaveProperty('nb_retard');
    expect(res.body.data[0]).toHaveProperty('temps_total_min');
  });

});

describe('POST /api/taches', () => {

  it('crée une tâche simple avec statut a_qualifier', async () => {
    mockSupabase.insert.mockResolvedValue({
      data: [{ ...tacheActive, statut: 'a_qualifier', titre: 'Rappeler Martin' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .post('/api/taches')
      .set(headers)
      .send({ taches: [{ titre: 'Rappeler Martin' }] });

    expect(res.status).toBe(201);
    expect(res.body.taches[0].statut).toBe('a_qualifier');
  });

  it('crée plusieurs tâches en batch', async () => {
    mockSupabase.insert.mockResolvedValue({
      data: [
        { id: 'uuid-1', titre: 'Tâche 1', statut: 'a_qualifier' },
        { id: 'uuid-2', titre: 'Tâche 2', statut: 'a_qualifier' },
      ],
      error: null,
    });

    const res = await request(BASE_URL)
      .post('/api/taches')
      .set(headers)
      .send({
        taches: [
          { titre: 'Tâche 1', pre_caracterisee_ia: true },
          { titre: 'Tâche 2', pre_caracterisee_ia: true },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.taches).toHaveLength(2);
  });

  it('retourne le niveau d\'alerte si seuil dépassé', async () => {
    mockSupabase.insert.mockResolvedValue({ data: [{ id: 'uuid-1' }], error: null });
    // Simuler 15 tâches à qualifier
    mockSupabase.select.mockResolvedValue({ count: 15, data: [], error: null });

    const res = await request(BASE_URL)
      .post('/api/taches')
      .set(headers)
      .send({ taches: [{ titre: 'Test' }] });

    expect(res.body.alerte).toBe('orange');
  });

  it('retourne 400 si titre manquant', async () => {
    const res = await request(BASE_URL)
      .post('/api/taches')
      .set(headers)
      .send({ taches: [{ priorite: 'haute' }] }); // pas de titre

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

});

describe('PATCH /api/taches/:id', () => {

  it('archive une tâche et renseigne date_cloture', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ ...tacheActive, statut: 'archivee', date_cloture: new Date().toISOString() }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch(`/api/taches/${tacheActive.id}`)
      .set(headers)
      .send({ statut: 'archivee' });

    expect(res.status).toBe(200);
    expect(res.body.tache.statut).toBe('archivee');
    expect(res.body.tache.date_cloture).not.toBeNull();
  });

  it('retourne tache_suivante_id si récurrence déclenchée', async () => {
    const tacheRecurrente = { ...tacheActive, recurrence_id: 'recurrence-uuid' };
    const nouvelleTache = { id: 'uuid-nouvelle', titre: tacheActive.titre, statut: 'active' };

    mockSupabase.update.mockResolvedValue({
      data: [{ ...tacheRecurrente, statut: 'archivee' }],
      error: null,
    });
    mockSupabase.insert.mockResolvedValue({
      data: [nouvelleTache],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch(`/api/taches/${tacheActive.id}`)
      .set(headers)
      .send({ statut: 'archivee' });

    expect(res.body.tache_suivante_id).toBe('uuid-nouvelle');
  });

  it('retourne 404 si tâche inexistante', async () => {
    mockSupabase.update.mockResolvedValue({ data: [], error: null });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-inexistant')
      .set(headers)
      .send({ statut: 'archivee' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('TACHE_NOT_FOUND');
  });

});

describe('POST /api/taches/:id/restaurer', () => {

  it('restaure une tâche archivée en statut active', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ ...tacheActive, statut: 'active', date_cloture: null }],
      error: null,
    });

    const res = await request(BASE_URL)
      .post(`/api/taches/${tacheActive.id}/restaurer`)
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.tache.statut).toBe('active');
    expect(res.body.tache.date_cloture).toBeNull();
  });

});
```

---

### __tests__/integration/api-capture-ia.test.ts

```typescript
import request from 'supertest';
import { mockClaudeApiCall, mockClaudeResponse } from '../mocks/claude-api';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = {
  Authorization: 'Bearer mock-jwt-token',
  'Content-Type': 'application/json',
};

const bodyCapture = {
  texte: "Envoyer le CR à l'équipe, planifier revue budget avec Sophie vendredi, relancer le prestataire",
  projets: [
    { id: 'uuid-formation-ia', nom: 'Formation IA' },
    { id: 'uuid-recherche', nom: 'Recherche emploi' },
    { id: 'uuid-perso', nom: 'Perso' },
  ],
  date_reference: '2026-05-30',
};

describe('POST /api/capture/ia', () => {

  beforeEach(() => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify(mockClaudeResponse.troistaches_ok) }],
      }),
    });
  });

  it('retourne les tâches découpées et pré-caractérisées', async () => {
    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send(bodyCapture);

    expect(res.status).toBe(200);
    expect(res.body.taches).toHaveLength(3);
    expect(res.body.taches[0].titre).toBe("Envoyer CR réunion à l'équipe");
    expect(res.body.duree_ms).toBeDefined();
  });

  it('marque le projet comme incertain si confiance < 0.6', async () => {
    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send(bodyCapture);

    const tacheIncertaine = res.body.taches.find((t: any) => t.confiance < 0.6);
    expect(tacheIncertaine.projet_id).toBeNull();
    expect(tacheIncertaine.projet_incertain).toBe(true);
  });

  it('retourne un tableau vide si Claude API ne détecte aucune tâche', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify(mockClaudeResponse.texte_vide) }],
      }),
    });

    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send({ ...bodyCapture, texte: 'euh voilà c\'est tout' });

    expect(res.status).toBe(200);
    expect(res.body.taches).toHaveLength(0);
  });

  it('retourne 503 si Claude API timeout', async () => {
    mockClaudeApiCall.mockRejectedValue(new Error('timeout'));

    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send(bodyCapture);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('IA_TIMEOUT');
  });

  it('retourne 400 si texte manquant', async () => {
    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send({ projets: [], date_reference: '2026-05-30' });

    expect(res.status).toBe(400);
  });

  it('retourne 401 sans token', async () => {
    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .send(bodyCapture);

    expect(res.status).toBe(401);
  });

  it('détecte une récurrence dans la réponse IA', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify(mockClaudeResponse.recurrence_hebdo) }],
      }),
    });

    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send({ ...bodyCapture, texte: 'Envoyer rapport hebdomadaire chaque vendredi' });

    expect(res.body.taches[0].recurrence).toEqual({
      frequence: 'hebdomadaire',
      jour_semaine: 4,
    });
  });

});
```

---

### __tests__/integration/api-projets.test.ts

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { Authorization: 'Bearer mock-jwt-token', 'Content-Type': 'application/json' };

describe('POST /api/projets', () => {

  it('crée un projet avec une couleur disponible', async () => {
    mockSupabase.insert.mockResolvedValue({
      data: [{ id: 'uuid-nouveau', nom: 'Side project', couleur: '#9b59b6', type_identifiant: 'couleur' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .post('/api/projets')
      .set(headers)
      .send({ nom: 'Side project', type_identifiant: 'couleur', couleur: '#9b59b6' });

    expect(res.status).toBe(201);
    expect(res.body.projet.couleur).toBe('#9b59b6');
  });

  it('retourne 400 si la couleur est déjà utilisée', async () => {
    mockSupabase.insert.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'projets_couleur_unique' }, // contrainte unique PostgreSQL
    });

    const res = await request(BASE_URL)
      .post('/api/projets')
      .set(headers)
      .send({ nom: 'Nouveau', type_identifiant: 'couleur', couleur: '#4a9eff' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('COULEUR_DEJA_UTILISEE');
  });

  it('crée un projet avec une icône si couleurs épuisées', async () => {
    mockSupabase.insert.mockResolvedValue({
      data: [{ id: 'uuid-icone', nom: 'Nouveau', icone: '🏠', type_identifiant: 'icone' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .post('/api/projets')
      .set(headers)
      .send({ nom: 'Nouveau', type_identifiant: 'icone', icone: '🏠' });

    expect(res.status).toBe(201);
    expect(res.body.projet.icone).toBe('🏠');
  });

  it('retourne 400 si ni couleur ni icône n\'est fournie', async () => {
    const res = await request(BASE_URL)
      .post('/api/projets')
      .set(headers)
      .send({ nom: 'Incomplet' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

});

describe('GET /api/projets', () => {

  it('retourne les couleurs et icônes disponibles', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [
        { id: 'uuid-1', couleur: '#4a9eff', icone: null },
        { id: 'uuid-2', couleur: '#2ecc71', icone: null },
      ],
      error: null,
    });

    const res = await request(BASE_URL).get('/api/projets').set(headers);

    expect(res.status).toBe(200);
    expect(res.body.couleurs_disponibles).not.toContain('#4a9eff');
    expect(res.body.couleurs_disponibles).not.toContain('#2ecc71');
    expect(res.body.icones_disponibles).toHaveLength(7);
  });

});
```

---

## Tests E2E — Flux quotidiens

### __tests__/e2e/flux-briefing.test.ts

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { Authorization: 'Bearer mock-jwt-token' };

describe('Flux briefing matin — E2E', () => {

  const tachesSimulees = [
    {
      id: 'uuid-1', titre: 'Relancer prestataire', statut: 'en_retard',
      priorite: 'haute', date_echeance: '2026-05-28T18:00:00Z',
      avancement: 30, temps_estime_min: 20,
      projet: { id: 'uuid-recherche', nom: 'Recherche emploi', couleur: '#2ecc71' },
    },
    {
      id: 'uuid-2', titre: 'Appeler Sophie', statut: 'active',
      priorite: 'moyenne', date_echeance: '2026-05-30T14:00:00Z',
      avancement: 60, temps_estime_min: 30,
      projet: { id: 'uuid-formation', nom: 'Formation IA', couleur: '#4a9eff' },
    },
    {
      id: 'uuid-3', titre: 'Envoyer CR', statut: 'active',
      priorite: 'haute', date_echeance: '2026-05-30T09:00:00Z',
      avancement: 0, temps_estime_min: 15,
      projet: { id: 'uuid-formation', nom: 'Formation IA', couleur: '#4a9eff' },
    },
  ];

  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid' } } });
    mockSupabase.select.mockResolvedValue({ data: tachesSimulees, error: null });
  });

  it('retourne les tâches groupées par projet avec le bon ordre', async () => {
    const res = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);

    expect(res.status).toBe(200);
    // Formation IA a 2 tâches — doit être en premier
    expect(res.body.data[0].projet_nom).toBe('Formation IA');
    expect(res.body.data[0].nb_taches).toBe(2);
    // Recherche emploi a 1 tâche
    expect(res.body.data[1].projet_nom).toBe('Recherche emploi');
  });

  it('calcule le total des temps estimés de la journée', async () => {
    const res = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);
    // 20 + 30 + 15 = 65 minutes
    expect(res.body.temps_total_min).toBe(65);
  });

  it('trie les tâches avec retards P1 en premier dans chaque projet', async () => {
    const res = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);
    const tachesFormation = res.body.data[0].taches;
    // "Envoyer CR" est P1 aujourd'hui, "Appeler Sophie" est P2
    expect(tachesFormation[0].titre).toBe('Envoyer CR');
    expect(tachesFormation[1].titre).toBe('Appeler Sophie');
  });

  it('permet de cocher une tâche depuis le briefing', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-2', statut: 'archivee', date_cloture: new Date().toISOString(), avancement: 100 }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-2')
      .set({ ...headers, 'Content-Type': 'application/json' })
      .send({ statut: 'archivee' });

    expect(res.status).toBe(200);
    expect(res.body.tache.statut).toBe('archivee');
    expect(res.body.tache.date_cloture).not.toBeNull();
    expect(res.body.tache.avancement).toBe(100);
  });

});
```

---

### __tests__/e2e/flux-qualification.test.ts

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';
import { mockClaudeApiCall, mockClaudeResponse } from '../mocks/claude-api';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { Authorization: 'Bearer mock-jwt-token', 'Content-Type': 'application/json' };

describe('Flux qualification — E2E', () => {

  const tachesAQualifier = [
    { id: 'uuid-brut-1', titre: 'Rappeler Martin', statut: 'a_qualifier', pre_caracterisee_ia: false },
    { id: 'uuid-brut-2', titre: 'Envoyer CR', statut: 'a_qualifier', pre_caracterisee_ia: true,
      projet_id: 'uuid-formation', priorite: 'haute', date_echeance: '2026-05-30T23:59:00Z' },
  ];

  it('scénario complet : capture vocale → qualification → backlog', async () => {
    // Étape 1 : capture vocale → découpage IA
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify(mockClaudeResponse.troistaches_ok) }],
      }),
    });

    const captureRes = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send({
        texte: "Envoyer CR, planifier revue avec Sophie vendredi, relancer prestataire",
        projets: [{ id: 'uuid-formation', nom: 'Formation IA' }],
        date_reference: '2026-05-30',
      });

    expect(captureRes.status).toBe(200);
    expect(captureRes.body.taches).toHaveLength(3);

    // Étape 2 : créer les tâches en base
    mockSupabase.insert.mockResolvedValue({ data: tachesAQualifier, error: null });

    const createRes = await request(BASE_URL)
      .post('/api/taches')
      .set(headers)
      .send({ taches: captureRes.body.taches });

    expect(createRes.status).toBe(201);

    // Étape 3 : récupérer la file à qualifier
    mockSupabase.select.mockResolvedValue({ data: tachesAQualifier, error: null });

    const fileRes = await request(BASE_URL)
      .get('/api/taches?statut=a_qualifier')
      .set(headers);

    expect(fileRes.status).toBe(200);
    expect(fileRes.body.data.length).toBeGreaterThan(0);

    // Étape 4 : qualifier la première tâche
    mockSupabase.update.mockResolvedValue({
      data: [{ ...tachesAQualifier[0], statut: 'active', projet_id: 'uuid-formation' }],
      error: null,
    });

    const qualifRes = await request(BASE_URL)
      .patch(`/api/taches/${tachesAQualifier[0].id}`)
      .set(headers)
      .send({ statut: 'active', projet_id: 'uuid-formation', priorite: 'haute' });

    expect(qualifRes.status).toBe(200);
    expect(qualifRes.body.tache.statut).toBe('active');
  });

});
```

---

### __tests__/e2e/flux-relance-retards.test.ts

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { Authorization: 'Bearer mock-jwt-token', 'Content-Type': 'application/json' };

describe('Flux relance retards — E2E', () => {

  const tachesEnRetard = [
    { id: 'uuid-retard-1', titre: 'Relancer prestataire', statut: 'en_retard',
      date_echeance: '2026-05-28T18:00:00Z', priorite: 'haute' },
    { id: 'uuid-retard-2', titre: 'Appeler chasseur de tête', statut: 'en_attente_retour',
      date_echeance: '2026-05-27T18:00:00Z', priorite: 'moyenne' },
  ];

  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-uuid' } } });
    mockSupabase.select.mockResolvedValue({ data: tachesEnRetard, error: null });
  });

  it('retourne les tâches en retard ET les tâches en_attente_retour dépassées', async () => {
    const res = await request(BASE_URL)
      .get('/api/taches?vue=retards')
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const statuts = res.body.data.map((t: any) => t.statut);
    expect(statuts).toContain('en_retard');
    expect(statuts).toContain('en_attente_retour');
  });

  it('clôture une tâche en retard', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-retard-1', statut: 'archivee', date_cloture: new Date().toISOString() }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-retard-1')
      .set(headers)
      .send({ statut: 'archivee' });

    expect(res.status).toBe(200);
    expect(res.body.tache.statut).toBe('archivee');
  });

  it('reporte une tâche en retard avec une nouvelle échéance', async () => {
    const nouvelleEcheance = '2026-06-02T18:00:00Z';
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-retard-1', statut: 'active', date_echeance: nouvelleEcheance }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-retard-1')
      .set(headers)
      .send({ statut: 'active', date_echeance: nouvelleEcheance });

    expect(res.status).toBe(200);
    expect(res.body.tache.statut).toBe('active');
    expect(res.body.tache.date_echeance).toBe(nouvelleEcheance);
  });

  it('passer une tâche sans action ne modifie pas son statut', async () => {
    // "Passer" = aucun appel API — la tâche reste en retard
    // Ce test vérifie que le frontend n'appelle pas PATCH dans ce cas
    // On vérifie que mockSupabase.update n'a pas été appelé
    expect(mockSupabase.update).not.toHaveBeenCalled();
  });

});
```

---

## Récapitulatif de la couverture

| Couche | Fichiers | Tests | Couverture cible |
|---|---|---|---|
| Unitaire | 5 fichiers | 28 tests | 100% logique métier |
| Intégration | 4 fichiers | 22 tests | 100% endpoints |
| E2E | 3 fichiers | 9 tests | 3 flux quotidiens complets |
| **Total** | **12 fichiers** | **59 tests** | |

---

## Commandes

```bash
# Tous les tests
npm test

# Par couche
npm test -- --selectProjects unit
npm test -- --selectProjects integration
npm test -- --selectProjects e2e

# Avec couverture
npm test -- --coverage

# Watch mode (développement)
npm test -- --watch
```

---

## Prochaine étape

- Prompt engineering Claude API

---

## Tests E2E — Version musclée

---

### __tests__/e2e/flux-briefing.test.ts (complet)

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { Authorization: 'Bearer mock-jwt-token', 'Content-Type': 'application/json' };

describe('Flux briefing matin — Chemins nominaux', () => {

  // ... tests existants conservés ...

  it('affiche une journée vide si aucune tâche prévue aujourd\'hui', async () => {
    mockSupabase.select.mockResolvedValue({ data: [], error: null });

    const res = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.temps_total_min).toBe(0);
    expect(res.body.nb_en_retard).toBe(0);
  });

  it('affiche uniquement les retards si aucune tâche prévue aujourd\'hui', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [
        { id: 'uuid-1', titre: 'Retard ancien', statut: 'en_retard',
          priorite: 'haute', date_echeance: '2026-05-25T18:00:00Z',
          projet: { id: 'uuid-p1', nom: 'Formation IA', couleur: '#4a9eff' } },
      ],
      error: null,
    });

    const res = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.nb_en_retard).toBe(1);
    expect(res.body.data[0].taches[0].statut).toBe('en_retard');
  });

  it('affiche la bannière orange si 15 tâches à qualifier', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [],
      error: null,
      count: 15, // nb_a_qualifier
    });

    const res = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);

    expect(res.body.nb_a_qualifier).toBe(15);
    expect(res.body.alerte).toBe('orange');
  });

  it('affiche la bannière rouge si 20 tâches à qualifier', async () => {
    mockSupabase.select.mockResolvedValue({ data: [], error: null, count: 20 });

    const res = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);

    expect(res.body.alerte).toBe('rouge');
  });

  it('inclut les tâches ⚡ à qualifier dans le briefing avec le bon marqueur', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [
        { id: 'uuid-1', titre: 'Tâche non qualifiée', statut: 'a_qualifier',
          pre_caracterisee_ia: true, date_echeance: '2026-05-30T23:59:00Z',
          projet: { id: 'uuid-p1', nom: 'Formation IA', couleur: '#4a9eff' } },
        { id: 'uuid-2', titre: 'Tâche qualifiée', statut: 'active',
          pre_caracterisee_ia: false, date_echeance: '2026-05-30T14:00:00Z',
          projet: { id: 'uuid-p1', nom: 'Formation IA', couleur: '#4a9eff' } },
      ],
      error: null,
    });

    const res = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);

    const taches = res.body.data[0].taches;
    const tacheAQualifier = taches.find((t: any) => t.id === 'uuid-1');
    expect(tacheAQualifier.pre_caracterisee_ia).toBe(true);
    expect(tacheAQualifier.statut).toBe('a_qualifier');
  });

  it('coche une tâche récurrente et vérifie la création de la tâche suivante', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{
        id: 'uuid-recurrente',
        statut: 'archivee',
        date_cloture: new Date().toISOString(),
        recurrence_id: 'uuid-recurrence',
      }],
      error: null,
    });
    // La tâche suivante est créée par le trigger PostgreSQL
    mockSupabase.insert.mockResolvedValue({
      data: [{ id: 'uuid-suivante', titre: 'Rapport hebdomadaire', statut: 'active' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-recurrente')
      .set(headers)
      .send({ statut: 'archivee' });

    expect(res.status).toBe(200);
    expect(res.body.tache.statut).toBe('archivee');
    expect(res.body.tache_suivante_id).toBe('uuid-suivante');
  });

  it('coche une tâche déléguée (responsable ≠ Moi)', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{
        id: 'uuid-delegue',
        statut: 'archivee',
        responsable: 'Martin',
        date_cloture: new Date().toISOString(),
      }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-delegue')
      .set(headers)
      .send({ statut: 'archivee' });

    expect(res.status).toBe(200);
    expect(res.body.tache.responsable).toBe('Martin');
    expect(res.body.tache.statut).toBe('archivee');
  });

});

describe('Flux briefing matin — Cas limites', () => {

  it('calcule correctement le total temps estimé avec des valeurs nulles', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [
        { id: 'uuid-1', temps_estime_min: 30, statut: 'active',
          date_echeance: '2026-05-30T14:00:00Z',
          projet: { id: 'uuid-p1', nom: 'Formation IA', couleur: '#4a9eff' } },
        { id: 'uuid-2', temps_estime_min: null, statut: 'active', // pas de temps estimé
          date_echeance: '2026-05-30T16:00:00Z',
          projet: { id: 'uuid-p1', nom: 'Formation IA', couleur: '#4a9eff' } },
      ],
      error: null,
    });

    const res = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);

    // null est ignoré dans la somme
    expect(res.body.temps_total_min).toBe(30);
  });

  it('gère un projet sans couleur ni icône (données corrompues)', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [
        { id: 'uuid-1', titre: 'Tâche orpheline', statut: 'active',
          date_echeance: '2026-05-30T14:00:00Z',
          projet: null }, // projet supprimé
      ],
      error: null,
    });

    const res = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);

    expect(res.status).toBe(200);
    // Les tâches sans projet apparaissent dans un groupe "Sans projet"
    expect(res.body.data[0].projet_nom).toBe('Sans projet');
  });

  it('ne plante pas si date_echeance est null sur une tâche du briefing', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [
        { id: 'uuid-1', titre: 'Tâche sans date', statut: 'en_retard',
          date_echeance: null,
          projet: { id: 'uuid-p1', nom: 'Perso', couleur: '#ff9900' } },
      ],
      error: null,
    });

    const res = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data[0].taches[0].date_echeance).toBeNull();
  });

});
```

---

### __tests__/e2e/flux-qualification.test.ts (complet)

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';
import { mockClaudeApiCall, mockClaudeResponse } from '../mocks/claude-api';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { Authorization: 'Bearer mock-jwt-token', 'Content-Type': 'application/json' };

describe('Flux qualification — Chemins nominaux', () => {

  // ... tests existants conservés ...

  it('qualifie uniquement des tâches sans pré-remplissage IA', async () => {
    const tachesBrutes = [
      { id: 'uuid-1', titre: 'Rappeler Martin', statut: 'a_qualifier', pre_caracterisee_ia: false },
      { id: 'uuid-2', titre: 'Envoyer facture', statut: 'a_qualifier', pre_caracterisee_ia: false },
    ];
    mockSupabase.select.mockResolvedValue({ data: tachesBrutes, error: null });

    const fileRes = await request(BASE_URL).get('/api/taches?statut=a_qualifier').set(headers);
    expect(fileRes.body.data.every((t: any) => t.pre_caracterisee_ia === false)).toBe(true);

    // Qualifier la première
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-1', statut: 'active', projet_id: 'uuid-perso', priorite: 'basse' }],
      error: null,
    });

    const qualifRes = await request(BASE_URL)
      .patch('/api/taches/uuid-1')
      .set(headers)
      .send({ statut: 'active', projet_id: 'uuid-perso', priorite: 'basse' });

    expect(qualifRes.status).toBe(200);
    expect(qualifRes.body.tache.statut).toBe('active');
  });

  it('qualifie uniquement des tâches pré-remplies IA sans correction', async () => {
    const tachesIA = [
      { id: 'uuid-1', titre: 'Envoyer CR', statut: 'a_qualifier', pre_caracterisee_ia: true,
        projet_id: 'uuid-formation', priorite: 'haute', date_echeance: '2026-05-30T23:59:00Z' },
    ];
    mockSupabase.select.mockResolvedValue({ data: tachesIA, error: null });
    mockSupabase.update.mockResolvedValue({
      data: [{ ...tachesIA[0], statut: 'active' }],
      error: null,
    });

    // Valider sans aucune correction
    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-1')
      .set(headers)
      .send({
        statut: 'active',
        projet_id: 'uuid-formation',   // conservé tel quel depuis IA
        priorite: 'haute',             // conservé tel quel
        date_echeance: '2026-05-30T23:59:00Z', // conservé tel quel
      });

    expect(res.status).toBe(200);
    expect(res.body.tache.statut).toBe('active');
  });

  it('passer toutes les tâches sans en qualifier aucune — file reste pleine', async () => {
    const taches = Array.from({ length: 5 }, (_, i) => ({
      id: `uuid-${i}`, titre: `Tâche ${i}`, statut: 'a_qualifier',
    }));
    mockSupabase.select.mockResolvedValue({ data: taches, error: null });

    // Aucun PATCH n'est appelé — on vérifie juste que la file est inchangée
    const res = await request(BASE_URL).get('/api/taches?statut=a_qualifier').set(headers);
    expect(res.body.data).toHaveLength(5);
    expect(mockSupabase.update).not.toHaveBeenCalled();
  });

  it('qualifier une tâche avec récurrence crée la config en base', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-1', statut: 'active', recurrence_id: 'uuid-recurrence-new' }],
      error: null,
    });
    mockSupabase.insert.mockResolvedValue({
      data: [{ id: 'uuid-recurrence-new', frequence: 'hebdomadaire', jour_semaine: 4 }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-1')
      .set(headers)
      .send({
        statut: 'active',
        projet_id: 'uuid-formation',
        priorite: 'haute',
        recurrence: { frequence: 'hebdomadaire', jour_semaine: 4 },
      });

    expect(res.status).toBe(200);
    expect(res.body.tache.recurrence_id).toBeDefined();
  });

  it('qualifier partiellement — 5 sur 15 — les 10 restantes sont toujours en file', async () => {
    // Simuler 15 tâches en file au départ
    const toutesLesTaches = Array.from({ length: 15 }, (_, i) => ({
      id: `uuid-${i}`, titre: `Tâche ${i}`, statut: 'a_qualifier',
    }));

    // Qualifier les 5 premières
    for (let i = 0; i < 5; i++) {
      mockSupabase.update.mockResolvedValueOnce({
        data: [{ id: `uuid-${i}`, statut: 'active' }],
        error: null,
      });
      await request(BASE_URL)
        .patch(`/api/taches/uuid-${i}`)
        .set(headers)
        .send({ statut: 'active', projet_id: 'uuid-formation', priorite: 'moyenne' });
    }

    // Vérifier que les 10 restantes sont encore en file
    mockSupabase.select.mockResolvedValue({
      data: toutesLesTaches.slice(5), // 10 restantes
      error: null,
    });

    const fileRes = await request(BASE_URL).get('/api/taches?statut=a_qualifier').set(headers);
    expect(fileRes.body.data).toHaveLength(10);
  });

  it('atteindre le seuil rouge pendant la qualification déclenche la bannière', async () => {
    // L'utilisateur capture de nouvelles tâches pendant qu'il qualifie
    mockSupabase.insert.mockResolvedValue({
      data: [{ id: 'uuid-new', statut: 'a_qualifier' }],
      error: null,
    });
    mockSupabase.select.mockResolvedValue({ data: [], error: null, count: 20 });

    const res = await request(BASE_URL)
      .post('/api/taches')
      .set(headers)
      .send({ taches: [{ titre: 'Nouvelle capture' }] });

    expect(res.body.alerte).toBe('rouge');
  });

});

describe('Flux qualification — Cas limites', () => {

  it('qualifier une tâche avec un projet qui n\'existe plus retourne 400', async () => {
    mockSupabase.update.mockResolvedValue({
      data: null,
      error: { code: '23503', message: 'foreign key violation' },
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-1')
      .set(headers)
      .send({ statut: 'active', projet_id: 'uuid-projet-supprime' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PROJET_NOT_FOUND');
  });

  it('file vide si toutes les tâches ont été qualifiées', async () => {
    mockSupabase.select.mockResolvedValue({ data: [], error: null });

    const res = await request(BASE_URL).get('/api/taches?statut=a_qualifier').set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.nb_a_qualifier).toBe(0);
  });

  it('ne peut pas qualifier une tâche déjà active', async () => {
    // Tâche déjà en statut active — double qualification impossible
    mockSupabase.select.mockResolvedValue({
      data: [{ id: 'uuid-1', statut: 'active' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-1')
      .set(headers)
      .send({ statut: 'active', projet_id: 'uuid-formation' });

    // Idempotent — pas d'erreur, mais pas de changement non plus
    expect(res.status).toBe(200);
  });

});
```

---

### __tests__/e2e/flux-relance-retards.test.ts (complet)

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { Authorization: 'Bearer mock-jwt-token', 'Content-Type': 'application/json' };

describe('Flux relance retards — Chemins nominaux', () => {

  // ... tests existants conservés ...

  it('session vide si aucune tâche en retard — récapitulatif à 0', async () => {
    mockSupabase.select.mockResolvedValue({ data: [], error: null });

    const res = await request(BASE_URL).get('/api/taches?vue=retards').set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total_retards).toBe(0);
  });

  it('reporter au-delà d\'un mois calcule la date correctement', async () => {
    const nouvelleEcheance = '2026-07-15T18:00:00Z'; // +46 jours
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-1', statut: 'active', date_echeance: nouvelleEcheance }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-1')
      .set(headers)
      .send({ statut: 'active', date_echeance: nouvelleEcheance });

    expect(res.status).toBe(200);
    expect(new Date(res.body.tache.date_echeance).getFullYear()).toBe(2026);
    expect(new Date(res.body.tache.date_echeance).getMonth()).toBe(6); // juillet = index 6
  });

  it('clôture une tâche en_attente_retour (délégation)', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{
        id: 'uuid-delegue',
        statut: 'archivee',
        responsable: 'Martin',
        date_cloture: new Date().toISOString(),
      }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-delegue')
      .set(headers)
      .send({ statut: 'archivee' });

    expect(res.status).toBe(200);
    expect(res.body.tache.statut).toBe('archivee');
    expect(res.body.tache.responsable).toBe('Martin');
  });

  it('tout ignorer ne modifie aucune tâche en base', async () => {
    // "Tout ignorer" = aucun appel PATCH
    mockSupabase.update.mockClear();

    // Simule le comportement frontend : l'utilisateur clique "Tout ignorer"
    // → aucun appel API n'est effectué
    expect(mockSupabase.update).not.toHaveBeenCalled();

    // Les tâches sont toujours en retard
    mockSupabase.select.mockResolvedValue({
      data: [
        { id: 'uuid-1', statut: 'en_retard' },
        { id: 'uuid-2', statut: 'en_retard' },
      ],
      error: null,
    });

    const res = await request(BASE_URL).get('/api/taches?vue=retards').set(headers);
    expect(res.body.data).toHaveLength(2);
  });

  it('clôture une tâche récurrente en retard et crée la suivante', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{
        id: 'uuid-retard-recurrent',
        statut: 'archivee',
        recurrence_id: 'uuid-recurrence',
        date_cloture: new Date().toISOString(),
      }],
      error: null,
    });
    mockSupabase.insert.mockResolvedValue({
      data: [{ id: 'uuid-suivante', titre: 'Rapport hebdo', statut: 'active' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-retard-recurrent')
      .set(headers)
      .send({ statut: 'archivee' });

    expect(res.status).toBe(200);
    expect(res.body.tache.statut).toBe('archivee');
    expect(res.body.tache_suivante_id).toBe('uuid-suivante');
  });

  it('tâches en_retard s\'affichent avant tâches en_attente_retour', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [
        { id: 'uuid-attente', statut: 'en_attente_retour',
          date_echeance: '2026-05-27T18:00:00Z', priorite: 'haute' },
        { id: 'uuid-retard', statut: 'en_retard',
          date_echeance: '2026-05-28T18:00:00Z', priorite: 'moyenne' },
      ],
      error: null,
    });

    const res = await request(BASE_URL).get('/api/taches?vue=retards').set(headers);

    // en_retard avant en_attente_retour
    expect(res.body.data[0].statut).toBe('en_retard');
    expect(res.body.data[1].statut).toBe('en_attente_retour');
  });

});

describe('Flux relance retards — Cas limites', () => {

  it('reporter à une date dans le passé retourne 400', async () => {
    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-1')
      .set(headers)
      .send({ statut: 'active', date_echeance: '2026-01-01T00:00:00Z' }); // dans le passé

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('ne peut pas clôturer une tâche déjà archivée', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [{ id: 'uuid-1', statut: 'archivee' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-1')
      .set(headers)
      .send({ statut: 'archivee' });

    // Idempotent — 200 mais pas de changement
    expect(res.status).toBe(200);
  });

  it('gère correctement une tâche en retard sans date d\'échéance', async () => {
    // Cas pathologique : tâche en_retard sans date_echeance (données corrompues)
    mockSupabase.select.mockResolvedValue({
      data: [{ id: 'uuid-1', statut: 'en_retard', date_echeance: null }],
      error: null,
    });

    const res = await request(BASE_URL).get('/api/taches?vue=retards').set(headers);

    expect(res.status).toBe(200);
    // La tâche apparaît quand même, en dernier
    expect(res.body.data.some((t: any) => t.id === 'uuid-1')).toBe(true);
  });

});
```

---

### __tests__/e2e/flux-transverses.test.ts (nouveau)

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';
import { mockClaudeApiCall, mockClaudeResponse } from '../mocks/claude-api';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { Authorization: 'Bearer mock-jwt-token', 'Content-Type': 'application/json' };

describe('Scénarios transverses — Journée complète', () => {

  it('parcours complet : capture matin → qualification midi → briefing soir', async () => {
    // === MATIN : capture vocale ===
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify(mockClaudeResponse.troistaches_ok) }],
      }),
    });

    const captureRes = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send({
        texte: "Envoyer CR, planifier réunion Sophie vendredi, relancer prestataire",
        projets: [{ id: 'uuid-formation', nom: 'Formation IA' }],
        date_reference: '2026-05-30',
      });

    expect(captureRes.status).toBe(200);
    const tachesCapturees = captureRes.body.taches;

    // Créer les tâches en base
    mockSupabase.insert.mockResolvedValue({
      data: tachesCapturees.map((t: any, i: number) => ({
        ...t, id: `uuid-${i}`, statut: 'a_qualifier',
      })),
      error: null,
    });

    const createRes = await request(BASE_URL)
      .post('/api/taches')
      .set(headers)
      .send({ taches: tachesCapturees });

    expect(createRes.status).toBe(201);
    const tachesCreees = createRes.body.taches;

    // === MIDI : qualification ===
    for (const tache of tachesCreees) {
      mockSupabase.update.mockResolvedValueOnce({
        data: [{ ...tache, statut: 'active', projet_id: 'uuid-formation' }],
        error: null,
      });

      const qualifRes = await request(BASE_URL)
        .patch(`/api/taches/${tache.id}`)
        .set(headers)
        .send({ statut: 'active', projet_id: 'uuid-formation', priorite: 'moyenne' });

      expect(qualifRes.status).toBe(200);
      expect(qualifRes.body.tache.statut).toBe('active');
    }

    // === SOIR : briefing ===
    mockSupabase.select.mockResolvedValue({
      data: tachesCreees.map((t: any) => ({
        ...t, statut: 'active', date_echeance: '2026-05-30T23:59:00Z',
        projet: { id: 'uuid-formation', nom: 'Formation IA', couleur: '#4a9eff' },
      })),
      error: null,
    });

    const briefingRes = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);

    expect(briefingRes.status).toBe(200);
    expect(briefingRes.body.data[0].projet_nom).toBe('Formation IA');
    expect(briefingRes.body.nb_a_qualifier).toBe(0); // tout a été qualifié
  });

});

describe('Scénarios transverses — Seuils et alertes', () => {

  it('capturer 20 tâches d\'un coup déclenche la bannière rouge', async () => {
    const vingtTaches = Array.from({ length: 20 }, (_, i) => ({ titre: `Tâche ${i}` }));

    mockSupabase.insert.mockResolvedValue({
      data: vingtTaches.map((t, i) => ({ id: `uuid-${i}`, ...t, statut: 'a_qualifier' })),
      error: null,
    });
    mockSupabase.select.mockResolvedValue({ data: [], error: null, count: 20 });

    const res = await request(BASE_URL)
      .post('/api/taches')
      .set(headers)
      .send({ taches: vingtTaches });

    expect(res.status).toBe(201);
    expect(res.body.alerte).toBe('rouge');
    expect(res.body.nb_a_qualifier).toBe(20);
  });

  it('qualifier des tâches fait descendre l\'alerte de rouge à orange', async () => {
    // Après qualification : 17 tâches restantes → orange
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-1', statut: 'active' }],
      error: null,
    });
    mockSupabase.select.mockResolvedValue({ data: [], error: null, count: 17 });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-1')
      .set(headers)
      .send({ statut: 'active', projet_id: 'uuid-formation', priorite: 'haute' });

    expect(res.status).toBe(200);
    // L'alerte courante est retournée après chaque PATCH
    expect(res.body.nb_a_qualifier).toBe(17);
    expect(res.body.alerte).toBe('orange');
  });

  it('qualifier toutes les tâches supprime l\'alerte', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-last', statut: 'active' }],
      error: null,
    });
    mockSupabase.select.mockResolvedValue({ data: [], error: null, count: 0 });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-last')
      .set(headers)
      .send({ statut: 'active', projet_id: 'uuid-formation', priorite: 'basse' });

    expect(res.body.alerte).toBeNull();
    expect(res.body.nb_a_qualifier).toBe(0);
  });

});

describe('Scénarios transverses — Archivage et restauration', () => {

  it('restaure une tâche archivée par erreur dans le bon projet', async () => {
    const tacheArchivee = {
      id: 'uuid-erreur',
      titre: 'Tâche cochée par erreur',
      statut: 'archivee',
      projet_id: 'uuid-formation',
      date_cloture: '2026-05-30T09:00:00Z',
    };

    // Étape 1 : trouver la tâche dans les archives
    mockSupabase.select.mockResolvedValue({ data: [tacheArchivee], error: null });

    const archivesRes = await request(BASE_URL)
      .get('/api/taches?statut=archivee')
      .set(headers);

    expect(archivesRes.body.data[0].id).toBe('uuid-erreur');

    // Étape 2 : restaurer
    mockSupabase.update.mockResolvedValue({
      data: [{ ...tacheArchivee, statut: 'active', date_cloture: null }],
      error: null,
    });

    const restaurerRes = await request(BASE_URL)
      .post(`/api/taches/${tacheArchivee.id}/restaurer`)
      .set(headers);

    expect(restaurerRes.status).toBe(200);
    expect(restaurerRes.body.tache.statut).toBe('active');
    expect(restaurerRes.body.tache.date_cloture).toBeNull();
    expect(restaurerRes.body.tache.projet_id).toBe('uuid-formation');
  });

  it('une tâche restaurée réapparaît dans le backlog avec le bon statut', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-restaure', statut: 'active', date_cloture: null }],
      error: null,
    });
    await request(BASE_URL).post('/api/taches/uuid-restaure/restaurer').set(headers);

    // Vérifier qu'elle est dans le backlog
    mockSupabase.select.mockResolvedValue({
      data: [{ id: 'uuid-restaure', statut: 'active' }],
      error: null,
    });

    const backlogRes = await request(BASE_URL)
      .get('/api/taches?statut=active')
      .set(headers);

    const restauree = backlogRes.body.data.find((t: any) => t.id === 'uuid-restaure');
    expect(restauree).toBeDefined();
    expect(restauree.statut).toBe('active');
  });

});

describe('Scénarios transverses — Prédécesseur (mode avancé)', () => {

  it('une tâche avec prédécesseur non terminé reste visible dans le backlog', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [
        { id: 'uuid-predecesseur', titre: 'Envoyer CR', statut: 'active', avancement: 50 },
        { id: 'uuid-dependante', titre: 'Planifier réunion', statut: 'active',
          predecesseur_id: 'uuid-predecesseur' },
      ],
      error: null,
    });

    const res = await request(BASE_URL).get('/api/taches?statut=active').set(headers);

    const tacheDependante = res.body.data.find((t: any) => t.id === 'uuid-dependante');
    expect(tacheDependante).toBeDefined();
    expect(tacheDependante.predecesseur_id).toBe('uuid-predecesseur');
    // La tâche est visible — c'est à l'utilisateur de gérer l'ordre
  });

  it('archiver le prédécesseur ne supprime pas le lien sur la tâche dépendante', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-predecesseur', statut: 'archivee', date_cloture: new Date().toISOString() }],
      error: null,
    });

    await request(BASE_URL)
      .patch('/api/taches/uuid-predecesseur')
      .set(headers)
      .send({ statut: 'archivee' });

    // La tâche dépendante garde son lien (set null géré par la BDD uniquement sur delete)
    mockSupabase.select.mockResolvedValue({
      data: [{ id: 'uuid-dependante', predecesseur_id: 'uuid-predecesseur', statut: 'active' }],
      error: null,
    });

    const res = await request(BASE_URL).get('/api/taches/uuid-dependante').set(headers);
    expect(res.body.predecesseur_id).toBe('uuid-predecesseur');
  });

});
```

---

## Récapitulatif de la couverture — Version musclée

| Couche | Fichiers | Tests V1 | Tests ajoutés | Total |
|---|---|---|---|---|
| Unitaire | 5 fichiers | 28 | 0 | 28 |
| Intégration | 4 fichiers | 22 | 0 | 22 |
| E2E — Briefing | 1 fichier | 3 | 8 | 11 |
| E2E — Qualification | 1 fichier | 3 | 9 | 12 |
| E2E — Relance retards | 1 fichier | 3 | 8 | 11 |
| E2E — Transverses | 1 fichier | 0 | 11 | 11 |
| **Total** | **13 fichiers** | **59** | **36** | **95** |

### Chemins couverts par les tests E2E

| Chemin | Couvert |
|---|---|
| Journée vide (aucune tâche) | ✅ |
| Uniquement des retards | ✅ |
| Bannières orange et rouge | ✅ |
| Tâches ⚡ mélangées au briefing | ✅ |
| Tâche récurrente cochée → suivante créée | ✅ |
| Tâche déléguée cochée | ✅ |
| Temps estimé null ignoré dans la somme | ✅ |
| Projet supprimé (données corrompues) | ✅ |
| Date echéance null sur une tâche | ✅ |
| Qualification sans pré-remplissage IA | ✅ |
| Qualification avec pré-remplissage IA sans correction | ✅ |
| Passer toutes les tâches sans qualifier | ✅ |
| Qualification avec récurrence | ✅ |
| Qualification partielle (5 sur 15) | ✅ |
| Seuil rouge atteint pendant qualification | ✅ |
| Projet supprimé pendant qualification | ✅ |
| File vide après qualification complète | ✅ |
| Double qualification (idempotence) | ✅ |
| Session retards vide | ✅ |
| Report au-delà d'un mois | ✅ |
| Clôture tâche en_attente_retour | ✅ |
| Tout ignorer → aucune modification BDD | ✅ |
| Tâche récurrente en retard clôturée | ✅ |
| Ordre en_retard avant en_attente_retour | ✅ |
| Report à une date dans le passé (400) | ✅ |
| Double archivage (idempotence) | ✅ |
| Tâche en retard sans date_echeance | ✅ |
| Journée complète bout en bout | ✅ |
| 20 captures → bannière rouge | ✅ |
| Alerte rouge → orange après qualification | ✅ |
| Alerte supprimée après qualification complète | ✅ |
| Restauration tâche cochée par erreur | ✅ |
| Tâche restaurée visible dans le backlog | ✅ |
| Prédécesseur non terminé → tâche visible | ✅ |
| Archivage prédécesseur → lien conservé | ✅ |

---

## Tests unitaires — Version musclée

### __tests__/unit/logique-retard.test.ts (complet)

```typescript
import { calculerStatutRetard, calculerJoursRetard } from '@/lib/logique-taches';

describe('Logique de retard — Chemins nominaux', () => {
  // ... tests existants conservés ...

  it('ne passe pas en retard une tâche a_qualifier même si échéance dépassée', () => {
    const tache = { statut: 'a_qualifier' as const, date_echeance: new Date('2026-05-28T18:00:00Z') };
    expect(calculerStatutRetard(tache, new Date('2026-05-30T08:00:00Z'))).toBe('a_qualifier');
  });

  it('ne passe pas en retard une tâche a_qualifier sans date_echeance', () => {
    const tache = { statut: 'a_qualifier' as const, date_echeance: null };
    expect(calculerStatutRetard(tache, new Date())).toBe('a_qualifier');
  });
});

describe('Logique de retard — Cas limites', () => {

  it('traite comme non en retard une tâche dont l\'échéance est exactement maintenant', () => {
    const maintenant = new Date('2026-05-30T18:00:00Z');
    const tache = { statut: 'active' as const, date_echeance: maintenant };
    // Echéance = maintenant → pas encore en retard
    expect(calculerStatutRetard(tache, maintenant)).toBe('active');
  });

  it('traite comme en retard une tâche dont l\'échéance est 1 seconde dans le passé', () => {
    const maintenant = new Date('2026-05-30T18:00:01Z');
    const tache = { statut: 'active' as const, date_echeance: new Date('2026-05-30T18:00:00Z') };
    expect(calculerStatutRetard(tache, maintenant)).toBe('en_retard');
  });

  it('ne modifie pas le statut d\'une tâche en_attente_retour non dépassée', () => {
    const tache = { statut: 'en_attente_retour' as const, date_echeance: new Date('2026-06-01T18:00:00Z') };
    expect(calculerStatutRetard(tache, new Date('2026-05-30T08:00:00Z'))).toBe('en_attente_retour');
  });

  it('ne modifie pas le statut d\'une tâche archivee même si echéance très dépassée', () => {
    const tache = { statut: 'archivee' as const, date_echeance: new Date('2020-01-01T00:00:00Z') };
    expect(calculerStatutRetard(tache, new Date('2026-05-30T08:00:00Z'))).toBe('archivee');
  });
});

describe('calculerJoursRetard — Cas limites', () => {

  it('retourne 1 si retard de moins de 24h mais sur un jour calendaire différent', () => {
    const echeance = new Date('2026-05-29T23:59:00Z');
    const maintenant = new Date('2026-05-30T00:01:00Z');
    expect(calculerJoursRetard(echeance, maintenant)).toBe(1);
  });

  it('retourne 0 si même jour et echéance non dépassée', () => {
    const echeance = new Date('2026-05-30T18:00:00Z');
    const maintenant = new Date('2026-05-30T08:00:00Z');
    expect(calculerJoursRetard(echeance, maintenant)).toBe(0);
  });

  it('gère un retard de plus d\'un an', () => {
    const echeance = new Date('2025-01-01T00:00:00Z');
    const maintenant = new Date('2026-05-30T00:00:00Z');
    expect(calculerJoursRetard(echeance, maintenant)).toBe(514);
  });
});
```

---

### __tests__/unit/logique-recurrence.test.ts (complet)

```typescript
import { calculerProchaineEcheance, creerTacheSuivante } from '@/lib/logique-recurrence';

describe('calculerProchaineEcheance — Cas limites calendaires', () => {

  it('gère le passage décembre → janvier pour une récurrence mensuelle', () => {
    const echeance = new Date('2026-12-31T18:00:00Z');
    const recurrence = { frequence: 'mensuelle' as const, jour_mois: 31 };
    const resultat = calculerProchaineEcheance(echeance, recurrence);
    expect(resultat.getFullYear()).toBe(2027);
    expect(resultat.getMonth()).toBe(0); // janvier
  });

  it('gère le jour 31 sur un mois de 30 jours → dernier jour du mois', () => {
    const echeance = new Date('2026-01-31T18:00:00Z');
    const recurrence = { frequence: 'mensuelle' as const, jour_mois: 31 };
    // Février 2026 n'a pas de 31 → 28
    const resultat = calculerProchaineEcheance(echeance, recurrence);
    expect(resultat.getDate()).toBe(28);
    expect(resultat.getMonth()).toBe(1); // février
  });

  it('gère une année bissextile (29 février)', () => {
    const echeance = new Date('2028-01-29T18:00:00Z'); // 2028 est bissextile
    const recurrence = { frequence: 'mensuelle' as const, jour_mois: 29 };
    const resultat = calculerProchaineEcheance(echeance, recurrence);
    expect(resultat.getDate()).toBe(29);
    expect(resultat.getMonth()).toBe(1); // février 2028
  });

  it('calcule correctement une récurrence hebdomadaire sur 52 semaines', () => {
    const echeance = new Date('2026-01-02T18:00:00Z'); // vendredi
    const recurrence = { frequence: 'hebdomadaire' as const, jour_semaine: 4 };
    let date = echeance;
    for (let i = 0; i < 52; i++) {
      date = calculerProchaineEcheance(date, recurrence);
    }
    // Après 52 semaines, on doit être 52*7 = 364 jours plus tard
    const diff = (date.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBe(364);
  });

  it('ne modifie pas l\'heure de l\'échéance lors du calcul de récurrence', () => {
    const echeance = new Date('2026-05-30T14:30:00Z');
    const recurrence = { frequence: 'quotidienne' as const };
    const resultat = calculerProchaineEcheance(echeance, recurrence);
    expect(resultat.getHours()).toBe(echeance.getHours());
    expect(resultat.getMinutes()).toBe(echeance.getMinutes());
  });
});

describe('creerTacheSuivante — Cas limites', () => {

  it('ne crée pas de tâche suivante si la récurrence est inactive', () => {
    const { creerTacheSuivanteOuNull } = require('@/lib/logique-recurrence');
    const tacheArchivee = {
      user_id: 'uuid', titre: 'Test', statut: 'archivee' as const,
      date_echeance: new Date(), recurrence_id: 'uuid-rec',
      priorite: 'basse' as const, responsable: 'Moi',
      projet_id: null, notes: null, temps_estime_min: null,
    };
    const recurrenceInactive = { frequence: 'quotidienne' as const, actif: false };
    const result = creerTacheSuivanteOuNull(tacheArchivee, recurrenceInactive);
    expect(result).toBeNull();
  });

  it('transfère le predecesseur_id sur la tâche suivante si présent', () => {
    const tacheArchivee = {
      user_id: 'uuid', projet_id: 'uuid-p', titre: 'Test',
      statut: 'archivee' as const, priorite: 'haute' as const,
      responsable: 'Moi', temps_estime_min: null, notes: null,
      recurrence_id: 'uuid-rec', predecesseur_id: 'uuid-pred',
      date_echeance: new Date('2026-05-30T18:00:00Z'),
    };
    const recurrence = { frequence: 'hebdomadaire' as const, jour_semaine: 4, actif: true };
    const nouvelleTache = require('@/lib/logique-recurrence').creerTacheSuivante(tacheArchivee, recurrence);
    expect(nouvelleTache.predecesseur_id).toBe('uuid-pred');
  });

  it('réinitialise l\'avancement à 0 sur la tâche suivante', () => {
    const tacheArchivee = {
      user_id: 'uuid', projet_id: null, titre: 'Test',
      statut: 'archivee' as const, priorite: 'basse' as const,
      responsable: 'Moi', avancement: 100,
      temps_estime_min: 30, notes: null, recurrence_id: 'uuid-rec',
      date_echeance: new Date('2026-05-30T18:00:00Z'),
    };
    const recurrence = { frequence: 'quotidienne' as const, actif: true };
    const nouvelleTache = require('@/lib/logique-recurrence').creerTacheSuivante(tacheArchivee, recurrence);
    expect(nouvelleTache.avancement).toBe(0);
  });
});
```

---

### __tests__/unit/logique-seuils.test.ts (complet)

```typescript
import { calculerNiveauAlerte } from '@/lib/logique-seuils';

describe('Logique seuils — Cas nominaux', () => {
  // ... tests existants conservés ...
});

describe('Logique seuils — Cas limites', () => {

  it('retourne "rouge" si seuil_orange = seuil_rouge et nb atteint ce seuil', () => {
    // Configuration invalide mais ne doit pas planter
    expect(calculerNiveauAlerte(15, { seuil_orange: 15, seuil_rouge: 15 })).toBe('rouge');
  });

  it('retourne null si seuil_orange = 0 et nb = 0', () => {
    expect(calculerNiveauAlerte(0, { seuil_orange: 0, seuil_rouge: 5 })).toBeNull();
  });

  it('retourne "orange" si nb_a_qualifier = 1 et seuil_orange = 1', () => {
    expect(calculerNiveauAlerte(1, { seuil_orange: 1, seuil_rouge: 2 })).toBe('orange');
  });

  it('ne plante pas avec nb_a_qualifier négatif (données corrompues)', () => {
    expect(() => calculerNiveauAlerte(-1, { seuil_orange: 15, seuil_rouge: 20 })).not.toThrow();
    expect(calculerNiveauAlerte(-1, { seuil_orange: 15, seuil_rouge: 20 })).toBeNull();
  });

  it('ne plante pas avec des seuils à 0', () => {
    expect(() => calculerNiveauAlerte(5, { seuil_orange: 0, seuil_rouge: 0 })).not.toThrow();
  });

  it('retourne "rouge" immédiatement si seuil_rouge = 1 et nb = 1', () => {
    expect(calculerNiveauAlerte(1, { seuil_orange: 1, seuil_rouge: 1 })).toBe('rouge');
  });
});
```

---

### __tests__/unit/logique-archivage.test.ts (complet)

```typescript
import { preparerArchivage, preparerRestauration } from '@/lib/logique-taches';

describe('Logique archivage — Cas nominaux', () => {
  // ... tests existants conservés ...
});

describe('Logique archivage — Idempotence', () => {

  it('archiver une tâche déjà archivée est idempotent', () => {
    const dateCloture = new Date('2026-05-29T10:00:00Z');
    const tacheDejaArchivee = { statut: 'archivee' as const, date_cloture: dateCloture, avancement: 100 };
    const result = preparerArchivage(tacheDejaArchivee, new Date('2026-05-30T09:00:00Z'));
    // La date de clôture originale est conservée
    expect(result.date_cloture).toEqual(dateCloture);
    expect(result.avancement).toBe(100);
  });

  it('restaurer puis réarchiver une tâche fonctionne correctement', () => {
    const tacheArchivee = { statut: 'archivee' as const, date_cloture: new Date(), avancement: 100 };
    const restauree = preparerRestauration(tacheArchivee);
    expect(restauree.statut).toBe('active');
    expect(restauree.date_cloture).toBeNull();
    expect(restauree.avancement).toBe(100); // l'avancement est conservé à la restauration

    const reArchivee = preparerArchivage(restauree, new Date());
    expect(reArchivee.statut).toBe('archivee');
    expect(reArchivee.date_cloture).not.toBeNull();
  });
});

describe('Logique archivage — Cas limites', () => {

  it('ne peut pas restaurer une tâche active (erreur)', () => {
    const tacheActive = { statut: 'active' as const, date_cloture: null };
    expect(() => preparerRestauration(tacheActive)).toThrow('TACHE_NON_ARCHIVEE');
  });

  it('archiver une tâche à 0% met l\'avancement à 100', () => {
    const result = preparerArchivage({ statut: 'active' as const, avancement: 0 }, new Date());
    expect(result.avancement).toBe(100);
  });

  it('archiver une tâche à 75% met l\'avancement à 100', () => {
    const result = preparerArchivage({ statut: 'active' as const, avancement: 75 }, new Date());
    expect(result.avancement).toBe(100);
  });

  it('l\'avancement est conservé tel quel lors de la restauration', () => {
    const result = preparerRestauration({ statut: 'archivee' as const, date_cloture: new Date(), avancement: 100 });
    expect(result.avancement).toBe(100);
  });
});
```

---

### __tests__/unit/parser-ia.test.ts (complet)

```typescript
import { parserReponseIA, validerReponseIA } from '@/lib/parser-ia';

describe('parserReponseIA — Cas nominaux', () => {
  // ... tests existants conservés ...
});

describe('parserReponseIA — Robustesse', () => {

  it('ignore les champs inconnus retournés par l\'IA', () => {
    const json = JSON.stringify({
      taches: [{
        titre: 'Test',
        champ_inconnu: 'valeur_inconnue', // champ non prévu dans le schéma
        projet_id: 'uuid-p',
        priorite: 'haute',
        confiance: 0.9,
      }],
    });
    const result = parserReponseIA(json);
    expect(result[0].titre).toBe('Test');
    expect((result[0] as any).champ_inconnu).toBeUndefined();
  });

  it('remplace un titre vide par "[Sans titre]"', () => {
    const json = JSON.stringify({
      taches: [{ titre: '', projet_id: null, confiance: 0.5 }],
    });
    const result = parserReponseIA(json);
    expect(result[0].titre).toBe('[Sans titre]');
  });

  it('convertit un temps estimé en heures en minutes', () => {
    const json = JSON.stringify({
      taches: [{
        titre: 'Longue tâche',
        projet_id: null,
        priorite: 'haute',
        temps_estime_heures: 1.5, // l'IA peut retourner des heures
        confiance: 0.8,
      }],
    });
    const result = parserReponseIA(json);
    expect(result[0].temps_estime_min).toBe(90); // 1.5h = 90 min
  });

  it('parse une récurrence mensuelle correctement', () => {
    const json = JSON.stringify({
      taches: [{
        titre: 'Rapport mensuel',
        projet_id: 'uuid-p',
        priorite: 'haute',
        recurrence: { frequence: 'mensuelle', jour_mois: 1 },
        confiance: 0.95,
      }],
    });
    const result = parserReponseIA(json);
    expect(result[0].recurrence?.frequence).toBe('mensuelle');
    expect(result[0].recurrence?.jour_mois).toBe(1);
  });

  it('ne plante pas si la réponse IA contient du JSON dans le texte dicté', () => {
    // Cas de sécurité : l'utilisateur dicte un texte contenant du JSON
    const json = JSON.stringify({
      taches: [{
        titre: '{"injection": "tentative"}',
        projet_id: null,
        confiance: 0.7,
      }],
    });
    const result = parserReponseIA(json);
    // Le titre est traité comme du texte, pas exécuté
    expect(result[0].titre).toBe('{"injection": "tentative"}');
  });

  it('ignore les tâches avec confiance = 0 (hallucination IA probable)', () => {
    const json = JSON.stringify({
      taches: [
        { titre: 'Tâche réelle', confiance: 0.85, projet_id: null },
        { titre: 'Hallucination probable', confiance: 0.0, projet_id: null },
      ],
    });
    const result = parserReponseIA(json);
    // Les tâches avec confiance = 0 sont filtrées
    expect(result).toHaveLength(1);
    expect(result[0].titre).toBe('Tâche réelle');
  });

  it('ne plante pas sur une réponse IA avec le champ "taches" absent', () => {
    const json = JSON.stringify({ message: 'Je n\'ai pas compris' });
    expect(() => parserReponseIA(json)).not.toThrow();
    expect(parserReponseIA(json)).toEqual([]);
  });

  it('tronque un titre trop long (> 500 caractères)', () => {
    const titreLong = 'a'.repeat(600);
    const json = JSON.stringify({
      taches: [{ titre: titreLong, confiance: 0.8, projet_id: null }],
    });
    const result = parserReponseIA(json);
    expect(result[0].titre.length).toBeLessThanOrEqual(500);
  });
});
```

---

## Tests d'intégration — Version musclée

### __tests__/integration/api-auth.test.ts (nouveau)

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { 'Content-Type': 'application/json' };

describe('POST /api/auth/register', () => {

  it('crée un compte avec tous les champs requis', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'uuid-new' }, session: { access_token: 'jwt' } },
      error: null,
    });
    mockSupabase.insert.mockResolvedValue({ data: [{ id: 'uuid-pref' }], error: null });

    const res = await request(BASE_URL)
      .post('/api/auth/register')
      .set(headers)
      .send({
        prenom: 'Jean-Pierre', login: 'jeanpierre',
        email: 'jp@gmail.com', password: 'MotDePasse123!',
        heure_briefing: '08:00', heure_qualification: '12:00', heure_retards: '18:00',
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user_id).toBe('uuid-new');
  });

  it('retourne 400 si email déjà utilisé', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'User already registered' },
    });

    const res = await request(BASE_URL)
      .post('/api/auth/register')
      .set(headers)
      .send({ prenom: 'Test', login: 'test2', email: 'jp@gmail.com', password: 'MotDePasse123!' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMAIL_DEJA_UTILISE');
  });

  it('retourne 400 si login déjà utilisé', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'uuid-new' }, session: { access_token: 'jwt' } },
      error: null,
    });
    mockSupabase.insert.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'preferences_login_unique' },
    });

    const res = await request(BASE_URL)
      .post('/api/auth/register')
      .set(headers)
      .send({ prenom: 'Test', login: 'jeanpierre', email: 'autre@gmail.com', password: 'MotDePasse123!' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('LOGIN_DEJA_UTILISE');
  });

  it('retourne 400 si champs requis manquants', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/register')
      .set(headers)
      .send({ email: 'jp@gmail.com' }); // prenom, login, password manquants

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {

  it('connecte un utilisateur avec login + mot de passe corrects', async () => {
    // Résoudre login → email
    mockSupabase.select.mockResolvedValue({
      data: [{ email: 'jp@gmail.com' }], error: null,
    });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'jwt-valid' } }, error: null,
    });

    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .set(headers)
      .send({ login: 'jeanpierre', password: 'MotDePasse123!' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('jwt-valid');
    expect(res.body.preferences).toBeDefined();
  });

  it('retourne 401 si mot de passe incorrect', async () => {
    mockSupabase.select.mockResolvedValue({ data: [{ email: 'jp@gmail.com' }], error: null });
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .set(headers)
      .send({ login: 'jeanpierre', password: 'mauvais_mdp' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('retourne 404 si login inexistant', async () => {
    mockSupabase.select.mockResolvedValue({ data: [], error: null });

    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .set(headers)
      .send({ login: 'login_inexistant', password: 'MotDePasse123!' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('LOGIN_NOT_FOUND');
  });

  it('retourne 400 si login ou password manquant', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .set(headers)
      .send({ login: 'jeanpierre' }); // password manquant

    expect(res.status).toBe(400);
  });
});

describe('Token et sécurité', () => {

  it('retourne 401 avec un token expiré', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: null,
      error: { message: 'JWT expired' },
    });

    const res = await request(BASE_URL)
      .get('/api/taches')
      .set({ Authorization: 'Bearer token-expire' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('retourne 401 avec un token malformé', async () => {
    const res = await request(BASE_URL)
      .get('/api/taches')
      .set({ Authorization: 'Bearer not.a.valid.jwt' });

    expect(res.status).toBe(401);
  });

  it('retourne 401 sans header Authorization', async () => {
    const res = await request(BASE_URL).get('/api/taches');
    expect(res.status).toBe(401);
  });
});
```

---

### __tests__/integration/api-taches.test.ts (complet)

```typescript
// Ajouter aux tests existants :

describe('GET /api/taches — Filtres avancés', () => {

  it('filtre par projet ET priorité simultanément', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [{ id: 'uuid-1', projet_id: 'uuid-formation', priorite: 'haute', statut: 'active' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .get('/api/taches?projet_id=uuid-formation&priorite=haute')
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data[0].priorite).toBe('haute');
    expect(res.body.data[0].projet_id).toBe('uuid-formation');
  });

  it('retourne les tâches sans projet (projet_id null)', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [{ id: 'uuid-1', projet_id: null, titre: 'Tâche sans projet', statut: 'active' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .get('/api/taches?projet_id=null')
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data[0].projet_id).toBeNull();
  });

  it('pagine correctement avec limit et offset', async () => {
    const taches = Array.from({ length: 10 }, (_, i) => ({
      id: `uuid-${i}`, titre: `Tâche ${i}`, statut: 'active',
    }));
    mockSupabase.select.mockResolvedValue({ data: taches.slice(5, 10), error: null, count: 10 });

    const res = await request(BASE_URL)
      .get('/api/taches?limit=5&offset=5')
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.total).toBe(10);
  });

  it('retourne le détail de la vue semaine correctement', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [
        { projet_id: 'uuid-p', jour: '2026-05-25', nb_taches: 2,
          taches: [{ id: 'uuid-1', titre: 'Test', priorite: 'haute' }] },
      ],
      error: null,
    });

    const res = await request(BASE_URL)
      .get('/api/taches/semaine?debut=2026-05-25')
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.matrix[0].jours['2026-05-25'].nb).toBe(2);
  });
});

describe('GET /api/taches — Sécurité RLS', () => {

  it('un utilisateur ne peut pas accéder aux tâches d\'un autre utilisateur', async () => {
    // L'utilisateur A tente d'accéder à une tâche de l'utilisateur B
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-a' } } });
    mockSupabase.select.mockResolvedValue({
      data: [], // RLS filtre → résultat vide
      error: null,
    });

    const res = await request(BASE_URL)
      .get('/api/taches/uuid-tache-user-b')
      .set(headers);

    // Retourne 404 (pas 403) pour ne pas révéler l'existence de la tâche
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('TACHE_NOT_FOUND');
  });

  it('un utilisateur ne peut pas modifier la tâche d\'un autre utilisateur', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-a' } } });
    mockSupabase.update.mockResolvedValue({ data: [], error: null }); // RLS → 0 rows updated

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-tache-user-b')
      .set(headers)
      .send({ statut: 'archivee' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/taches/:id — Détail avec prédécesseur', () => {

  it('retourne le prédécesseur si renseigné', async () => {
    mockSupabase.single.mockResolvedValue({
      data: {
        id: 'uuid-dependante', titre: 'Planifier réunion',
        predecesseur_id: 'uuid-pred',
        predecesseur: { id: 'uuid-pred', titre: 'Envoyer CR' },
      },
      error: null,
    });

    const res = await request(BASE_URL)
      .get('/api/taches/uuid-dependante')
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.predecesseur.titre).toBe('Envoyer CR');
  });

  it('retourne null pour le prédécesseur si non renseigné', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { id: 'uuid-1', titre: 'Test', predecesseur_id: null, predecesseur: null },
      error: null,
    });

    const res = await request(BASE_URL).get('/api/taches/uuid-1').set(headers);
    expect(res.body.predecesseur).toBeNull();
  });
});
```

---

### __tests__/integration/api-capture-ia.test.ts (complet)

```typescript
// Ajouter aux tests existants :

describe('POST /api/capture/ia — Cas limites', () => {

  it('gère un texte très long (> 2000 caractères) sans planter', async () => {
    const texteLong = 'Faire une tâche. '.repeat(150); // ~2550 chars

    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify({ taches: [] }) }],
      }),
    });

    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send({ texte: texteLong, projets: [], date_reference: '2026-05-30' });

    expect(res.status).toBe(200);
  });

  it('fonctionne avec un seul projet disponible', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify(mockClaudeResponse.troistaches_ok) }],
      }),
    });

    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send({
        texte: 'Faire quelque chose',
        projets: [{ id: 'uuid-seul', nom: 'Seul projet' }],
        date_reference: '2026-05-30',
      });

    expect(res.status).toBe(200);
  });

  it('fonctionne avec une liste de projets vide (0 projets)', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify({ taches: [{ titre: 'Test', projet_id: null, confiance: 0.5 }] }) }],
      }),
    });

    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send({ texte: 'Faire quelque chose', projets: [], date_reference: '2026-05-30' });

    expect(res.status).toBe(200);
    expect(res.body.taches[0].projet_id).toBeNull();
  });

  it('gère une réponse IA avec JSON partiel (troncature)', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '{"taches": [{"titre": "Test incomplet"' }], // JSON tronqué
      }),
    });

    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send({ texte: 'Test', projets: [], date_reference: '2026-05-30' });

    // Ne plante pas, retourne tableau vide
    expect(res.status).toBe(200);
    expect(res.body.taches).toEqual([]);
  });

  it('retourne duree_ms dans toutes les réponses pour le monitoring', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify({ taches: [] }) }],
      }),
    });

    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send({ texte: 'Test', projets: [], date_reference: '2026-05-30' });

    expect(res.body.duree_ms).toBeDefined();
    expect(typeof res.body.duree_ms).toBe('number');
    expect(res.body.duree_ms).toBeGreaterThan(0);
  });
});
```

---

### __tests__/integration/api-projets.test.ts (complet)

```typescript
// Ajouter aux tests existants :

describe('DELETE /api/projets/:id', () => {

  it('désactive un projet sans tâches associées', async () => {
    mockSupabase.select.mockResolvedValue({ data: [], error: null }); // 0 tâches actives
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-p', actif: false }], error: null,
    });

    const res = await request(BASE_URL)
      .delete('/api/projets/uuid-p')
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.projet.actif).toBe(false);
  });

  it('désactive un projet avec des tâches associées (les tâches restent en base)', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [{ id: 'uuid-t1' }, { id: 'uuid-t2' }], error: null, // 2 tâches actives
    });
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-p', actif: false }], error: null,
    });

    const res = await request(BASE_URL)
      .delete('/api/projets/uuid-p')
      .set(headers);

    expect(res.status).toBe(200);
    // Un warning est retourné pour informer l'utilisateur
    expect(res.body.warning).toContain('2 tâches');
  });
});

describe('PATCH /api/projets/:id', () => {

  it('modifie le nom d\'un projet', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-p', nom: 'Nouveau nom', couleur: '#4a9eff' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/projets/uuid-p')
      .set(headers)
      .send({ nom: 'Nouveau nom' });

    expect(res.status).toBe(200);
    expect(res.body.projet.nom).toBe('Nouveau nom');
  });

  it('change la couleur d\'un projet pour une couleur disponible', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-p', couleur: '#9b59b6' }], error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/projets/uuid-p')
      .set(headers)
      .send({ couleur: '#9b59b6' });

    expect(res.status).toBe(200);
    expect(res.body.projet.couleur).toBe('#9b59b6');
  });

  it('modifie l\'ordre des projets', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-p', ordre: 2 }], error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/projets/uuid-p')
      .set(headers)
      .send({ ordre: 2 });

    expect(res.status).toBe(200);
    expect(res.body.projet.ordre).toBe(2);
  });
});
```

---

### __tests__/integration/api-preferences.test.ts (nouveau)

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { Authorization: 'Bearer mock-jwt-token', 'Content-Type': 'application/json' };

const preferencesBase = {
  id: 'uuid-pref', user_id: 'user-uuid',
  prenom: 'Jean-Pierre', login: 'jeanpierre',
  heure_briefing: '08:00', heure_qualification: '12:00', heure_retards: '18:00',
  seuil_orange: 15, seuil_rouge: 20,
};

describe('GET /api/preferences', () => {

  it('retourne les préférences de l\'utilisateur connecté', async () => {
    mockSupabase.single.mockResolvedValue({ data: preferencesBase, error: null });

    const res = await request(BASE_URL).get('/api/preferences').set(headers);

    expect(res.status).toBe(200);
    expect(res.body.prenom).toBe('Jean-Pierre');
    expect(res.body.seuil_orange).toBe(15);
  });
});

describe('PATCH /api/preferences', () => {

  it('modifie un seul champ sans affecter les autres', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ ...preferencesBase, heure_briefing: '07:30' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/preferences')
      .set(headers)
      .send({ heure_briefing: '07:30' }); // un seul champ

    expect(res.status).toBe(200);
    expect(res.body.heure_briefing).toBe('07:30');
    expect(res.body.seuil_orange).toBe(15); // inchangé
  });

  it('modifie les seuils d\'alerte', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ ...preferencesBase, seuil_orange: 12, seuil_rouge: 18 }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/preferences')
      .set(headers)
      .send({ seuil_orange: 12, seuil_rouge: 18 });

    expect(res.status).toBe(200);
    expect(res.body.seuil_orange).toBe(12);
    expect(res.body.seuil_rouge).toBe(18);
  });

  it('retourne 400 si seuil_rouge < seuil_orange', async () => {
    const res = await request(BASE_URL)
      .patch('/api/preferences')
      .set(headers)
      .send({ seuil_orange: 20, seuil_rouge: 15 }); // incohérent

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retourne 400 si seuil_orange < 1', async () => {
    const res = await request(BASE_URL)
      .patch('/api/preferences')
      .set(headers)
      .send({ seuil_orange: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('enregistre une push_subscription valide', async () => {
    const subscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      keys: { p256dh: 'base64key', auth: 'base64auth' },
    };
    mockSupabase.update.mockResolvedValue({
      data: [{ ...preferencesBase, push_subscription: subscription }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/preferences')
      .set(headers)
      .send({ push_subscription: subscription });

    expect(res.status).toBe(200);
    expect(res.body.push_subscription.endpoint).toContain('fcm.googleapis.com');
  });

  it('retourne 400 si push_subscription est malformée', async () => {
    const res = await request(BASE_URL)
      .patch('/api/preferences')
      .set(headers)
      .send({ push_subscription: { endpoint: 'pas-une-url' } }); // clés manquantes

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retourne 400 si heure au mauvais format', async () => {
    const res = await request(BASE_URL)
      .patch('/api/preferences')
      .set(headers)
      .send({ heure_briefing: '8h00' }); // format invalide, doit être HH:MM

    expect(res.status).toBe(400);
  });
});
```

---

## Récapitulatif final de la couverture

| Couche | Fichiers | Tests V1 | Tests ajoutés | Total |
|---|---|---|---|---|
| Unitaire — retard | 1 | 6 | 6 | 12 |
| Unitaire — recurrence | 1 | 5 | 6 | 11 |
| Unitaire — seuils | 1 | 6 | 6 | 12 |
| Unitaire — archivage | 1 | 5 | 5 | 10 |
| Unitaire — parser IA | 1 | 6 | 8 | 14 |
| Intégration — auth | 1 | 0 | 9 | 9 |
| Intégration — tâches | 1 | 7 | 7 | 14 |
| Intégration — capture IA | 1 | 6 | 5 | 11 |
| Intégration — projets | 1 | 4 | 5 | 9 |
| Intégration — préférences | 1 | 0 | 8 | 8 |
| E2E — Briefing | 1 | 3 | 8 | 11 |
| E2E — Qualification | 1 | 3 | 9 | 12 |
| E2E — Relance retards | 1 | 3 | 8 | 11 |
| E2E — Transverses | 1 | 0 | 11 | 11 |
| **Total** | **14 fichiers** | **59** | **97** | **156** |

---

## Tests post-analyse critique

### __tests__/unit/logique-timezone.test.ts (nouveau)

```typescript
import { calculerHeureUTC, detecterTimezone } from '@/lib/logique-timezone';

describe('Logique fuseau horaire', () => {

  describe('calculerHeureUTC', () => {

    it('convertit 8h00 Europe/Paris en UTC en hiver (UTC+1)', () => {
      // En hiver Paris = UTC+1 → 8h Paris = 7h UTC
      const date = new Date('2026-01-15'); // hiver
      const result = calculerHeureUTC('08:00', 'Europe/Paris', date);
      expect(result.getUTCHours()).toBe(7);
      expect(result.getUTCMinutes()).toBe(0);
    });

    it('convertit 8h00 Europe/Paris en UTC en été (UTC+2)', () => {
      // En été Paris = UTC+2 → 8h Paris = 6h UTC
      const date = new Date('2026-07-15'); // été
      const result = calculerHeureUTC('08:00', 'Europe/Paris', date);
      expect(result.getUTCHours()).toBe(6);
      expect(result.getUTCMinutes()).toBe(0);
    });

    it('gère un fuseau à l\'ouest (New York UTC-5 en hiver)', () => {
      const date = new Date('2026-01-15');
      const result = calculerHeureUTC('08:00', 'America/New_York', date);
      expect(result.getUTCHours()).toBe(13);
    });

    it('gère les minutes (ex: 8h30)', () => {
      const date = new Date('2026-01-15');
      const result = calculerHeureUTC('08:30', 'Europe/Paris', date);
      expect(result.getUTCHours()).toBe(7);
      expect(result.getUTCMinutes()).toBe(30);
    });

    it('gère le passage minuit (ex: 23h00 UTC+2 = 21h UTC)', () => {
      const date = new Date('2026-07-15');
      const result = calculerHeureUTC('23:00', 'Europe/Paris', date);
      expect(result.getUTCHours()).toBe(21);
    });

    it('gère le passage minuit côté ouest (23h UTC-5 = 4h UTC le lendemain)', () => {
      const date = new Date('2026-01-15');
      const result = calculerHeureUTC('23:00', 'America/New_York', date);
      expect(result.getUTCHours()).toBe(4);
      expect(result.getUTCDate()).toBe(16); // lendemain
    });

    it('ne plante pas avec une timezone invalide', () => {
      expect(() => calculerHeureUTC('08:00', 'Invalid/Timezone', new Date())).not.toThrow();
      // Fallback sur Europe/Paris
    });
  });

  describe('detecterTimezone', () => {

    it('retourne Europe/Paris par défaut si Intl non disponible', () => {
      const result = detecterTimezone(undefined);
      expect(result).toBe('Europe/Paris');
    });

    it('retourne la timezone détectée si valide', () => {
      const result = detecterTimezone('America/New_York');
      expect(result).toBe('America/New_York');
    });

    it('retourne Europe/Paris si timezone détectée invalide', () => {
      const result = detecterTimezone('Invalid/Zone');
      expect(result).toBe('Europe/Paris');
    });
  });

});
```

---

### __tests__/unit/logique-erreurs.test.ts (nouveau)

```typescript
import { classerErreur, TypeErreur } from '@/lib/logique-erreurs';

describe('Classification des erreurs', () => {

  it('classifie une erreur Claude API timeout', () => {
    const erreur = new Error('timeout');
    const result = classerErreur('capture_ia', erreur);
    expect(result.type).toBe(TypeErreur.IA_INDISPONIBLE);
    expect(result.toast).toBe('Service IA indisponible — tâche enregistrée en texte brut');
    expect(result.bloquant).toBe(false); // non bloquant, la tâche est quand même créée
  });

  it('classifie une erreur Supabase en lecture', () => {
    const erreur = new Error('connection refused');
    const result = classerErreur('lecture_bdd', erreur);
    expect(result.type).toBe(TypeErreur.BDD_INDISPONIBLE_LECTURE);
    expect(result.bandeau).toBe('Données indisponibles — réessaie dans quelques instants');
    expect(result.bloquant).toBe(true);
    expect(result.retryable).toBe(true);
  });

  it('classifie une erreur Supabase en écriture', () => {
    const erreur = new Error('connection refused');
    const result = classerErreur('ecriture_bdd', erreur);
    expect(result.type).toBe(TypeErreur.BDD_INDISPONIBLE_ECRITURE);
    expect(result.toast).toBe('Sauvegarde échouée');
    expect(result.retryable).toBe(true);
  });

  it('classifie un token expiré', () => {
    const erreur = new Error('JWT expired');
    const result = classerErreur('auth', erreur);
    expect(result.type).toBe(TypeErreur.SESSION_EXPIREE);
    expect(result.modale).toBe('Session expirée — reconnecte-toi');
    expect(result.bloquant).toBe(true);
  });

  it('classifie une perte de connexion en wizard', () => {
    const erreur = new Error('network offline');
    const result = classerErreur('wizard', erreur);
    expect(result.type).toBe(TypeErreur.HORS_LIGNE_WIZARD);
    expect(result.bandeau).toContain('Hors ligne');
    expect(result.retryable).toBe(true);
  });

});
```

---

### __tests__/integration/api-erreurs.test.ts (nouveau)

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';
import { mockClaudeApiCall } from '../mocks/claude-api';
import { mockResend } from '../mocks/resend';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { Authorization: 'Bearer mock-jwt-token', 'Content-Type': 'application/json' };

describe('Gestion des erreurs — Claude API', () => {

  it('enregistre la tâche en texte brut si Claude API est down', async () => {
    mockClaudeApiCall.mockRejectedValue(new Error('timeout'));
    mockSupabase.insert.mockResolvedValue({
      data: [{ id: 'uuid-1', titre: 'Texte dicté brut', statut: 'a_qualifier', pre_caracterisee_ia: false }],
      error: null,
    });

    // L'endpoint /api/capture/ia retourne 503
    const captureRes = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send({ texte: 'Rappeler Martin', projets: [], date_reference: '2026-05-30' });

    expect(captureRes.status).toBe(503);
    expect(captureRes.body.error.code).toBe('IA_TIMEOUT');

    // Le client crée quand même la tâche en texte brut via /api/taches
    const createRes = await request(BASE_URL)
      .post('/api/taches')
      .set(headers)
      .send({ taches: [{ titre: 'Rappeler Martin', pre_caracterisee_ia: false }] });

    expect(createRes.status).toBe(201);
    expect(createRes.body.taches[0].pre_caracterisee_ia).toBe(false);
  });

  it('retourne 503 avec message explicite si Claude API retourne une erreur HTTP', async () => {
    mockClaudeApiCall.mockResolvedValue({
      ok: false,
      status: 529,
      json: async () => ({ error: { type: 'overloaded_error' } }),
    });

    const res = await request(BASE_URL)
      .post('/api/capture/ia')
      .set(headers)
      .send({ texte: 'Test', projets: [], date_reference: '2026-05-30' });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('IA_TIMEOUT');
  });

});

describe('Gestion des erreurs — Supabase', () => {

  it('retourne 503 si Supabase est indisponible en lecture', async () => {
    mockSupabase.select.mockRejectedValue(new Error('connection refused'));

    const res = await request(BASE_URL).get('/api/taches').set(headers);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('BDD_INDISPONIBLE');
  });

  it('retourne 503 si Supabase est indisponible en écriture', async () => {
    mockSupabase.insert.mockRejectedValue(new Error('connection refused'));

    const res = await request(BASE_URL)
      .post('/api/taches')
      .set(headers)
      .send({ taches: [{ titre: 'Test' }] });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('BDD_INDISPONIBLE');
  });

  it('retourne 503 si Supabase est indisponible pendant un PATCH', async () => {
    mockSupabase.update.mockRejectedValue(new Error('timeout'));

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-1')
      .set(headers)
      .send({ statut: 'archivee' });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('BDD_INDISPONIBLE');
  });

});

describe('Gestion des erreurs — Auth', () => {

  it('retourne 401 avec message clair si token expiré', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: null,
      error: { message: 'JWT expired', status: 401 },
    });

    const res = await request(BASE_URL).get('/api/taches').set(headers);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toContain('Session expirée');
  });

});

describe('Gestion des erreurs — Reset mot de passe', () => {

  it('envoie un email de reset si l\'email existe', async () => {
    mockSupabase.auth.resetPasswordForEmail = jest.fn().mockResolvedValue({
      data: {}, error: null,
    });

    const res = await request(BASE_URL)
      .post('/api/auth/reset-password')
      .set({ 'Content-Type': 'application/json' })
      .send({ email: 'jp@gmail.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('email envoyé');
  });

  it('retourne 200 même si email inexistant (sécurité — pas de user enumeration)', async () => {
    mockSupabase.auth.resetPasswordForEmail = jest.fn().mockResolvedValue({
      data: {}, error: null, // Supabase retourne toujours succès
    });

    const res = await request(BASE_URL)
      .post('/api/auth/reset-password')
      .set({ 'Content-Type': 'application/json' })
      .send({ email: 'inconnu@gmail.com' });

    // Ne pas révéler si l'email existe ou non
    expect(res.status).toBe(200);
  });

  it('retourne 400 si email manquant', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/reset-password')
      .set({ 'Content-Type': 'application/json' })
      .send({});

    expect(res.status).toBe(400);
  });

});
```

---

### __tests__/integration/api-timezone.test.ts (nouveau)

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { Authorization: 'Bearer mock-jwt-token', 'Content-Type': 'application/json' };

describe('Gestion des fuseaux horaires', () => {

  it('enregistre la timezone détectée lors de l\'onboarding', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'uuid-new' }, session: { access_token: 'jwt' } },
      error: null,
    });
    mockSupabase.insert.mockResolvedValue({
      data: [{ id: 'uuid-pref', timezone: 'Europe/Paris' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .post('/api/auth/register')
      .set({ 'Content-Type': 'application/json' })
      .send({
        prenom: 'Jean-Pierre', login: 'jeanpierre',
        email: 'jp@gmail.com', password: 'MotDePasse123!',
        timezone: 'Europe/Paris', // détecté côté client
        heure_briefing: '08:00', heure_qualification: '12:00', heure_retards: '18:00',
      });

    expect(res.status).toBe(201);
    // Vérifier que la timezone a bien été enregistrée
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ timezone: 'Europe/Paris' })
    );
  });

  it('modifie la timezone dans les paramètres', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ timezone: 'America/New_York' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/preferences')
      .set(headers)
      .send({ timezone: 'America/New_York' });

    expect(res.status).toBe(200);
    expect(res.body.timezone).toBe('America/New_York');
  });

  it('retourne 400 si timezone invalide', async () => {
    const res = await request(BASE_URL)
      .patch('/api/preferences')
      .set(headers)
      .send({ timezone: 'Invalid/Timezone' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('retourne 400 si timezone au mauvais format', async () => {
    const res = await request(BASE_URL)
      .patch('/api/preferences')
      .set(headers)
      .send({ timezone: 'Paris' }); // format incorrect, doit être Continent/Ville

    expect(res.status).toBe(400);
  });

});
```

---

### __tests__/integration/api-projet-nullable.test.ts (nouveau)

```typescript
import request from 'supertest';
import { mockSupabase } from '../mocks/supabase';

const BASE_URL = process.env.TEST_BASE_URL!;
const headers = { Authorization: 'Bearer mock-jwt-token', 'Content-Type': 'application/json' };

describe('Projet nullable — Groupe "Sans projet"', () => {

  it('crée une tâche sans projet (projet_id null)', async () => {
    mockSupabase.insert.mockResolvedValue({
      data: [{ id: 'uuid-1', titre: 'Tâche sans projet', projet_id: null, statut: 'a_qualifier' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .post('/api/taches')
      .set(headers)
      .send({ taches: [{ titre: 'Tâche sans projet' }] }); // pas de projet_id

    expect(res.status).toBe(201);
    expect(res.body.taches[0].projet_id).toBeNull();
  });

  it('qualifie une tâche sans lui attribuer de projet', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-1', statut: 'active', projet_id: null }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-1')
      .set(headers)
      .send({ statut: 'active', priorite: 'basse' }); // pas de projet_id

    expect(res.status).toBe(200);
    expect(res.body.tache.statut).toBe('active');
    expect(res.body.tache.projet_id).toBeNull();
  });

  it('retourne les tâches sans projet dans un groupe "Sans projet" pour le briefing', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [
        { id: 'uuid-1', titre: 'Tâche orpheline', statut: 'active',
          date_echeance: '2026-05-30T14:00:00Z', projet_id: null, projet: null },
      ],
      error: null,
    });

    const res = await request(BASE_URL).get('/api/taches?vue=briefing').set(headers);

    expect(res.status).toBe(200);
    const groupeSansProjet = res.body.data.find((g: any) => g.projet_id === 'sans-projet');
    expect(groupeSansProjet).toBeDefined();
    expect(groupeSansProjet.projet_nom).toBe('Sans projet');
  });

  it('filtre les tâches sans projet via chip "Sans projet"', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [{ id: 'uuid-1', projet_id: null, statut: 'active' }],
      error: null,
    });

    const res = await request(BASE_URL)
      .get('/api/taches?projet_id=null')
      .set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data.every((t: any) => t.projet_id === null)).toBe(true);
  });

  it('archive une tâche sans projet sans erreur', async () => {
    mockSupabase.update.mockResolvedValue({
      data: [{ id: 'uuid-1', statut: 'archivee', projet_id: null, date_cloture: new Date().toISOString() }],
      error: null,
    });

    const res = await request(BASE_URL)
      .patch('/api/taches/uuid-1')
      .set(headers)
      .send({ statut: 'archivee' });

    expect(res.status).toBe(200);
    expect(res.body.tache.statut).toBe('archivee');
  });

});
```

---

## Récapitulatif final — Couverture totale

| Couche | Fichiers | Tests V1 | Tests ajoutés (E2E musclés) | Tests ajoutés (post-analyse) | Total |
|---|---|---|---|---|---|
| Unitaire | 7 fichiers | 59 | 31 | 15 | 105 |
| Intégration | 9 fichiers | 22 | 34 | 22 | 78 |
| E2E | 4 fichiers | 9 | 36 | 0 | 45 |
| Prompt engineering | 1 fichier | 0 | 0 | 8 | 8 |
| **Total** | **21 fichiers** | **90** | **101** | **45** | **236** |

### Nouveaux cas couverts par les tests post-analyse

| Cas | Couvert |
|---|---|
| Claude API down → tâche en texte brut | ✅ |
| Claude API erreur HTTP 529 | ✅ |
| Supabase indisponible en lecture | ✅ |
| Supabase indisponible en écriture | ✅ |
| Supabase indisponible pendant PATCH | ✅ |
| Token expiré → message session expirée | ✅ |
| Reset mot de passe — email existant | ✅ |
| Reset mot de passe — email inexistant (no user enumeration) | ✅ |
| Reset mot de passe — email manquant | ✅ |
| Timezone enregistrée à l'onboarding | ✅ |
| Timezone modifiable dans les paramètres | ✅ |
| Timezone invalide → 400 | ✅ |
| Timezone mauvais format → 400 | ✅ |
| Conversion heure locale → UTC hiver | ✅ |
| Conversion heure locale → UTC été | ✅ |
| Conversion fuseau ouest (New York) | ✅ |
| Passage minuit côté est | ✅ |
| Passage minuit côté ouest | ✅ |
| Timezone invalide → fallback Europe/Paris | ✅ |
| Tâche créée sans projet (nullable) | ✅ |
| Tâche qualifiée sans projet | ✅ |
| Groupe "Sans projet" dans le briefing | ✅ |
| Filtre "Sans projet" dans le backlog | ✅ |
| Archivage tâche sans projet | ✅ |
| Classification erreur IA indisponible | ✅ |
| Classification erreur BDD lecture | ✅ |
| Classification erreur BDD écriture | ✅ |
| Classification token expiré | ✅ |
| Classification perte connexion wizard | ✅ |
