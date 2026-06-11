# Plan de démarrage — Outil personnel de gestion de tâches
**Version 3 — Serwist, auth par email, keep-alive Supabase**
*Dernière mise à jour : 11 juin 2026*

---

## Vue d'ensemble

10 actions à réaliser avant de démarrer le développement des features. Durée totale estimée : **1 journée de setup** (~8h). Chaque action est indépendante sauf les dépendances explicitement notées.

```
Action 1 — Structure du projet          (2h) ← faire en premier
Action 2 — Types TypeScript             (2h) ← dépend de Action 1
Action 3 — Variables d'environnement    (1h) ← dépend de Action 1
Action 4 — Middleware authentification  (1h) ← dépend de Action 3
Action 5 — Migrations SQL               (2h) ← indépendant
Action 6 — ESLint + Prettier + Serwist  (1h) ← dépend de Action 1
Action 7 — Gestion d'état React         (1h) ← dépend de Action 2
Action 8 — Librairies clés              (1h) ← dépend de Action 1
Action 9 — Roadmap de développement     (2h) ← dépend de tout
Action 10 — README                      (1h) ← dépend de tout
```

---

## Action 1 — Structure du projet
**Durée estimée : 2h**
**Dépendances : aucune — faire en premier**

### Objectif

Définir l'arborescence complète du projet Next.js de façon à ce que chaque fichier ait une place logique et prévisible. Un développeur qui arrive doit savoir instinctivement où mettre quoi.

### Arborescence cible

```
/
├── .env.example                        # Variables d'environnement (Action 3)
├── .eslintrc.json                      # Config ESLint (Action 6)
├── .prettierrc                         # Config Prettier (Action 6)
├── jest.config.ts                      # Config Jest (déjà documentée)
├── middleware.ts                       # Auth JWT global (Action 4)
├── next.config.ts                      # Config Next.js + PWA
├── package.json
├── tsconfig.json
├── vercel.json                         # Cron keep-alive Supabase
├── README.md                           # (Action 10)
│
├── app/                                # App Router Next.js
│   ├── layout.tsx                      # Layout racine (providers, SW)
│   ├── page.tsx                        # Redirect → /aujourd-hui
│   ├── sw.ts                           # Service Worker source (Serwist)
│   │
│   ├── (auth)/                         # Routes non protégées
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── (app)/                          # Routes protégées (middleware)
│   │   ├── layout.tsx                  # Layout avec NavBar + providers
│   │   ├── aujourd-hui/page.tsx        # Briefing matin
│   │   ├── backlog/page.tsx
│   │   ├── qualifier/page.tsx          # Wizard qualification
│   │   ├── archives/page.tsx
│   │   ├── semaine/page.tsx
│   │   └── parametres/page.tsx
│   │
│   └── api/                            # Route Handlers
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── reset-password/route.ts
│       ├── taches/
│       │   ├── route.ts                # GET + POST
│       │   ├── semaine/route.ts        # GET vue semaine
│       │   └── [id]/
│       │       ├── route.ts            # GET + PATCH + DELETE
│       │       └── restaurer/route.ts  # POST
│       ├── capture/
│       │   └── ia/route.ts
│       ├── projets/
│       │   ├── route.ts                # GET + POST
│       │   └── [id]/route.ts           # PATCH + DELETE
│       ├── preferences/
│       │   └── route.ts                # GET + PATCH
│       └── keepalive/
│           └── route.ts                # GET — appelé par le cron Vercel (anti-pause Supabase)
│
├── components/                         # Composants React
│   ├── ui/                             # Composants génériques
│   │   ├── Toast.tsx
│   │   ├── Modal.tsx
│   │   ├── Bandeau.tsx                 # Bannières orange/rouge/hors ligne
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   └── DatePicker.tsx
│   │
│   ├── layout/
│   │   ├── NavBar.tsx                  # Barre de navigation du bas
│   │   ├── Fab.tsx                     # Bouton "+" flottant
│   │   └── Header.tsx
│   │
│   ├── taches/
│   │   ├── TacheCard.tsx               # Carte tâche dans le backlog
│   │   ├── TacheDetail.tsx             # Vue détail d'une tâche
│   │   ├── TacheCheck.tsx              # Case à cocher avec swipe
│   │   └── TacheForm.tsx               # Formulaire qualification
│   │
│   ├── capture/
│   │   ├── CaptureModal.tsx            # Modale de capture rapide
│   │   ├── VoiceCapture.tsx            # Bouton micro + Web Speech API
│   │   └── IAPreview.tsx               # Prévisualisation tâches IA
│   │
│   ├── briefing/
│   │   ├── BriefingResume.tsx          # Résumé chiffres du jour
│   │   └── ProjetAccordeon.tsx         # Accordéon par projet
│   │
│   ├── qualification/
│   │   └── QualificationWizard.tsx     # Wizard one-by-one
│   │
│   ├── retards/
│   │   └── RetardsWizard.tsx           # Wizard relance retards
│   │
│   ├── semaine/
│   │   └── SemaineMatrix.tsx           # Matrice projets × jours
│   │
│   └── onboarding/
│       └── OnboardingWizard.tsx        # Wizard 5 étapes
│
├── hooks/                              # Hooks React custom
│   ├── useTaches.ts                    # Fetch + cache tâches
│   ├── useProjets.ts                   # Fetch + cache projets
│   ├── usePreferences.ts               # Fetch + cache préférences
│   ├── useNotifications.ts             # Gestion Web Push
│   ├── useVoiceCapture.ts              # Web Speech API
│   ├── useConnexion.ts                 # Détection online/offline
│   └── useAuth.ts                      # Session + token JWT
│
├── lib/                                # Logique métier (testée dans TDD)
│   ├── supabase-client.ts              # Client Supabase côté client
│   ├── supabase-server.ts              # Client Supabase côté serveur
│   ├── claude-capture.ts               # Appel Claude API (déjà documenté)
│   ├── resend.ts                       # Envoi emails
│   ├── web-push.ts                     # Envoi notifications push
│   ├── logique-taches.ts               # preparerArchivage, calculerStatutRetard...
│   ├── logique-recurrence.ts           # calculerProchaineEcheance, creerTacheSuivante...
│   ├── logique-seuils.ts               # calculerNiveauAlerte
│   ├── logique-timezone.ts             # calculerHeureUTC, detecterTimezone
│   ├── logique-erreurs.ts              # classerErreur, TypeErreur
│   └── parser-ia.ts                    # parserReponseIA, validerReponseIA
│
├── types/                              # Types TypeScript partagés (Action 2)
│   ├── tache.ts
│   ├── projet.ts
│   ├── preferences.ts
│   ├── notification.ts
│   └── api.ts
│
├── supabase/                           # Config Supabase
│   ├── config.toml                     # Config Supabase CLI
│   └── migrations/                     # Migrations SQL (Action 5)
│       ├── 20260530000001_init.sql
│       ├── 20260530000002_rls.sql
│       ├── 20260530000003_triggers.sql
│       ├── 20260530000004_pg_cron.sql
│       └── 20260530000005_timezone.sql
│
├── public/
│   ├── manifest.json                   # PWA manifest
│   ├── sw.js                           # Service Worker (généré par Serwist depuis app/sw.ts — gitignoré)
│   └── icons/                          # Icônes PWA (192x192, 512x512)
│
└── __tests__/                          # Tests (déjà documentés)
    ├── unit/
    ├── integration/
    ├── e2e/
    └── mocks/
```

