---
name: software-project-kickoff
description: >
  Préparation complète au démarrage d'un projet de développement informatique :
  structure du projet, types TypeScript, migrations SQL, variables d'environnement,
  middleware d'authentification, configuration des outils, roadmap de développement et README.
  Utilise ce skill dès que l'utilisateur veut démarrer le développement d'un outil informatique
  dont le cadrage est terminé, ou quand il dit "on commence à coder", "comment on démarre",
  "prépare le projet", "setup du projet", "par où on commence pour développer".
  Ce skill fait suite à software-tech-design. Il produit tout ce qu'un développeur
  a besoin pour écrire la première ligne de code sans ambiguïté.
---

# Software Project Kickoff

Skill de préparation au démarrage de développement. Prend en entrée les documents
techniques (issus de software-tech-design ou fournis directement) et produit
l'ensemble des fichiers et décisions nécessaires avant le premier commit.

---

## Principe fondamental

**Zéro ambiguïté avant le premier commit.** Un développeur qui suit ces documents
doit pouvoir démarrer sans poser de questions. Chaque fichier a une place,
chaque variable a une source, chaque décision est documentée.

**Ordre de priorité des actions.** Certaines actions bloquent les autres.
Toujours respecter l'ordre de dépendances défini à l'étape 1.

---

## Vue d'ensemble des étapes

```
Étape 1 — Reprise du contexte et inventaire   (lire les docs, définir les actions)
Étape 2 — Structure du projet                 (arborescence complète)
Étape 3 — Types TypeScript                    (source de vérité des types)
Étape 4 — Variables d'environnement           (.env.example complet)
Étape 5 — Middleware authentification         (protection des routes)
Étape 6 — Migrations SQL                      (fichiers numérotés)
Étape 7 — Outillage                           (ESLint, Prettier, PWA, librairies)
Étape 8 — Gestion d'état                      (décision et pattern)
Étape 9 — Roadmap de développement            (sprints détaillés)
Étape 10 — README                             (documentation d'entrée)
Étape 11 — Plan de démarrage                  (livrable final consolidé)
```

---

## Étape 1 — Reprise du contexte

### 1.1 Lire les documents existants

Lire en priorité (dans cet ordre) :
1. Le cadrage complet (fonctionnel + technique)
2. Le schéma de base de données
3. La liste des API
4. L'inventaire des écrans

Extraire :
- La stack technique retenue
- Les entités et leurs relations
- Les endpoints et leurs dépendances
- Les contraintes de sécurité

### 1.2 Identifier ce qui manque

Avant de produire quoi que ce soit, identifier les décisions non prises
qui bloquent le démarrage. Exemples typiques :
- Projet nullable ou obligatoire sur les entités ?
- Gestion des fuseaux horaires ?
- Politique de gestion des erreurs utilisateur ?
- Reset de mot de passe prévu ?

Pour chaque point bloquant, poser la question et attendre la réponse.

### 1.3 Définir l'ordre des actions

Présenter le plan d'actions avec les dépendances et les durées estimées :

```
Action 1 — [Nom]    (Xh) ← faire en premier
Action 2 — [Nom]    (Xh) ← dépend de Action 1
Action 3 — [Nom]    (Xh) ← indépendant
...
```

Demander validation avant de commencer.

---

## Étape 2 — Structure du projet

### 2.1 Produire l'arborescence complète

Adapater l'arborescence à la stack retenue. Pour une stack Next.js typique :

```
/
├── app/                    # Routes (App Router)
│   ├── (auth)/             # Routes non protégées
│   ├── (app)/              # Routes protégées
│   └── api/                # Route Handlers
├── components/             # Composants React
│   ├── ui/                 # Composants génériques
│   ├── layout/             # Navigation, header
│   └── [feature]/          # Composants par feature
├── hooks/                  # Hooks React custom
├── lib/                    # Logique métier (testée)
├── types/                  # Types TypeScript partagés
├── supabase/               # Migrations SQL
│   └── migrations/
└── public/                 # Assets statiques + PWA manifest
```

Adapter selon la stack. Pour d'autres frameworks, ajuster la structure.

### 2.2 Règles de nommage

Définir les conventions de nommage pour le projet :
- Composants React : PascalCase (`TacheCard.tsx`)
- Hooks : camelCase avec préfixe `use` (`useTaches.ts`)
- Librairies : camelCase (`logique-taches.ts`)
- Types : PascalCase dans des fichiers kebab-case (`types/tache.ts`)
- Route Handlers : `route.ts` dans le dossier de la route

### 2.3 Fichiers squelettes

Lister les fichiers à créer immédiatement avec un export vide
pour que TypeScript puisse résoudre les imports dès le départ.

---

