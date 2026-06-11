---
name: software-tech-design
description: >
  Cadrage technique complet d'un outil informatique : architecture, base de données, API,
  tests TDD et prompt engineering IA. Utilise ce skill dès que l'utilisateur veut concevoir
  l'architecture technique d'un outil informatique, choisir une stack, modéliser une base
  de données, définir des endpoints API, écrire des tests TDD, ou intégrer de l'IA dans
  une application — même s'il ne dispose que d'une idée ou d'un cadrage fonctionnel partiel.
  Déclenche aussi quand l'utilisateur dit "on passe à la technique", "comment on code ça",
  "quelle architecture", "quelle base de données", "comment tester ça".
  Ce skill fait suite à software-product-design et se termine en proposant software-project-kickoff.
---

# Software Tech Design

Skill de cadrage technique pour outils informatiques. Prend en entrée un cadrage fonctionnel
(issu de software-product-design ou fourni directement) et produit l'ensemble des documents
techniques nécessaires avant de démarrer le développement.

---

## Principe fondamental

**Décisions documentées et justifiées.** Chaque choix technique doit être expliqué
avec les alternatives considérées et les raisons de l'arbitrage. Un développeur qui lit
ces documents doit comprendre pourquoi, pas seulement quoi.

**Dialogue d'abord, production ensuite.** Même règle que software-product-design :
proposer, valider, produire. Ne jamais enchaîner deux productions sans checkpoint humain.

---

## Vue d'ensemble des étapes

```
Étape 1 — Reprise du contexte       (lire les docs existants)
Étape 2 — Audit technique           (analyser les implications)
Étape 3 — Arbitrages stack          (décisions techniques majeures)
Étape 4 — Schéma base de données    (PostgreSQL / autre)
Étape 5 — API principales           (endpoints + contrats)
Étape 6 — Tests TDD                 (unitaires, intégration, E2E)
Étape 7 — Prompt engineering IA     (si IA dans le projet)
Étape 8 — Revues expertes           (optionnel — proposer chacune)
Étape 9 — Synthèse et transition    (vers software-project-kickoff)
```

---

## Étape 1 — Reprise du contexte

### 1.1 Lire les documents existants