### Fichiers à créer immédiatement (squelettes vides)

Créer tous les fichiers avec un export vide pour que TypeScript puisse résoudre les imports dès le début :

```typescript
// Exemple : lib/logique-taches.ts
export const calculerStatutRetard = () => {};
export const preparerArchivage = () => {};
// etc.
```

### next.config.ts — configuration de base

> **Note (juin 2026)** : `next-pwa` n'est plus maintenu et casse avec les versions récentes de Next.js. Le projet utilise **Serwist** (`@serwist/next`), son successeur maintenu par la même communauté.

```typescript
import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',     // source du Service Worker
  swDest: 'public/sw.js', // fichier généré au build
  disable: process.env.NODE_ENV === 'development', // pas de SW en dev
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
};

export default withSerwist(nextConfig);
```

### app/sw.ts — source du Service Worker

```typescript
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache, // stratégie cache par défaut (lecture seule hors ligne V1)
});

// Réception des notifications Web Push
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Mes Tâches', {
      body: data.body,
      icon: '/icons/icon-192.png',
      data: { url: data.url ?? '/aujourd-hui' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});

serwist.addEventListeners();
```

**tsconfig.json — ajout requis pour `app/sw.ts`** : `"lib": [..., "webworker"]` et `"types": ["@serwist/next/typings"]`.

### public/manifest.json

```json
{
  "name": "Mes Tâches",
  "short_name": "Tâches",
  "description": "Outil personnel de gestion de tâches",
  "start_url": "/aujourd-hui",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#0f0f0f",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### vercel.json — cron keep-alive Supabase

**Pourquoi** : le plan gratuit Supabase met en pause les projets sans activité pendant ~7 jours. Un projet en pause = pg_cron arrêté = plus aucune notification. Un cron Vercel quotidien (inclus dans le plan Hobby, max 2 crons) pinge la base pour garantir qu'elle ne s'endort jamais, même pendant les vacances.

```json
{
  "crons": [
    { "path": "/api/keepalive", "schedule": "0 5 * * *" }
  ]
}
```

### app/api/keepalive/route.ts

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  // Vercel envoie automatiquement "Authorization: Bearer <CRON_SECRET>"
  // quand la variable d'environnement CRON_SECRET est définie
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  // Requête minimale — compte comme activité côté Supabase
  const { error } = await supabase.from('preferences').select('id').limit(1);

  return NextResponse.json({ ok: !error, at: new Date().toISOString() });
}
```

---

## Action 2 — Types TypeScript
**Durée estimée : 2h**
**Dépendances : Action 1**

### Objectif

Définir tous les types TypeScript partagés entre le frontend, le backend et les tests. Ces types sont la source de vérité — ils doivent refléter exactement le schéma PostgreSQL.

### types/tache.ts