## Étape 3 — Types TypeScript

### 3.1 Identifier les types nécessaires

À partir du schéma BDD et des API, lister tous les types à définir :
- Types des entités (reflet exact du schéma SQL)
- Types des requêtes (création, mise à jour)
- Types des réponses API
- Types des erreurs
- Enums (statuts, priorités, fréquences...)

### 3.2 Règles de production des types

- Les types reflètent **exactement** le schéma PostgreSQL
- Les champs nullables en BDD sont `type | null` en TypeScript
- Les enums PostgreSQL ont leur équivalent TypeScript
- Les types des réponses API sont distincts des types des entités BDD
- Un fichier par domaine (`types/tache.ts`, `types/projet.ts`...)

### 3.3 Valider les types critiques

Après production, présenter les types des entités principales et demander :
> "Est-ce que ces types reflètent bien ce que tu attends ?
> Y a-t-il des champs manquants ou mal typés ?"

---

## Étape 4 — Variables d'environnement

### 4.1 Produire le .env.example complet

Pour chaque variable :
- Nom (avec `NEXT_PUBLIC_` si exposée au client, sans si serveur uniquement)
- Valeur d'exemple ou placeholder
- Commentaire : d'où vient cette variable, comment la générer

Regrouper par service (BDD, Auth, IA, Email, Push...).

### 4.2 Règles de sécurité

Documenter explicitement :
- Quelles variables ne doivent jamais être exposées côté client
- Comment les configurer en production (Vercel, autre hébergeur)
- Les variables à générer (clés VAPID, secrets JWT...)

### 4.3 Commandes de génération

Pour les variables qui se génèrent (clés, secrets), documenter les commandes exactes.

---

## Étape 5 — Middleware d'authentification

### 5.1 Définir la stratégie d'auth

- Quelles routes sont publiques ?
- Quelles routes sont protégées ?
- Comportement si token absent ou expiré (redirect vs 401) ?
- Durée de vie des sessions ?

### 5.2 Produire le middleware

Adapter à la stack retenue. Couvrir :
- Interception de toutes les requêtes
- Vérification du token JWT
- Redirection vers login si non authentifié (routes pages)
- Retour 401 JSON si non authentifié (routes API)
- Laisser passer les assets statiques

### 5.3 Produire les clients BDD

- Client côté serveur (Route Handlers, Server Components)
- Client côté client (Browser, hooks)
- Génération des types depuis le schéma BDD

---

## Étape 6 — Migrations SQL

### 6.1 Découper en fichiers atomiques

Organiser les migrations en fichiers numérotés et chronologiques :

```
migrations/
├── 00001_init.sql          # Tables de base
├── 00002_indexes.sql       # Index
├── 00003_rls.sql           # Sécurité (Row Level Security)
├── 00004_triggers.sql      # Triggers et fonctions
└── 00005_jobs.sql          # Jobs schedulés (pg_cron...)
```

Chaque fichier est atomique — peut être appliqué indépendamment.

### 6.2 Ordre des migrations

Respecter l'ordre des dépendances :
1. Types enum
2. Tables sans FK (utilisateurs, préférences)
3. Tables avec FK simples
4. Tables avec FK circulaires (ajouter les FK après création)
5. Index
6. RLS
7. Triggers et fonctions
8. Jobs schedulés

### 6.3 Commandes de déploiement

Documenter les commandes pour :
- Appliquer les migrations en local
- Appliquer en production
- Vérifier l'état des migrations
- Générer les types TypeScript depuis le schéma

---

## Étape 7 — Outillage

### 7.1 ESLint + Prettier

Produire les configurations adaptées à la stack :
- `.eslintrc.json` avec les règles projet
- `.prettierrc` avec le style de code
- Scripts npm pour lint et format

### 7.2 Configuration du framework

Produire les fichiers de configuration principaux :
- `next.config.ts` (ou équivalent selon le framework)
- `tsconfig.json` (ajustements si nécessaires)
- `jest.config.ts`

### 7.3 PWA (si applicable)

Si la stack inclut une PWA :
- Configuration `next-pwa` ou équivalent
- `public/manifest.json` avec les métadonnées de l'app
- Instructions pour générer les icônes

### 7.4 Scripts package.json

Définir tous les scripts utiles :
- `dev`, `build`, `start`
- `lint`, `lint:fix`, `format`
- `test`, `test:unit`, `test:coverage`, `test:watch`
- Scripts spécifiques au projet (migrations, génération de types, clés...)

### 7.5 Liste des librairies

Produire la commande d'installation complète avec justification de chaque librairie.

---

## Étape 8 — Gestion d'état

### 8.1 Recommander une stratégie

