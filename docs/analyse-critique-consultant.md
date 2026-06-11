# Analyse critique — Revue consultant senior
**Outil personnel de gestion de tâches**
*Dernière mise à jour : 30 mai 2026*

---

## Périmètre de la revue

8 documents analysés : cadrage complet, besoins utilisateurs, inventaire écrans, audit technique, schéma base de données, API principales, tests TDD, prompt engineering. Soit environ 190 pages de documentation technique.

---

## Verdict global

Le corpus documentaire est solide et cohérent pour un projet en phase de cadrage. La rigueur méthodologique est au-dessus de la moyenne — peu de projets de cette nature produisent un niveau de détail comparable à ce stade. Cela dit, plusieurs lacunes structurantes doivent être adressées avant de démarrer le développement, sous peine de devoir retravailler des fondations en cours de route.

---

## 1. Ce qui est bien

**La séparation des préoccupations** est exemplaire. Cadrage fonctionnel, besoins utilisateurs, inventaire écrans, architecture technique et tests sont des documents distincts, cohérents entre eux et versionnés. C'est rare et précieux.

**Le cycle de vie de la tâche** est bien pensé et couvre les cas réels : à qualifier → active → en retard → en attente de retour → archivée → restaurable. La gestion de la délégation via un statut dédié est élégante.

**Les arbitrages techniques sont documentés et justifiés** — PWA, Supabase, offline V2. Chaque décision explique ce qui est perdu et ce qui est gagné. C'est ce qu'on attend d'un bon document d'architecture.

**Les tests TDD sont remarquablement complets** — 177 tests sur 3 couches avec mocking Claude API, cas limites, idempotence, sécurité RLS. C'est un travail de senior.

**Le prompt engineering est bien structuré** — system prompt strict, user prompt dynamique avec injection des projets, exemples annotés, gestion des cas dégradés (JSON malformé, confiance à 0).

---

## 2. Ce qui manque

### 2.1 Pas de document d'architecture globale

Il existe un audit technique et un schéma de base de données, mais il n'y a pas de **schéma d'infrastructure** montrant comment les briques s'articulent : PWA → Next.js → Supabase → Claude API → Resend → Web Push. Un diagramme de séquence pour le flux de capture vocale (le plus critique) est absent. Sans ça, un développeur qui arrive sur le projet ne sait pas où commencer.

**Recommandation** : créer un document d'architecture avec diagramme de composants et au moins deux diagrammes de séquence — capture vocale et envoi de notification.

---

### 2.2 Pas de stratégie de déploiement et d'environnements

Aucun document ne mentionne les environnements (dev / staging / prod), la stratégie de déploiement (CI/CD, branches), ou les variables d'environnement nécessaires. En l'état, un développeur ne sait pas comment faire tourner le projet localement, ni comment déployer.

**Ce qui manque concrètement :**
- Liste des variables d'environnement (`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `RESEND_API_KEY`...)
- Stratégie de branches (main / develop / feature branches)
- Pipeline CI/CD (GitHub Actions, Vercel preview deployments)
- Environnement de staging pour tester les notifications avant prod

**Recommandation** : un fichier `CONTRIBUTING.md` et un `.env.example` documentés, et une section "déploiement" dans l'audit technique.

---

### 2.3 Pas de politique de gestion des erreurs côté utilisateur

L'API définit des codes d'erreur (`TACHE_NOT_FOUND`, `IA_TIMEOUT`, `VALIDATION_ERROR`...) mais rien ne décrit ce que **l'utilisateur voit** quand une erreur se produit. Que se passe-t-il si :
- Claude API est down pendant la capture vocale ?
- Supabase est indisponible pendant la qualification ?
- La notification push échoue et Resend est aussi down ?
- L'utilisateur perd sa connexion en milieu de wizard de qualification ?

Ces cas ne sont ni dans le cadrage, ni dans les wireframes, ni dans les tests E2E.

**Recommandation** : définir les messages d'erreur utilisateur pour chaque cas critique, et ajouter les états d'erreur dans l'inventaire des écrans.

---

### 2.4 Le champ "Projet" est obligatoire mais la qualification l'exige

Il y a une **contradiction** dans le cadrage. Le champ "Projet" est marqué obligatoire dans la structure des tâches (section 4 du cadrage), mais lors de la qualification une tâche peut être passée sans être qualifiée — et donc sans projet. De même, les tâches pré-caractérisées par l'IA avec `projet_id: null` ont un projet manquant. En l'état, la contrainte SQL `NOT NULL` sur `projet_id` ferait planter l'insertion.

