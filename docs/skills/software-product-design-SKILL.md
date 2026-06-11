---
name: software-product-design
description: >
  Cadrage fonctionnel complet d'un outil informatique, de l'idée jusqu'aux wireframes validés.
  Utilise ce skill dès que l'utilisateur veut créer, concevoir ou cadrer un outil informatique,
  une application, un logiciel ou une fonctionnalité numérique — même si la demande est floue,
  partielle ou exprimée comme une idée ("j'ai une idée d'app", "je veux faire un outil pour",
  "comment je pourrais automatiser", "j'ai besoin d'un truc qui fait X").
  Ce skill guide l'utilisateur à travers : cadrage du besoin, besoins utilisateurs, design des
  écrans (wireframes), et validation par des revues expertes (UX, organisation). Il pose des
  questions, attend les réponses, propose des options avant d'agir, et produit des livrables
  à chaque étape. Il se termine en proposant de passer au skill software-tech-design.
---

# Software Product Design

Skill de cadrage fonctionnel pour outils informatiques. Guide l'utilisateur de l'idée initiale
jusqu'à un ensemble de wireframes validés et une synthèse de cadrage complète.

---

## Principe fondamental

**Dialogue d'abord, production ensuite.** Ce skill ne produit rien sans validation humaine.
Chaque étape suit le même patron :
1. Claude propose ou pose une question
2. L'utilisateur valide, corrige ou choisit
3. Claude produit le livrable

Ne jamais enchaîner deux productions sans checkpoint humain.

---

## Vue d'ensemble des étapes

```
Étape 1 — Cadrage initial          (questions + synthèse)
Étape 2 — Besoins utilisateurs     (BU formalisés)
Étape 3 — Red team fonctionnel     (optionnel — proposer)
Étape 4 — Design des écrans        (wireframes HTML)
Étape 5 — Revue UX Design          (optionnel — proposer)
Étape 6 — Revue expert organisation(optionnel — proposer)
Étape 7 — Synthèse finale          (livrable complet)
Étape 8 — Transition tech-design   (proposer le skill suivant)
```

---

## Étape 1 — Cadrage initial

### 1.1 Recueillir le contexte

Commencer par comprendre le besoin avant de poser des questions structurées.
Si l'utilisateur a déjà donné des éléments dans sa demande, les extraire et les reformuler
pour validation avant de demander ce qui manque.

Questions à poser (une à la fois, pas toutes d'un coup) :

- **Quel problème** l'outil doit-il résoudre ? (le vrai problème, pas la solution)
- **Qui l'utilise ?** (persona, contexte, fréquence d'usage)
- **Quelles contraintes** sont non-négociables ? (plateforme, budget, délai, données sensibles)
- **Existe-t-il des outils similaires** que l'utilisateur connaît ou utilise déjà ?

### 1.2 Produire la synthèse de cadrage initiale

Après avoir recueilli les réponses, produire une synthèse structurée et demander validation.
Format : document `.md` ou texte en conversation selon la complexité.

Contenu minimal de la synthèse :
- Contexte et objectif
- Persona utilisateur
- Contraintes non-fonctionnelles
- Ce qui est dans le scope / hors scope

**Avant de passer à l'étape 2, demander :**
> "Est-ce que cette synthèse reflète bien ce que tu as en tête ?
> Y a-t-il des éléments à corriger ou ajouter avant qu'on formalise les besoins ?"

### 1.3 Approfondir le cadrage

Si la synthèse initiale manque de précision sur des points structurants,
poser des questions complémentaires ciblées. Exemples :
- Volume de données, nombre d'utilisateurs
- Niveau de sécurité requis
- Intégrations avec des systèmes existants
- Disponibilité (24/7 ou usage ponctuel)

---

## Étape 2 — Besoins utilisateurs

### 2.1 Structurer les besoins

Produire une liste de besoins utilisateurs (BU) au format :

```
## BU-XX — [Titre court]

**En tant qu'utilisateur**, je veux [action] afin de [bénéfice].

**Contexte** : [situation concrète d'usage]

**Critères d'acceptation** :
- [critère mesurable 1]
- [critère mesurable 2]

**Priorité** : Indispensable | Importante | Utile
```

Regrouper les BU par thème si > 8 besoins.
Terminer par une matrice de priorités.

### 2.2 Valider les besoins

Présenter les BU et demander :
> "Est-ce que ces besoins correspondent à ce que tu attends ?
> Il y a des besoins manquants, mal formulés ou à supprimer ?"

Itérer jusqu'à validation complète.

### 2.3 Proposer le red team (optionnel)

> "On peut faire une passe de red team sur ces besoins — je joue l'avocat du diable
> pour identifier les incohérences, les angles morts et les cas limites.
> Tu veux qu'on le fasse ?"