```typescript
export type StatutTache =
  | 'a_qualifier'
  | 'active'
  | 'en_retard'
  | 'en_attente_retour'
  | 'archivee';

export type PrioriteTache = 'haute' | 'moyenne' | 'basse' | 'aucune';

export type FrequenceRecurrence = 'quotidienne' | 'hebdomadaire' | 'mensuelle';

export interface Recurrence {
  id: string;
  tache_mere_id: string;
  frequence: FrequenceRecurrence;
  jour_semaine?: number;  // 0=lundi, 6=dimanche
  jour_mois?: number;     // 1-31
  actif: boolean;
  created_at: string;
}

export interface Tache {
  id: string;
  user_id: string;
  projet_id: string | null;           // nullable — voir décision 19.1
  titre: string;
  notes: string | null;
  statut: StatutTache;
  priorite: PrioriteTache;
  date_debut: string | null;          // ISO 8601 date
  date_echeance: string | null;       // ISO 8601 datetime
  date_cloture: string | null;        // renseignée automatiquement
  responsable: string;                // "Moi" par défaut
  avancement: number;                 // 0-100
  temps_estime_min: number | null;
  recurrence_id: string | null;
  predecesseur_id: string | null;
  pre_caracterisee_ia: boolean;
  created_at: string;
  updated_at: string;
  // Relations jointes
  projet?: Projet | null;
  recurrence?: Recurrence | null;
  predecesseur?: Pick<Tache, 'id' | 'titre'> | null;
}

export interface TacheCreation {
  titre: string;
  projet_id?: string | null;
  priorite?: PrioriteTache;
  date_debut?: string | null;
  date_echeance?: string | null;
  responsable?: string;
  avancement?: number;
  temps_estime_min?: number | null;
  recurrence?: Pick<Recurrence, 'frequence' | 'jour_semaine' | 'jour_mois'> | null;
  predecesseur_id?: string | null;
  notes?: string | null;
  pre_caracterisee_ia?: boolean;
}

export interface TacheMaj {
  titre?: string;
  projet_id?: string | null;
  priorite?: PrioriteTache;
  statut?: StatutTache;
  date_debut?: string | null;
  date_echeance?: string | null;
  responsable?: string;
  avancement?: number;
  temps_estime_min?: number | null;
  notes?: string | null;
}

// Type retourné par Claude API après découpage vocal
export interface TacheIA {
  titre: string;
  projet_id: string | null;
  priorite: PrioriteTache;
  date_echeance: string | null;
  temps_estime_min: number | null;
  recurrence: Pick<Recurrence, 'frequence' | 'jour_semaine' | 'jour_mois'> | null;
  confiance: number;          // 0-1 sur l'attribution du projet
  projet_incertain: boolean;  // true si confiance < 0.6
}

// Type pour le briefing matin — tâches groupées par projet
export interface GroupeProjet {
  projet_id: string;          // 'sans-projet' si projet_id null
  projet_nom: string;
  couleur: string | null;
  icone: string | null;
  nb_taches: number;
  nb_retard: number;
  temps_total_min: number;
  taches: Tache[];
}
```

### types/projet.ts

```typescript
export type TypeIdentifiant = 'couleur' | 'icone';

export interface Projet {
  id: string;
  user_id: string;
  nom: string;
  ordre: number;
  type_identifiant: TypeIdentifiant;
  couleur: string | null;   // ex: '#4a9eff'
  icone: string | null;     // ex: '🏠'
  actif: boolean;
  created_at: string;
  updated_at: string;
  // Calculé côté API
  nb_taches_actives?: number;
}

export interface ProjetCreation {
  nom: string;
  type_identifiant: TypeIdentifiant;
  couleur?: string | null;
  icone?: string | null;
}

export interface PaletteDisponible {
  couleurs: string[];
  icones: string[];
}
```

### types/preferences.ts

```typescript
export interface Preferences {
  id: string;
  user_id: string;
  prenom: string;
  heure_briefing: string;       // format HH:MM
  heure_qualification: string;
  heure_retards: string;
  seuil_orange: number;         // défaut 15
  seuil_rouge: number;          // défaut 20
  timezone: string;             // ex: 'Europe/Paris'
  push_subscription: PushSubscriptionJSON | null;
  created_at: string;
  updated_at: string;
}

export interface PreferencesMaj {
  prenom?: string;
  heure_briefing?: string;
  heure_qualification?: string;
  heure_retards?: string;
  seuil_orange?: number;
  seuil_rouge?: number;
  timezone?: string;
  push_subscription?: PushSubscriptionJSON | null;
}
```

### types/notification.ts

```typescript
export type TypeNotification =
  | 'briefing_matin'
  | 'qualification'
  | 'relance_retards'
  | 'alerte_seuil';

export type CanalNotification = 'push' | 'email';
export type StatutNotification = 'planifiee' | 'envoyee' | 'echouee';

export interface JobNotification {
  id: string;
  user_id: string;
  type: TypeNotification;
  canal: CanalNotification;
  statut: StatutNotification;
  planifiee_at: string;
  envoyee_at: string | null;
  erreur: string | null;
  user_timezone: string | null;
  created_at: string;
}
```

### types/api.ts

```typescript
// Réponses API génériques

export type NiveauAlerte = 'orange' | 'rouge' | null;

export interface ReponseListeTaches {
  data: import('./tache').Tache[];
  total: number;
  nb_a_qualifier: number;
  nb_en_retard: number;
  alerte: NiveauAlerte;
  temps_total_min?: number;   // présent pour vue=briefing
}

export interface ReponseCreationTaches {
  taches: import('./tache').Tache[];
  nb_a_qualifier: number;
  alerte: NiveauAlerte;
}

export interface ReponseTache {
  tache: import('./tache').Tache;
  tache_suivante_id?: string | null;  // si récurrence déclenchée
  nb_a_qualifier?: number;
  alerte?: NiveauAlerte;
}

export interface ReponseCapture {
  taches: import('./tache').TacheIA[];
  duree_ms: number;
}

export interface ErreurAPI {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

// Codes d'erreur exhaustifs
export type CodeErreur =
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'TACHE_NOT_FOUND'
  | 'PROJET_NOT_FOUND'
  | 'COULEUR_DEJA_UTILISEE'
  | 'ICONE_DEJA_UTILISEE'
  | 'IA_TIMEOUT'
  | 'BDD_INDISPONIBLE'
  | 'EMAIL_DEJA_UTILISE'
  | 'SESSION_EXPIREE';
```