**Recommandation** : soit rendre le projet optionnel en base (nullable) avec une contrainte applicative, soit créer un projet "Sans projet" par défaut à la création du compte. Trancher et documenter.

---

### 2.5 Pas de gestion du fuseau horaire

Les horaires de notification (8h, 12h, 18h) sont stockés en `time` dans la table `preferences`. Mais dans quel fuseau ? Si l'utilisateur est à Paris (UTC+2 en été), le briefing doit arriver à 8h heure locale, pas à 8h UTC. Le schéma ne gère pas la timezone de l'utilisateur. pg_cron tourne en UTC par défaut.

**Recommandation** : ajouter un champ `timezone text not null default 'Europe/Paris'` dans `preferences`, et adapter le scheduling des notifications pour calculer l'heure UTC correspondante.

---

### 2.6 Pas de stratégie de reset de mot de passe

L'onboarding crée un compte avec login + mot de passe. Mais aucun document ne mentionne ce qui se passe si l'utilisateur oublie son mot de passe. Supabase Auth propose un reset par email natif, mais il faut le câbler et le tester. L'écran de connexion doit avoir un lien "Mot de passe oublié".

**Recommandation** : ajouter BU-17 "Réinitialiser mon mot de passe" dans les besoins utilisateurs, l'écran correspondant dans l'inventaire, et les tests d'intégration associés.

---

### 2.7 Pas de politique de rétention des données

Les tâches archivées s'accumulent indéfiniment. Avec 100-200 tâches actives et un usage quotidien, on peut atteindre plusieurs milliers de tâches archivées en quelques années. Aucune politique de rétention n'est définie — ni purge automatique, ni export, ni limite.

**Recommandation** : définir explicitement la politique (ex : archives conservées X années, ou illimitées). Si illimitées, vérifier que le plan gratuit Supabase (500MB) tient sur la durée estimée.

---

### 2.8 La Web Speech API a des limitations non documentées

La Web Speech API n'est pas disponible sur tous les navigateurs mobiles Android. En particulier, elle requiert Chrome (ou Chromium) et une connexion internet — elle ne fonctionne pas hors ligne et pas sur Firefox mobile. Ces limitations ne sont mentionnées nulle part dans les documents.