Si oui → jouer le red team, poser les questions critiques une à une,
intégrer les réponses dans les BU, reproposer la version mise à jour.

### 2.4 Format du livrable

Proposer le format à l'utilisateur :
> "Je peux produire les besoins utilisateurs en :
> - Fichier `.md` (recommandé — versionnable, lisible partout)
> - Texte structuré dans la conversation
> Tu préfères lequel ?"

---

## Étape 3 — Design des écrans

### 3.1 Inventaire des écrans

Avant de dessiner, lister tous les écrans nécessaires et demander validation :

```
Écran 01 — [Nom] : [description en une ligne]
Écran 02 — [Nom] : [description en une ligne]
...
```

Demander :
> "Est-ce que cet inventaire est complet ?
> Il y a des écrans manquants ou à supprimer ?"

### 3.2 Schéma de navigation

Avant les wireframes individuels, proposer un schéma de navigation global
montrant comment les écrans s'enchaînent. Format : diagramme textuel ou HTML interactif.

Demander validation avant de passer aux wireframes.

### 3.3 Wireframes

Produire les wireframes en HTML dans le style suivant :
- Dark theme (#0f0f0f background)
- Format mobile-first (largeur 390px) sauf si desktop explicitement demandé
- Typographie IBM Plex Sans / IBM Plex Mono
- Couleurs sémantiques : #4a9eff (accent), #2ecc71 (succès), #ff4444 (erreur), #ff9900 (alerte)
- Composants interactifs si pertinent (accordéons, onglets)

**Règle** : produire 1 à 3 écrans, demander feedback, itérer avant de continuer.
Ne jamais produire tous les écrans d'un coup.

Pour chaque lot d'écrans, demander :
> "Qu'est-ce qui te convient ? Qu'est-ce qui ne va pas ?"

### 3.4 Proposer la revue UX (optionnel)

Après validation des wireframes :
> "On peut faire une revue par un expert UX design — analyse des friction points,
> cohérence de navigation, patterns mobile, accessibilité.
> Tu veux qu'on le fasse ?"

Si oui → produire la revue UX en identifiant :
- Ce qui est bien conçu
- Les points de friction potentiels
- Ce qui manque
Puis poser les questions pour lever les points critiques, one-by-one.

### 3.5 Proposer la revue organisation (optionnel)

> "On peut aussi faire une revue par un expert en organisation — il vérifie
> la cohérence fonctionnelle, les cas d'usage réels, ce qui manque dans le cadrage.
> Tu veux qu'on le fasse ?"

Même logique que la revue UX.

---

## Étape 4 — Synthèse finale

### 4.1 Consolider tous les documents

Produire la synthèse de cadrage finale qui intègre :
- Contexte et objectif (mis à jour)
- Stack technique pressenti (si mentionné)
- Structure complète des données/entités
- Tous les flux fonctionnels
- Navigation et écrans
- Décisions et arbitrages documentés
- Backlog des points non traités

### 4.2 Proposer le format du livrable final

> "Je peux produire le livrable final en :
> - Un fichier `.md` complet (recommandé)
> - Plusieurs fichiers `.md` séparés par thème
> - Un autre format ?
> Tu préfères quoi ?"

### 4.3 Vérification de complétude

Avant de livrer, vérifier que le document répond à :
- [ ] Qui utilise l'outil et dans quel contexte ?
- [ ] Quels sont les besoins prioritaires vs secondaires ?
- [ ] Comment les écrans s'enchaînent-ils ?
- [ ] Quelles sont les contraintes non-fonctionnelles ?
- [ ] Qu'est-ce qui est explicitement hors scope ?

---

## Étape 5 — Transition vers le skill suivant

À la fin du cadrage fonctionnel, proposer systématiquement :

> "Le cadrage fonctionnel est terminé. La prochaine étape naturelle est le cadrage technique :
> schéma de base de données, API, tests TDD, et architecture.
> Tu veux qu'on enchaîne avec le skill **software-tech-design** ?"

Si oui → indiquer que le skill software-tech-design prendra en entrée
les documents produits lors de cette session.

---

## Règles transverses

**Une question à la fois.** Ne jamais poser plusieurs questions dans le même message
sauf si elles sont liées et courtes (2 options max).

**Toujours proposer avant de produire.** Avant tout livrable, annoncer ce qui va être produit
et dans quel format. L'utilisateur valide ou ajuste.

**Itérer, ne pas réécrire from scratch.** Si l'utilisateur veut des changements,
modifier le livrable existant plutôt que tout reprendre.

**Documenter les décisions.** Chaque arbitrage important (scope, priorité, choix de design)
doit être explicitement noté dans la synthèse avec la raison.

**Signaler les contradictions.** Si une réponse de l'utilisateur contredit quelque chose
de déjà validé, le signaler explicitement avant de continuer.