---

## Action 3 — Variables d'environnement
**Durée estimée : 1h**
**Dépendances : Action 1**

### Objectif

Documenter toutes les variables d'environnement nécessaires et leur origine. Créer le fichier `.env.example` qui sert de référence pour tous les développeurs.

### .env.example

```bash
# ============================================================
# SUPABASE
# Récupérer depuis : https://supabase.com/dashboard → Settings → API
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Service role key — NE JAMAIS exposer côté client
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================
# ANTHROPIC — Claude API
# Récupérer depuis : https://console.anthropic.com → API Keys
# NE JAMAIS exposer côté client (pas de NEXT_PUBLIC_)
# ============================================================
ANTHROPIC_API_KEY=sk-ant-api03-...

# ============================================================
# RESEND — Emails de secours
# Récupérer depuis : https://resend.com/api-keys
# NE JAMAIS exposer côté client
# ============================================================
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notifications@mes-taches.app

# ============================================================
# WEB PUSH — Notifications push
# Générer avec : npx web-push generate-vapid-keys
# ============================================================
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNxxxxxxxxxx...
VAPID_PRIVATE_KEY=xxxxxxxxxx...
VAPID_SUBJECT=mailto:admin@mes-taches.app

# ============================================================
# VERCEL CRON — keep-alive Supabase
# Générer une valeur aléatoire : openssl rand -hex 32
# Vercel l'envoie automatiquement dans le header Authorization des crons
# ============================================================
CRON_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================================
# APP
# ============================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
# En production : https://mes-taches.app

# ============================================================
# JEST (tests uniquement)
# ============================================================
TEST_BASE_URL=http://localhost:3001
```

### Règles de sécurité

- Les variables préfixées `NEXT_PUBLIC_` sont exposées au navigateur — ne jamais y mettre de secrets
- `SUPABASE_SERVICE_ROLE_KEY` et `ANTHROPIC_API_KEY` ne sont utilisées que dans les Route Handlers côté serveur
- En production sur Vercel : ajouter toutes les variables dans Settings → Environment Variables
- Ne jamais committer `.env.local` dans le repo (déjà dans `.gitignore` par défaut Next.js)

### Commande de génération des clés VAPID

```bash
npx web-push generate-vapid-keys
# Copier les valeurs dans .env.local
```

---

## Action 4 — Middleware d'authentification
**Durée estimée : 1h**
**Dépendances : Action 3**

### Objectif

Protéger toutes les routes `/app/(app)/*` et `/api/*` (sauf `/api/auth/*`) avec une vérification du token JWT Supabase. Si le token est absent ou invalide, rediriger vers `/login`.

### middleware.ts (racine du projet)

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes publiques — pas de vérification JWT
const ROUTES_PUBLIQUES = [
  '/login',
  '/register',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/keepalive', // protégée par CRON_SECRET dans la route elle-même
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // Laisser passer les routes publiques
  if (ROUTES_PUBLIQUES.some(route => pathname.startsWith(route))) {
    return res;
  }

  // Laisser passer les assets statiques et la PWA
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js'
  ) {
    return res;
  }

  // Vérifier le token JWT Supabase
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    // Routes API → retourner 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Session expirée — reconnecte-toi.', status: 401 } },
        { status: 401 }
      );
    }
    // Routes pages → rediriger vers /login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### lib/supabase-server.ts

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './database.types'; // généré par Supabase CLI

// Pour les Server Components
export function createSupabaseServerClient() {
  return createServerComponentClient<Database>({ cookies });
}

// Pour les Route Handlers
export function createSupabaseRouteClient() {
  return createRouteHandlerClient<Database>({ cookies });
}
```

### lib/supabase-client.ts

```typescript
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './database.types';

// Singleton côté client
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
```

### Générer les types Supabase

Après avoir appliqué les migrations (Action 5), générer les types TypeScript depuis le schéma :

```bash
npx supabase gen types typescript --project-id <project-id> > lib/database.types.ts
```

Ce fichier est regénéré à chaque migration — ne pas l'éditer manuellement.

---

## Action 5 — Migrations SQL
**Durée estimée : 2h**
**Dépendances : aucune**

### Objectif

Organiser le schéma BDD en fichiers de migration numérotés et chronologiques, compatibles avec Supabase CLI. Chaque migration est atomique et irréversible en production.

### Installation Supabase CLI

```bash
npm install -g supabase
supabase login
supabase init          # crée /supabase/config.toml
supabase link --project-ref <project-id>
```

### supabase/migrations/20260530000001_init.sql

Tables de base : `preferences`, `projets`, `recurrences`, `taches`.

```sql
-- Extensions nécessaires
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- Types enum
create type projet_identifiant as enum ('couleur', 'icone');
create type statut_tache as enum (
  'a_qualifier', 'active', 'en_retard',
  'en_attente_retour', 'archivee'
);
create type priorite_tache as enum ('haute', 'moyenne', 'basse', 'aucune');
create type frequence_recurrence as enum ('quotidienne', 'hebdomadaire', 'mensuelle');