**Recommandation** : documenter explicitement dans les contraintes non-fonctionnelles que la saisie vocale requiert Chrome sur Android. Prévoir un fallback gracieux (le bouton micro est grisé avec un message explicatif si la Web Speech API n'est pas disponible).

---

### 2.9 Pas de stratégie de montée en charge

Le projet est dimensionné pour un usage solo. Mais si l'utilisateur souhaite un jour proposer l'outil à d'autres personnes (usage professionnel), les fondations tiennent-elles ? Le plan gratuit Supabase est limité à 50 000 requêtes/mois et 500MB. Vercel Hobby est limité en bandwidth. Claude API coûte par token.

Ce n'est pas un problème V1, mais il n'est nulle part mentionné comme risque à surveiller.

**Recommandation** : ajouter une section "Limites du plan gratuit et seuils de migration" dans l'audit technique.

---

## 3. Ce qui doit être amélioré

### 3.1 Incohérence de versioning entre les documents

Le cadrage est en version 4, les besoins utilisateurs en version 2, l'audit technique en version 1. Aucun document ne référence les autres explicitement. Si quelqu'un modifie le cadrage, rien ne signale que les besoins utilisateurs ou l'inventaire écrans doivent être mis à jour.

**Recommandation** : créer un `README.md` racine qui liste tous les documents avec leur version et leur date, et définir une règle simple : toute modification du cadrage entraîne une revue des besoins utilisateurs et de l'inventaire écrans.

---

### 3.2 Les wireframes et les documents texte ne sont pas liés formellement

L'inventaire des écrans référence des fichiers HTML (`backlog-wireframe.html`, `briefing-matin.html`...) mais ces fichiers ne font pas partie d'un système de design formel. Si un wireframe est modifié, rien ne force la mise à jour du document texte correspondant.

**Recommandation** : à ce stade ce n'est pas bloquant, mais en phase de développement il faudra un système plus formel — soit passer sur Figma, soit versionner les wireframes avec les documents.

---

### 3.3 Les besoins utilisateurs manquent de critères de performance mesurables

Les critères d'acceptation sont fonctionnels mais rarement quantitatifs. BU-02 mentionne "moins de 3 secondes" pour la capture IA — c'est bien. Mais BU-04 (briefing matin) ne dit pas en combien de temps la vue doit se charger. BU-06 (backlog) ne définit pas le temps de réponse attendu pour les filtres sur 200 tâches.

**Recommandation** : ajouter des SLOs (Service Level Objectives) dans les critères d'acceptation des besoins critiques : temps de chargement, temps de réponse API, taux d'erreur acceptable.

---

### 3.4 La sécurité est sous-documentée

Le RLS Supabase est mentionné dans le schéma BDD mais pas dans un document dédié. Plusieurs questions restent sans réponse :
- Quelle est la durée de vie des sessions JWT ?
- Y a-t-il une limitation du nombre de tentatives de connexion (brute force) ?
- Les logs d'accès sont-ils activés dans Supabase ?
- La clé API Claude est-elle protégée côté serveur uniquement (vérification) ?
- Les emails de notification contiennent-ils des données sensibles ?

**Recommandation** : ajouter une section sécurité dans l'audit technique couvrant ces points.

---

### 3.5 Le prompt engineering manque d'une stratégie d'amélioration continue

Le prompt est bien conçu pour la V1, mais rien ne prévoit comment l'améliorer dans le temps. Si l'utilisateur constate que l'IA se trompe souvent sur les projets, comment détecte-t-on le problème ? Comment mesure-t-on la qualité des pré-caractérisations ?

**Recommandation** : logger les corrections manuelles de l'utilisateur lors de la qualification (champ corrigé, valeur IA, valeur finale). Ces logs permettront d'identifier les patterns d'erreur et d'améliorer le prompt par itérations.

---

### 3.6 Les tests E2E ne couvrent pas les notifications

177 tests mais aucun ne teste le cycle complet d'envoi de notification : pg_cron déclenche → Edge Function tourne → Web Push envoyé (ou email de secours). C'est pourtant un flux critique — si les notifications ne partent pas, l'utilisateur ne revient pas dans l'app.

**Recommandation** : ajouter des tests d'intégration pour les Edge Functions de notification, avec mock de Web Push et Resend.

---

### 3.7 Le champ "Projet" dans la structure de tâche est marqué obligatoire mais le statut par défaut dans la BDD est `null`

Dans le cadrage (section 4), Projet est "Obligatoire : Oui". Dans le schéma BDD, `projet_id uuid references projets(id) on delete set null` — donc nullable en base. Dans la table des tâches créées par la capture IA, `projet_id` peut être null. Il y a trois vues contradictoires du même champ.

**Recommandation** : trancher clairement — le projet est-il obligatoire à la création (impossible de valider sans projet) ou optionnel (nullable, filtrable) ? Documenter la décision et la propager dans les trois documents.

---

## 4. Ce qui doit être créé avant le développement

Par ordre de priorité :

| Priorité | Document manquant | Raison |
|---|---|---|
| 🔴 Bloquant | Document d'architecture (diagrammes) | Un dev ne sait pas comment les briques s'articulent |
| 🔴 Bloquant | Gestion des fuseaux horaires | Le scheduling des notifications sera faux sans ça |
| 🔴 Bloquant | Décision projet nullable ou non | Contradiction BDD / cadrage à résoudre avant le code |
| 🟠 Important | Politique de gestion des erreurs utilisateur | Les états d'erreur ne sont ni designés ni testés |
| 🟠 Important | Stratégie de déploiement et variables d'env | Un dev ne peut pas faire tourner le projet |
| 🟠 Important | BU-17 — Reset de mot de passe | Cas d'usage manquant dans les besoins |
| 🟡 Utile | Section sécurité dans l'audit technique | Sessions JWT, brute force, logs |
| 🟡 Utile | Stratégie de montée en charge | Limites plan gratuit et seuils de migration |
| 🟡 Utile | README racine et règles de versioning | Cohérence entre documents |
| 🟡 Utile | Tests Edge Functions notifications | Flux critique non testé |
| 🟡 Utile | Logging des corrections IA | Amélioration continue du prompt |

---

## 5. Synthèse

Le projet est prêt à 75% pour démarrer le développement. Les 25% restants correspondent à trois décisions structurantes à prendre avant d'écrire la première ligne de code :

**Décision 1** — Le projet est-il obligatoire ou optionnel sur une tâche ? Trancher et propager dans tous les documents.

**Décision 2** — Comment gérer les fuseaux horaires ? Ajouter le champ timezone dans preferences et adapter le scheduling.

**Décision 3** — Quelle est la politique de gestion des erreurs utilisateur ? Définir les messages et les états d'erreur dans l'inventaire des écrans.

Une fois ces trois points traités, le projet peut entrer en développement avec confiance.