Selon la complexité du projet, recommander :
- **React Context + hooks custom** — projets simples, état peu partagé
- **SWR ou React Query** — projets avec fetching complexe et cache
- **Zustand** — projets avec état global complexe
- **Combinaison** — Context pour l'état global léger, SWR pour le fetching

Expliquer le choix en termes de conséquences concrètes, pas de jargon.

### 8.2 Définir les contextes

Lister les contextes nécessaires avec leur contenu :
- Quelles données sont globales (visibles partout) ?
- Quelles données sont locales (propres à un écran) ?

### 8.3 Pattern des hooks custom

Produire un exemple complet du pattern de hook custom à répliquer dans le projet.

---

## Étape 9 — Roadmap de développement

### 9.1 Principe de construction par couches verticales

**Règle fondamentale** : chaque sprint livre quelque chose d'utilisable,
pas une couche technique. Un sprint "toute la BDD" sans aucun écran visible
est un mauvais sprint.

### 9.2 Structure d'un sprint

Pour chaque sprint :
- Durée estimée
- Objectif fonctionnel (ce que l'utilisateur peut faire à la fin)
- Liste des tâches (fichiers à créer, routes à implémenter, composants)
- Critère de succès concret et testable humainement en 2 minutes

### 9.3 Sprint 0 obligatoire

Le Sprint 0 est toujours le setup :
- Toutes les actions de ce skill (structure, types, migrations, outillage)
- Vérification que `npm run dev` démarre sans erreur
- Vérification que `npm test` passe (0 tests = 0 échecs)

### 9.4 Ordre des sprints

Recommander l'ordre selon les dépendances fonctionnelles :
1. Auth + onboarding (toujours en premier — tout en dépend)
2. Feature principale de capture/saisie
3. Feature principale de consultation
4. Features de notification / scheduling
5. Features secondaires
6. Polish + tests complets

### 9.5 Valider la roadmap

Présenter la roadmap et demander :
> "Est-ce que cet ordre te semble logique ?
> Y a-t-il des sprints à réordonner, fusionner ou découper ?"

---

## Étape 10 — README

### 10.1 Structure minimale du README

```
# [Nom du projet]

[Description en 2 lignes]

## Stack
[Tableau stack technique]

## Démarrage rapide
[Prérequis, installation, configuration, lancement]

## Configuration
[Variables d'environnement, commandes de génération]

## Tests
[Commandes de test]

## Documents de référence
[Liste des .md avec description]

## Architecture
[Schéma textuel des composants]

## Roadmap
[Checklist des sprints]
```

### 10.2 Proposer le format

> "Je peux produire le README en :
> - Fichier `README.md` à la racine du projet (standard)
> - Fichier `.md` dans la documentation
> Tu préfères lequel ?"

---

## Étape 11 — Plan de démarrage consolidé

### 11.1 Produire le document final

Consolider toutes les actions dans un document `plan-demarrage.md` :
- Toutes les actions avec durée et dépendances
- Tous les fichiers à créer avec leur contenu
- Toutes les commandes à exécuter dans l'ordre
- La roadmap de développement complète

### 11.2 Checklist de démarrage

Terminer avec une checklist que le développeur peut suivre pas à pas :

```
Sprint 0 — Setup
[ ] Cloner le repo et installer les dépendances
[ ] Copier .env.example → .env.local et remplir les variables
[ ] Appliquer les migrations : npm run db:push
[ ] Générer les types : npm run db:types
[ ] Vérifier : npm run dev → pas d'erreur
[ ] Vérifier : npm test → 0 échecs
[ ] Installer la PWA sur Android et vérifier l'icône
[ ] ✅ Sprint 0 terminé — démarrer Sprint 1
```

### 11.3 Format du livrable final

> "Je peux produire le plan de démarrage en :
> - Un seul fichier `.md` complet (recommandé)
> - Plusieurs fichiers `.md` par section
> Tu préfères lequel ?"

---

## Règles transverses

**Adapter à la stack.** Ce skill ne présuppose pas Next.js ou Supabase.
Adapter chaque section à la stack retenue dans software-tech-design.

**Squelettes immédiatement compilables.** Tous les fichiers de code produits
doivent compiler sans erreur même s'ils sont vides. Pas de code incomplet
ou de TODO qui bloque la compilation.

**Documenter les commandes exactes.** Chaque action qui nécessite une commande
dans le terminal doit avoir la commande exacte, pas une description vague.

**Signaler les dépendances circulaires.** Si une action en bloque une autre
qui la bloque en retour, le signaler explicitement et proposer une résolution.

**Ne pas supposer un niveau de connaissance.** Si une commande ou un concept
peut être inconnu du profil de l'utilisateur, l'expliquer brièvement
sans être condescendant.
