# Audit technique — Outil personnel de gestion de tâches
**Version 2 — Ajout risque pause Supabase + parade keep-alive**
*Dernière mise à jour : 11 juin 2026*

---

## 1. Ce que le cahier des charges implique techniquement

Avant de parler d'architecture, voilà ce que le cahier des charges impose réellement côté technique.

**L'IA est au cœur du produit, pas un ajout**
Le découpage vocal + pré-caractérisation est le geste principal de l'utilisateur. Ça implique un pipeline : reconnaissance vocale (Web Speech API) → appel LLM pour découpage et extraction d'entités (projet, date, priorité, récurrence, durée) → retour en moins de 3 secondes. Si ce pipeline est lent ou peu fiable, tout le système s'effondre.

**Les notifications push quotidiennes sont critiques**
3 notifications par jour à heures fixes, avec email de secours. Ça implique un service de scheduling côté serveur, une intégration push (Web Push API), et un service d'envoi d'emails. La logique de fallback (notification non reçue → email) doit être codée explicitement.

**La vue semaine est gourmande en agrégation**
Afficher une matrice projets × 7 jours avec compteurs et détails au tap implique une agrégation côté serveur. Avec 200 tâches actives, ça reste gérable mais ça se conçoit dès le début.

**La récurrence génère des tâches automatiquement**
Quand une tâche récurrente est cochée, la suivante doit être créée avec la bonne date. Ça suppose un job schedulé côté serveur avec logique de rattrapage si le job rate une exécution.

---

## 2. Points de risque identifiés

**Risque 1 — Latence de la capture vocale**
C'est le point le plus critique. Le pipeline vocal → STT → LLM → affichage doit tenir en moins de 3 secondes sur mobile. Il faut prévoir un affichage progressif : transcription visible en temps réel pendant que Claude API tourne en arrière-plan.

**Risque 2 — Qualité de la pré-caractérisation IA**
L'IA doit deviner le bon projet parmi une liste fermée de 3 à 5 projets. Si elle se trompe souvent, l'utilisateur perd confiance et requalifie tout manuellement. Le prompt doit être calibré avec la liste des projets de l'utilisateur injectée dynamiquement.

**Risque 3 — Récurrence + archivage automatique**
Si le job de création de tâche récurrente rate une exécution (serveur down, bug), la tâche n'est pas créée. Il faut une logique de rattrapage : au login, vérifier si des tâches récurrentes auraient dû être créées et ne l'ont pas été.

**Risque 4 — Sécurité des données personnelles**
Mot de passe, email, tâches perso et pro mélangées. Chiffrement en transit (HTTPS), hachage du mot de passe (bcrypt via Supabase Auth), isolation des données par utilisateur (Row Level Security Supabase).

**Risque 5 — Mise en pause du projet Supabase (plan gratuit)**
Le plan gratuit Supabase met en pause les projets sans activité API pendant ~7 jours. Un projet en pause = pg_cron arrêté = plus aucune notification, et l'app ne répond plus à la première ouverture. L'usage quotidien suffit normalement, mais une semaine sans ouvrir l'app (vacances) déclencherait la pause — précisément quand les relances comptent le plus.
**Parade retenue** : route `GET /api/keepalive` (protégée par `CRON_SECRET`) appelée chaque jour par un cron Vercel (inclus dans le plan Hobby). Détail dans le plan de démarrage, Action 1.

---

## 3. Les 3 arbitrages et décisions

### Arbitrage 1 — PWA plutôt qu'app native Android

**Le problème**
Une app native Android et une webapp sont deux codebases séparées. Double le travail de développement et de maintenance. Implique de passer par le Google Play Store (contraintes de validation, mises à jour).

**Les options**
- App native Android + webapp séparée → complexité x2, coût x2
- PWA (Progressive Web App) → une seule codebase, installable sur Android depuis le navigateur

**Ce qu'une PWA ne peut pas faire**
- Widget Android sur l'écran d'accueil
- Accès à certaines APIs natives avancées

**Ce qu'une PWA fait parfaitement**
- Notifications push (Web Push API)
- Capture vocale (Web Speech API)
- Installation sur l'écran d'accueil Android (icône, plein écran)
- Accès web depuis desktop

**Décision : PWA**
L'utilisateur valide la perte du widget Android. La PWA couvre 100% des fonctionnalités core.

**Impact** : supprime ~40% de la complexité frontend, une seule codebase Next.js pour mobile et desktop.

---

### Arbitrage 2 — Supabase comme backend clé en main