-- Table preferences
create table preferences (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  prenom              text not null,
  heure_briefing      time not null default '08:00',
  heure_qualification time not null default '12:00',
  heure_retards       time not null default '18:00',
  seuil_orange        integer not null default 15,
  seuil_rouge         integer not null default 20,
  timezone            text not null default 'Europe/Paris',
  push_subscription   jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint preferences_user_unique unique (user_id),
  constraint preferences_seuils_check check (seuil_rouge > seuil_orange),
  constraint preferences_seuil_min_check check (seuil_orange >= 1),
  constraint preferences_timezone_check check (timezone ~ '^[A-Za-z]+/[A-Za-z_]+$')
);

-- Table projets
create table projets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  nom               text not null,
  ordre             integer not null default 0,
  type_identifiant  projet_identifiant not null default 'couleur',
  couleur           text,
  icone             text,
  actif             boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint projets_couleur_unique unique (user_id, couleur),
  constraint projets_icone_unique unique (user_id, icone),
  constraint projets_identifiant_check check (
    (type_identifiant = 'couleur' and couleur is not null and icone is null) or
    (type_identifiant = 'icone' and icone is not null and couleur is null)
  )
);

-- Table taches (projet_id nullable — décision 19.1)
create table taches (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  projet_id           uuid references projets(id) on delete set null,  -- nullable
  titre               text not null,
  notes               text,
  statut              statut_tache not null default 'a_qualifier',
  priorite            priorite_tache not null default 'moyenne',
  date_debut          date,
  date_echeance       timestamptz,
  date_cloture        timestamptz,
  responsable         text not null default 'Moi',
  avancement          integer not null default 0 check (avancement between 0 and 100),
  temps_estime_min    integer,
  recurrence_id       uuid,  -- FK ajoutée après création de recurrences
  predecesseur_id     uuid references taches(id) on delete set null,
  pre_caracterisee_ia boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Table recurrences (après taches pour la FK circulaire)
create table recurrences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  tache_mere_id   uuid not null references taches(id) on delete cascade,
  frequence       frequence_recurrence not null,
  jour_semaine    integer check (jour_semaine between 0 and 6),
  jour_mois       integer check (jour_mois between 1 and 31),
  actif           boolean not null default true,
  created_at      timestamptz not null default now(),
  constraint recurrence_hebdo_check check (
    frequence != 'hebdomadaire' or jour_semaine is not null
  ),
  constraint recurrence_mensuelle_check check (
    frequence != 'mensuelle' or jour_mois is not null
  )
);

-- Ajouter la FK recurrence_id sur taches maintenant que recurrences existe
alter table taches
  add constraint taches_recurrence_fk
  foreign key (recurrence_id) references recurrences(id) on delete set null;

-- Table jobs_notifications
create type type_notification as enum (
  'briefing_matin', 'qualification', 'relance_retards', 'alerte_seuil'
);
create type canal_notification as enum ('push', 'email');
create type statut_notification as enum ('planifiee', 'envoyee', 'echouee');

create table jobs_notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          type_notification not null,
  canal         canal_notification not null,
  statut        statut_notification not null default 'planifiee',
  planifiee_at  timestamptz not null,
  envoyee_at    timestamptz,
  erreur        text,
  user_timezone text,
  created_at    timestamptz not null default now()
);
```

### supabase/migrations/20260530000002_indexes.sql

```sql
-- Index preferences
create index on preferences(user_id);

-- Index projets
create index on projets(user_id);
create index on projets(user_id, actif);

-- Index taches
create index on taches(user_id, statut);
create index on taches(user_id, projet_id);
create index on taches(user_id, date_echeance);
create index on taches(user_id, priorite);
create index on taches(user_id, statut, date_echeance)
  where statut in ('active', 'en_retard', 'en_attente_retour');
create index on taches(user_id, created_at)
  where statut = 'a_qualifier';
create index on taches(user_id, date_cloture)
  where statut = 'archivee';

-- Index recurrences
create index on recurrences(tache_mere_id);
create index on recurrences(user_id, actif);

-- Index jobs_notifications
create index on jobs_notifications(user_id, type, planifiee_at);
create index on jobs_notifications(statut, planifiee_at)
  where statut = 'planifiee';
```

### supabase/migrations/20260530000003_rls.sql

```sql
-- Row Level Security sur toutes les tables
alter table preferences enable row level security;
alter table projets enable row level security;
alter table taches enable row level security;
alter table recurrences enable row level security;
alter table jobs_notifications enable row level security;

create policy "preferences_user" on preferences for all using (auth.uid() = user_id);
create policy "projets_user" on projets for all using (auth.uid() = user_id);
create policy "taches_user" on taches for all using (auth.uid() = user_id);
create policy "recurrences_user" on recurrences for all using (auth.uid() = user_id);
create policy "jobs_user" on jobs_notifications for all using (auth.uid() = user_id);
```

### supabase/migrations/20260530000004_triggers.sql

```sql
-- Fonction updated_at générique
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger taches_updated_at before update on taches
  for each row execute function set_updated_at();
create trigger preferences_updated_at before update on preferences
  for each row execute function set_updated_at();
create trigger projets_updated_at before update on projets
  for each row execute function set_updated_at();

-- Archivage automatique → date_cloture
create or replace function set_date_cloture()
returns trigger as $$
begin
  if new.statut = 'archivee' and old.statut != 'archivee' then
    new.date_cloture = now();
    new.avancement = 100;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger taches_cloture before update on taches
  for each row execute function set_date_cloture();

-- Création tâche récurrente suivante
create or replace function creer_tache_recurrente()
returns trigger as $$
declare
  rec recurrences%rowtype;
  nouvelle_echeance timestamptz;