Si des documents ont été produits par software-product-design (ou fournis par l'utilisateur),
les lire en priorité avant de poser des questions. Extraire :
- Les entités métier principales (ce qui deviendra les tables)
- Les flux fonctionnels (ce qui deviendra les endpoints)
- Les contraintes non-fonctionnelles (ce qui guidera les choix de stack)
- Les besoins IA si présents

### 1.2 Confirmer la base de travail

Présenter un résumé de ce qui a été compris et demander :
> "Voici ce que j'ai compris du cadrage fonctionnel : [résumé].
> Est-ce que c'est correct ? Y a-t-il des éléments importants que j'aurais manqués ?"

---

## Étape 2 — Audit technique

### 2.1 Analyser les implications techniques

Produire un audit qui identifie :
- Ce que le cahier des charges implique techniquement (complexités cachées)
- Les points de risque (latence, sécurité, scalabilité, données sensibles)
- Les questions sans réponse bloquantes pour l'architecture

### 2.2 Proposer la revue développeur (optionnel)

> "On peut faire une passe de red team technique — je joue le développeur expérimenté
> qui cherche les failles, les angles morts et les pièges d'implémentation.
> Tu veux qu'on le fasse ?"

### 2.3 Questions bloquantes

Pour chaque question sans réponse identifiée dans l'audit, poser les questions
une à une et attendre les réponses avant de continuer. Exemples de questions typiques :
- Quel est le budget mensuel d'infrastructure cible ?
- Les données sont-elles sensibles (RGPD, données de santé...) ?
- Quel volume d'utilisateurs en V1 ? À terme ?
- Y a-t-il des intégrations avec des systèmes existants ?
- Quelle est la tolérance à la complexité technique de l'équipe ?

---

## Étape 3 — Arbitrages stack

### 3.1 Présenter les arbitrages majeurs

Identifier les 2 à 4 décisions techniques les plus structurantes et présenter
chacune avec ses options, ses avantages/inconvénients et une recommandation.

Format par arbitrage :
```
**Arbitrage : [Titre]**

Problème : [pourquoi cette décision est nécessaire]

Option A — [Nom] : [description courte]
→ Avantages : ...
→ Inconvénients : ...

Option B — [Nom] : [description courte]
→ Avantages : ...
→ Inconvénients : ...

Recommandation : Option X — [raison principale]
```

Présenter les arbitrages un à un si > 2, pour éviter la surcharge.

### 3.2 Valider chaque arbitrage

Après chaque arbitrage, attendre la décision de l'utilisateur avant de continuer.
Documenter chaque décision avec sa justification dans la synthèse.

### 3.3 Consolider la stack retenue

Une fois tous les arbitrages tranchés, présenter le tableau complet :

| Brique | Choix retenu | Justification |
|---|---|---|
| Frontend | ... | ... |
| Backend | ... | ... |
| Base de données | ... | ... |
| Auth | ... | ... |
| IA (si applicable) | ... | ... |
| ... | ... | ... |

Estimer le coût mensuel si applicable.

---

## Étape 4 — Schéma de base de données

### 4.1 Identifier les entités

Lister les tables nécessaires avec leurs relations avant d'écrire le SQL :
```
users
  └── [entité1]
        └── [entité2]
[entité3] (1-1 avec users)
```

Demander validation avant d'écrire le SQL.

### 4.2 Produire le schéma SQL

Pour chaque table, documenter :
- Colonnes avec types, contraintes et commentaires
- Index
- Politiques de sécurité (RLS si Supabase, permissions si autre)
- Triggers si nécessaires

### 4.3 Produire les requêtes clés

Identifier les 3 à 5 requêtes les plus complexes ou les plus fréquentes
et les écrire complètement avec des commentaires.

### 4.4 Proposer la revue schéma (optionnel)

> "On peut faire une revue du schéma par un expert BDD — normalisation,
> index manquants, contraintes d'intégrité, performance.
> Tu veux qu'on le fasse ?"

### 4.5 Format du livrable

> "Je peux produire le schéma BDD en :
> - Fichier `.md` avec le SQL embarqué (recommandé)
> - Fichier `.sql` pur
> Tu préfères lequel ?"

---

## Étape 5 — API principales

### 5.1 Inventaire des endpoints

Lister tous les endpoints avant de les documenter :
```
GET    /api/[ressource]          — [description]
POST   /api/[ressource]          — [description]
PATCH  /api/[ressource]/:id      — [description]
DELETE /api/[ressource]/:id      — [description]
```

Demander validation de l'inventaire.

### 5.2 Documenter chaque endpoint

Pour chaque endpoint :
- Method + URL
- Description fonctionnelle
- Query params ou body (avec exemples JSON)
- Réponse succès (avec exemple JSON)
- Codes d'erreur spécifiques

### 5.3 Gestion des erreurs

Définir le format d'erreur uniforme et la liste exhaustive des codes d'erreur.

### 5.4 Format du livrable

Proposer le format à l'utilisateur avant de produire.

---

## Étape 6 — Tests TDD

### 6.1 Définir la stratégie de test

Présenter les 3 couches de tests et demander ce qui est pertinent pour le projet :

**Tests unitaires** — logique métier pure, sans dépendances externes
**Tests d'intégration** — endpoints API avec dépendances mockées
**Tests E2E** — flux complets de bout en bout

> "Pour ce projet, je recommande [X couches] de tests.
> Tu veux qu'on les couvre toutes ou tu veux prioriser ?"

### 6.2 Définir les mocks

Si des services externes sont impliqués (IA, email, BDD...), définir les mocks
avant d'écrire les tests.

### 6.3 Écrire les tests par couche

Pour chaque couche :
1. Écrire les tests du chemin nominal
2. Proposer le red team des tests : "Il manque ces cas limites — on les ajoute ?"
3. Ajouter les cas limites validés

### 6.4 Muscler les tests E2E

Après la première version des tests E2E, proposer systématiquement :
> "Les tests E2E actuels couvrent les chemins nominaux.
> On peut les muscler en ajoutant les cas limites, l'idempotence,
> les erreurs réseau et les flux transverses. Tu veux qu'on le fasse ?"

### 6.5 Récapitulatif de couverture

Terminer avec un tableau de couverture :

| Couche | Fichiers | Tests | Couverture cible |
|---|---|---|---|
| Unitaire | N | N | 100% logique métier |
| Intégration | N | N | 100% endpoints |
| E2E | N | N | Flux principaux + cas limites |

---

## Étape 7 — Prompt engineering IA (si applicable)

Déclencher cette étape uniquement si le projet intègre de l'IA.

### 7.1 Définir les contraintes du prompt

Avant d'écrire le prompt, valider :
- Quel modèle IA est utilisé ?
- Quel est le format de sortie attendu (JSON, texte...) ?
- Quelles valeurs par défaut si information absente ?
- Quel seuil de confiance pour les décisions automatiques ?

### 7.2 Produire le system prompt

Règles obligatoires dans le system prompt :
- Instructions strictes sur le format de sortie
- Valeurs par défaut explicites
- Règles de sécurité (ne pas inventer, ne pas extrapoler)
- Exemples de format de réponse attendu

### 7.3 Produire le user prompt dynamique

Si le prompt intègre des données dynamiques (liste de projets, date, contexte utilisateur),
documenter la fonction de construction du prompt avec ses paramètres.

### 7.4 Exemples annotés

Produire 3 à 5 exemples input/output annotés couvrant :
- Le cas nominal
- Le cas avec données manquantes
- Le cas ambigu
- Le cas d'échec (texte incompréhensible)

### 7.5 Stratégie de calibration

Documenter les signaux détectés (priorité, dates, récurrence...) et leur traitement.

---

## Étape 8 — Revues expertes

Proposer chaque revue séparément et attendre la réponse avant de proposer la suivante.

### Revue consultant senior

> "On peut faire une revue de l'ensemble des documents techniques par un consultant senior —
> il identifie ce qui manque, les incohérences entre documents, et prépare une liste
> de décisions à prendre avant de démarrer le développement.
> Tu veux qu'on le fasse ?"

Si oui → produire l'analyse critique avec :
- Ce qui est bien
- Ce qui manque (classé par criticité : bloquant / important / utile)
- Ce qui doit être amélioré
- Les décisions à prendre avant de coder

Puis adresser les points bloquants one-by-one avec l'utilisateur.

---

## Étape 9 — Synthèse et transition

### 9.1 Récapitulatif des documents produits

Lister tous les documents avec leur version et leur statut.

### 9.2 Points ouverts

Lister explicitement ce qui n'a pas été traité et pourquoi
(reporté en V2, hors scope, décision différée...).

### 9.3 Transition vers le skill suivant

> "Le cadrage technique est terminé. La prochaine étape est le démarrage du projet :
> structure des fichiers, types TypeScript, migrations SQL, variables d'environnement,
> roadmap de développement et README.
> Tu veux qu'on enchaîne avec le skill **software-project-kickoff** ?"

---

## Règles transverses

**Expliquer pour un profil hybride.** L'utilisateur est technique mais pas développeur
à temps plein. Expliquer les concepts techniques en termes de conséquences concrètes
("ça veut dire que...") sans être condescendant.

**Relier technique et fonctionnel.** Chaque décision technique doit être reliée
à un besoin fonctionnel. "On crée cette table parce que BU-03 le requiert."

**Anticiper les questions non posées.** Si une décision technique a des implications
importantes non mentionnées dans le cahier des charges, les soulever proactivement.

**Cohérence entre documents.** Si un document est modifié, vérifier qu'il n'y a pas
de contradiction avec les documents déjà produits. Signaler et corriger.

**Format des livrables.** Toujours proposer le format avant de produire.
Par défaut recommander `.md` — versionnable, lisible partout, facile à modifier.