**Le problème**
Un backend from scratch implique de coder et maintenir : API REST, base de données, authentification (login/password, sessions, reset de mot de passe), gestion des rôles, hosting. C'est 2 à 3 mois de développement avant d'avoir la première feature.

**Les options**
- Backend custom (Node.js + PostgreSQL + Auth maison) → contrôle total, complexité maximale
- Firebase (Google) → simple mais hébergé aux USA, prix variable
- Supabase → PostgreSQL managé, Auth intégrée, API auto-générée, hébergé en Europe, open source

**Pourquoi Supabase**
- Hébergement en Europe (conformité RGPD)
- Auth complète clé en main (login/password, sessions, reset)
- Row Level Security : isolation des données par utilisateur native
- pg_cron intégré pour le scheduling des notifications et de la récurrence
- Edge Functions pour la logique métier
- Plan gratuit suffisant pour le volume V1

**Décision : Supabase**

**Impact** : supprime le backend custom, l'auth maison, la gestion de la base de données — soit ~50% de la complexité backend.

---

### Arbitrage 3 — Mode hors ligne différé en V2

**Le problème**
Le mode offline-first (capture locale + synchronisation au retour réseau) est architecturalement le plus complexe du cahier des charges. Il implique une base de données locale sur le device (SQLite ou IndexedDB), une couche de synchronisation, et une stratégie de résolution de conflits (que se passe-t-il si l'utilisateur modifie une tâche hors ligne et en ligne simultanément ?). C'est facilement 30% du temps de développement total pour 5% des cas d'usage réels.

**Les options**
- Offline-first dès la V1 → complexité maximale, time-to-market allongé de plusieurs mois
- Lecture seule sans réseau en V1, capture hors ligne en V2 → compromis pragmatique

**Ce que ça change pour l'utilisateur en V1**
- Sans réseau : l'app affiche les données en cache (lecture seule)
- Le bouton "+" est grisé avec un message "Capture indisponible hors ligne"
- Un bandeau orange "Hors ligne" est visible en permanence
- Dès le retour du réseau, tout fonctionne normalement

**Ce qui est reporté en V2**
- Capture stockée localement sans réseau
- Icône ⏳ sur les tâches non synchronisées
- Synchro automatique au retour du réseau avec gestion des conflits

**Décision : offline différé en V2**
L'utilisateur valide ce compromis.

**Impact** : supprime le problème le plus complexe du cahier des charges en V1.

---

## 4. Stack technique retenu

| Brique | Choix | Justification |
|---|---|---|
| Frontend | Next.js (PWA) | Une seule codebase web + mobile Android |
| Backend + Auth + BDD | Supabase | Clé en main, Europe, gratuit jusqu'à un certain volume |
| IA | Claude API (Anthropic) | Qualité française, découpage et pré-caractérisation |
| Reconnaissance vocale | Web Speech API | Native au navigateur, gratuite |
| Push notifications | Web Push API | Native PWA, gratuite |
| Email secours | Resend | Gratuit jusqu'à 3000 emails/mois |
| Scheduling | pg_cron (Supabase) | Intégré, pas de service supplémentaire |
| Logique métier IA | Supabase Edge Functions | Intégré, pas de serveur supplémentaire |
| Hébergement frontend | Vercel | Gratuit plan hobby, intégration Next.js native |

---

## 5. Estimation des coûts mensuels V1

| Service | Plan | Coût estimé |
|---|---|---|
| Supabase | Free (500MB BDD, 50MB fichiers) | 0€ |
| Vercel | Hobby | 0€ |
| Claude API | ~10-20 captures vocales/jour | 2 à 5€ |
| Resend | Free (< 3000 emails/mois) | 0€ |
| Web Push API | Natif navigateur | 0€ |
| **Total** | | **2 à 5€/mois** |

Largement sous l'enveloppe cible de 20€/mois, avec de la marge pour monter en volume.

---

## 6. Questions ouvertes pour le cadrage d'architecture

Les points suivants sont à trancher lors de la prochaine étape :

**Modèle de données** — définir le schéma PostgreSQL complet (tables, relations, index).

**Stratégie de prompt IA** — concevoir le prompt Claude API pour le découpage et la pré-caractérisation, avec injection dynamique de la liste des projets.

**Stratégie de push** — définir la logique de fallback notification → email (délai, conditions).

**Stratégie de récurrence** — définir la logique de création automatique et de rattrapage.

**Sécurité** — définir les politiques Row Level Security Supabase par table.

**Performance** — définir la stratégie de cache pour la vue semaine (agrégation lourde).

---

## 7. Prochaine étape

Cadrage de l'architecture technique :
- Schéma de base de données
- API principales
- Schéma d'infrastructure
- Prompt engineering Claude API