begin
  if new.statut = 'archivee'
    and old.statut != 'archivee'
    and new.recurrence_id is not null
  then
    select * into rec from recurrences
    where id = new.recurrence_id and actif = true;

    if found then
      nouvelle_echeance := case rec.frequence
        when 'quotidienne'  then new.date_echeance + interval '1 day'
        when 'hebdomadaire' then new.date_echeance + interval '7 days'
        when 'mensuelle'    then new.date_echeance + interval '1 month'
      end;

      insert into taches (
        user_id, projet_id, titre, notes, statut, priorite,
        date_echeance, responsable, temps_estime_min,
        recurrence_id, predecesseur_id, avancement
      ) values (
        new.user_id, new.projet_id, new.titre, new.notes,
        'active', new.priorite, nouvelle_echeance,
        new.responsable, new.temps_estime_min,
        new.recurrence_id, new.predecesseur_id, 0
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger taches_recurrence after update on taches
  for each row execute function creer_tache_recurrente();

-- Mise à jour statut en_retard (appelée par pg_cron)
create or replace function update_statuts_retard()
returns void as $$
begin
  update taches
  set statut = 'en_retard'
  where statut in ('active', 'en_attente_retour')
    and date_echeance < now();
end;
$$ language plpgsql;
```

### supabase/migrations/20260530000005_pg_cron.sql

```sql
-- Mise à jour quotidienne des statuts en retard (minuit UTC)
select cron.schedule(
  'update-statuts-retard',
  '0 0 * * *',
  'select update_statuts_retard()'
);

-- Scheduling des notifications (toutes les 5 minutes)
select cron.schedule(
  'process-notifications',
  '*/5 * * * *',
  'select process_notifications()'
);
```

### Commandes de déploiement

```bash
# Appliquer toutes les migrations en local
supabase db push

# Générer les types TypeScript après migration
npx supabase gen types typescript \
  --project-id <project-id> \
  > lib/database.types.ts

# Vérifier l'état des migrations
supabase migration list
```

---

## Action 6 — ESLint + Prettier + Serwist
**Durée estimée : 1h**
**Dépendances : Action 1**

### Installation

```bash
npm install --save-dev \
  eslint \
  eslint-config-next \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  prettier \
  eslint-config-prettier \
  eslint-plugin-prettier

npm install @serwist/next
npm install --save-dev serwist
```

### .eslintrc.json

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "prefer-const": "error"
  },
  "ignorePatterns": ["lib/database.types.ts"]
}
```

### .prettierrc

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

### package.json — scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "jest",
    "test:unit": "jest --selectProjects unit",
    "test:integration": "jest --selectProjects integration",
    "test:e2e": "jest --selectProjects e2e",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "db:push": "supabase db push",
    "db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > lib/database.types.ts",
    "vapid:generate": "npx web-push generate-vapid-keys"
  }
}
```

### .gitignore (compléments)

```
# Env
.env.local
.env.*.local

# Supabase
.supabase/

# Tests
coverage/

# PWA (générés par Serwist au build)
public/sw.js
public/sw.js.map
public/swe-worker-*.js
```

---

## Action 7 — Gestion d'état React
**Durée estimée : 1h**
**Dépendances : Action 2**

### Décision : React Context + hooks custom

Pour ce projet solo avec un volume modéré de données, **React Context + hooks custom** est suffisant. Zustand serait over-engineering. Le cache Next.js (React Query ou SWR) gère le refetch automatique.

### Installation

```bash
npm install swr
```

SWR est choisi pour le fetching et le cache — il gère le revalidation on focus, le stale-while-revalidate, et le optimistic update nativement.

### Contextes à créer

**AppContext** — état global léger, partagé partout :

```typescript
// contexts/AppContext.tsx
interface AppState {
  nbAQualifier: number;           // badge nav bar
  alerte: 'orange' | 'rouge' | null; // bannières
  isOnline: boolean;              // état réseau
  tokenExpire: boolean;           // session expirée
}
```

**AuthContext** — session utilisateur :

```typescript
// contexts/AuthContext.tsx
interface AuthState {
  user: User | null;
  preferences: Preferences | null;
  isLoading: boolean;
}
```

### Pattern des hooks custom

```typescript
// hooks/useTaches.ts — exemple de pattern SWR
import useSWR from 'swr';
import type { ReponseListeTaches } from '@/types/api';

export function useTaches(params?: { statut?: string; vue?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const { data, error, isLoading, mutate } = useSWR<ReponseListeTaches>(
    `/api/taches?${query}`
  );

  return {
    taches: data?.data ?? [],
    nbAQualifier: data?.nb_a_qualifier ?? 0,
    alerte: data?.alerte ?? null,
    isLoading,
    error,
    mutate, // pour les invalidations après mutation
  };
}
```

---

## Action 8 — Librairies clés
**Durée estimée : 1h**
**Dépendances : Action 1**

### Installation complète

```bash
# Core
npm install next@latest react@latest react-dom@latest typescript@latest

# Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# IA
npm install @anthropic-ai/sdk

# Email
npm install resend

# Web Push
npm install web-push
npm install --save-dev @types/web-push

# Fetching et cache
npm install swr

# Dates (pour la gestion timezone)
npm install date-fns date-fns-tz

# PWA
npm install @serwist/next
npm install --save-dev serwist

# Dev
npm install --save-dev \
  jest @types/jest ts-jest \
  @testing-library/react @testing-library/jest-dom \
  supertest @types/supertest \
  jest-environment-jsdom
```

### Justification des choix

| Librairie | Usage | Pourquoi |
|---|---|---|
| `@anthropic-ai/sdk` | Client Claude API officiel | SDK officiel, types inclus |
| `resend` | Emails de secours | SDK simple, plan gratuit suffisant |
| `web-push` | Envoi notifications push côté serveur | Standard VAPID |
| `swr` | Fetching et cache côté client | Simple, performant, React-first |
| `date-fns` + `date-fns-tz` | Manipulation des dates et timezones | Léger, tree-shakeable |
| `@serwist/next` + `serwist` | Service Worker et PWA | Successeur maintenu de next-pwa, compatible Next.js récents |

---

## Action 9 — Roadmap de développement
**Durée estimée : 2h**
**Dépendances : toutes les actions précédentes**

### Principe

Construire en **couches verticales** — chaque sprint livre une fonctionnalité utilisable de bout en bout plutôt que des couches techniques horizontales (d'abord toute la BDD, puis toute l'API, puis tout le frontend).

### Sprint 0 — Setup (Actions 1 à 8)
**Durée : 1 jour**
- Structure projet, types, variables d'env, middleware, migrations, ESLint, librairies
- Vérifier que `npm run dev` démarre sans erreur
- Vérifier que `npm test` passe (0 tests pour l'instant → 0 échecs)

---

### Sprint 1 — Auth + Onboarding
**Durée : 3 jours**

Objectif : un utilisateur peut créer un compte, se connecter, configurer ses projets et se déconnecter.

- [ ] Pages `/login`, `/register`, `/reset-password`
- [ ] Route Handlers `POST /api/auth/register`, `/login`, `/logout`, `/reset-password`
- [ ] `lib/supabase-server.ts` et `lib/supabase-client.ts`
- [ ] `middleware.ts` — protection des routes
- [ ] `OnboardingWizard.tsx` — 5 étapes
- [ ] `hooks/useAuth.ts`
- [ ] Tests : `api-auth.test.ts`

**Critère de succès** : je peux créer un compte, me connecter, voir l'écran d'accueil, me déconnecter.

---

### Sprint 2 — Capture de tâches
**Durée : 3 jours**

Objectif : un utilisateur peut capturer une tâche en texte ou en vocal.

- [ ] `VoiceCapture.tsx` — bouton micro + Web Speech API
- [ ] `lib/claude-capture.ts` — appel Claude API
- [ ] `lib/parser-ia.ts` — parsing réponse
- [ ] `IAPreview.tsx` — prévisualisation tâches IA
- [ ] `CaptureModal.tsx` — modale de capture
- [ ] `Fab.tsx` — bouton "+"
- [ ] Route Handler `POST /api/capture/ia`
- [ ] Route Handler `POST /api/taches`
- [ ] Tests : `api-capture-ia.test.ts`, `parser-ia.test.ts`

**Critère de succès** : je dicte "Rappeler Martin demain matin" et une tâche apparaît en file "à qualifier".

---

### Sprint 3 — Backlog + Qualification
**Durée : 4 jours**

Objectif : un utilisateur voit ses tâches, peut les filtrer et les qualifier.

- [ ] `TacheCard.tsx` avec date, progression, icône ⚡
- [ ] `page.tsx` Backlog avec filtres, tri, sections
- [ ] `hooks/useTaches.ts`
- [ ] `QualificationWizard.tsx`
- [ ] `page.tsx` Qualification
- [ ] Route Handler `GET /api/taches`
- [ ] Route Handler `PATCH /api/taches/:id`
- [ ] `NavBar.tsx` avec badge compteur
- [ ] `Bandeau.tsx` — orange/rouge
- [ ] `lib/logique-seuils.ts`
- [ ] Tests : `api-taches.test.ts`, `logique-seuils.test.ts`

**Critère de succès** : je vois mes tâches dans le backlog, je peux les qualifier via le wizard.

---

### Sprint 4 — Briefing matin + Retards
**Durée : 3 jours**

Objectif : les 3 flux quotidiens fonctionnent.

- [ ] `BriefingResume.tsx` + `ProjetAccordeon.tsx`
- [ ] `page.tsx` Aujourd'hui
- [ ] `RetardsWizard.tsx`
- [ ] `GET /api/taches?vue=briefing`
- [ ] `GET /api/taches?vue=retards`
- [ ] `lib/logique-taches.ts` — calculerStatutRetard, preparerArchivage
- [ ] `lib/logique-retard.ts`
- [ ] Tests : `flux-briefing.test.ts`, `flux-qualification.test.ts`, `flux-relance-retards.test.ts`

**Critère de succès** : le briefing matin s'affiche correctement, je peux cocher des tâches et traiter les retards.

---

### Sprint 5 — Notifications
**Durée : 3 jours**

Objectif : les 3 notifications quotidiennes arrivent à l'heure.

- [ ] `lib/web-push.ts` — envoi notifications
- [ ] `lib/resend.ts` — emails de secours
- [ ] `hooks/useNotifications.ts` — abonnement Web Push côté client
- [ ] Supabase Edge Function `process_notifications`
- [ ] Supabase Edge Function `schedule_notifications`
- [ ] `lib/logique-timezone.ts`
- [ ] Migration `20260530000005_pg_cron.sql`
- [ ] Tests : `api-timezone.test.ts`, `logique-timezone.test.ts`

**Critère de succès** : je reçois une notification push à 8h avec mes tâches du jour.

---

### Sprint 6 — Archives + Vue semaine + Paramètres
**Durée : 3 jours**

Objectif : les écrans secondaires sont complets.

- [ ] `page.tsx` Archives avec filtres et restauration
- [ ] `SemaineMatrix.tsx`
- [ ] `page.tsx` Semaine
- [ ] `page.tsx` Paramètres
- [ ] `GET /api/taches/semaine`
- [ ] `GET + PATCH /api/preferences`
- [ ] `GET + POST + PATCH + DELETE /api/projets`
- [ ] `POST /api/taches/:id/restaurer`
- [ ] Tests : `api-projets.test.ts`, `api-preferences.test.ts`

**Critère de succès** : toutes les pages sont accessibles et fonctionnelles.

---

### Sprint 7 — Récurrence + Robustesse
**Durée : 2 jours**

Objectif : les tâches récurrentes fonctionnent, les erreurs sont gérées.

- [ ] `lib/logique-recurrence.ts`
- [ ] `lib/logique-erreurs.ts`
- [ ] `Toast.tsx`, `Modal.tsx` — états d'erreur
- [ ] `hooks/useConnexion.ts` — détection offline
- [ ] Tests : `logique-recurrence.test.ts`, `api-erreurs.test.ts`

**Critère de succès** : une tâche récurrente cochée génère la suivante ; les erreurs affichent le bon message.

---

### Sprint 8 — Polish + Tests complets
**Durée : 2 jours**

- [ ] Passer tous les 236 tests au vert
- [ ] Audit performance (Lighthouse PWA score > 90)
- [ ] Test installation PWA sur Android
- [ ] Vérification des notifications push sur device réel
- [ ] Review sécurité (RLS, clés API, token expiry)

---

## Action 10 — README
**Durée estimée : 1h**
**Dépendances : toutes les actions précédentes**

### README.md (racine du projet)

```markdown
# Mes Tâches

Outil personnel de gestion de tâches — PWA Next.js + Supabase + Claude API.

## Stack

| Brique | Technologie |
|---|---|
| Frontend | Next.js 15 (PWA) |
| Backend + BDD + Auth | Supabase |
| IA | Claude API (Anthropic) |
| Email | Resend |
| Push notifications | Web Push API |
| Tests | Jest (177 tests) |

## Démarrage rapide

### Prérequis
- Node.js 20+
- Compte Supabase
- Clé API Anthropic
- Compte Resend

### Installation

\`\`\`bash
git clone <repo>
cd mes-taches
npm install
\`\`\`

### Configuration

\`\`\`bash
cp .env.example .env.local
# Remplir les variables dans .env.local
\`\`\`

### Base de données

\`\`\`bash
npm run db:push        # Appliquer les migrations
npm run db:types       # Générer les types TypeScript
\`\`\`

### Générer les clés VAPID (notifications push)

\`\`\`bash
npm run vapid:generate
# Copier les clés dans .env.local
\`\`\`

### Lancer en développement

\`\`\`bash
npm run dev
\`\`\`

### Tests

\`\`\`bash
npm test               # Tous les tests
npm run test:unit      # Tests unitaires uniquement
npm run test:coverage  # Avec couverture
\`\`\`

## Documents de référence

| Document | Description |
|---|---|
| `cadrage-complet.md` | Cahier des charges fonctionnel (v4) |
| `besoins-utilisateurs.md` | 19 besoins utilisateurs (v2) |
| `inventaire-ecrans.md` | 12 écrans documentés (v2) |
| `audit-technique.md` | Arbitrages techniques (v1) |
| `schema-base-donnees.md` | Schéma PostgreSQL complet |
| `api-principales.md` | 16 endpoints documentés |
| `tests-tdd.md` | 236 tests TDD |
| `prompt-engineering.md` | Prompt Claude API |
| `analyse-critique-consultant.md` | Revue consultant |

## Architecture

\`\`\`
Client PWA (Next.js)
  └── Route Handlers (/app/api/...)
        ├── Supabase (BDD + Auth + RLS)
        ├── Claude API (découpage vocal IA)
        └── Resend (emails de secours)

Supabase Edge Functions (jobs async)
  ├── Web Push API (notifications push)
  └── Resend (fallback email)
\`\`\`

## Roadmap

- [x] Sprint 0 — Setup
- [ ] Sprint 1 — Auth + Onboarding
- [ ] Sprint 2 — Capture de tâches
- [ ] Sprint 3 — Backlog + Qualification
- [ ] Sprint 4 — Briefing + Retards
- [ ] Sprint 5 — Notifications
- [ ] Sprint 6 — Archives + Semaine + Paramètres
- [ ] Sprint 7 — Récurrence + Robustesse
- [ ] Sprint 8 — Polish + Tests complets
\`\`\`
```

---

## Récapitulatif

| Action | Durée | Dépendances | Livrable |
|---|---|---|---|
| 1 — Structure projet | 2h | Aucune | Arborescence + squelettes |
| 2 — Types TypeScript | 2h | Action 1 | `/types/*.ts` |
| 3 — Variables d'env | 1h | Action 1 | `.env.example` |
| 4 — Middleware auth | 1h | Action 3 | `middleware.ts` + `lib/supabase-*.ts` |
| 5 — Migrations SQL | 2h | Aucune | `/supabase/migrations/*.sql` |
| 6 — ESLint + Prettier + PWA | 1h | Action 1 | `.eslintrc.json`, `.prettierrc`, scripts |
| 7 — Gestion d'état | 1h | Action 2 | Décision + pattern SWR + contextes |
| 8 — Librairies | 1h | Action 1 | `package.json` complet |
| 9 — Roadmap | 2h | Toutes | 8 sprints détaillés |
| 10 — README | 1h | Toutes | `README.md` |
| **Total** | **14h** | | **Projet prêt à coder** |
EOF