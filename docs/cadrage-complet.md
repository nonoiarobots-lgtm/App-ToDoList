# Cadrage — Outil personnel de gestion de tâches
**Version 7 — Itération retours d'usage (CRA, vue semaine, restitution, rappels Gmail)**
*Dernière mise à jour : 18 juin 2026*

---

## 1. Contexte et objectif

Outil personnel, indépendant de tout employeur, pour centraliser et suivre toutes les tâches professionnelles et personnelles. Ne rien oublier, qualifier chaque tâche, piloter ses priorités et échéances.

**Contraintes non-fonctionnelles**
- PWA (Progressive Web App) — installable sur Android, accessible sur desktop
- Indépendant de tout employeur — compte et données personnels
- Notifications push Web Push API, email Gmail canal de secours
- Volume cible : 100 à 200 tâches actives en parallèle
- 100% solo aujourd'hui, évolutif vers la délégation (suivi interne uniquement)
- Budget cible : moins de 20€/mois
- Hébergement en Europe (conformité RGPD)

---

## 2. Stack technique retenu

| Brique | Choix | Raison |
|---|---|---|
| Frontend | Next.js (PWA) | Une seule codebase web + mobile |
| Backend + Auth + BDD | Supabase | Clé en main, Europe, gratuit jusqu'à un certain volume |
| IA | Claude API (Anthropic) | Qualité française, découpage et pré-caractérisation |
| Push notifications | Web Push API | Natif PWA, gratuit |
| Email secours | Resend | Gratuit jusqu'à 3000 emails/mois |
| Scheduling | Supabase Edge Functions + pg_cron | Intégré à Supabase |
| Hébergement frontend | Vercel | Gratuit plan hobby, intégration Next.js native |

**Estimation coût mensuel V1 : 2 à 5€/mois** (principalement Claude API)

---

## 3. Capture des tâches

Point d'entrée : la PWA sur mobile Android. Deux modes depuis la même interface, accessibles via bouton "+" ou raccourci écran d'accueil.

**Saisie texte**
Saisie rapide depuis l'interface.

**Saisie vocale**
Dictée via Web Speech API. L'IA (Claude API) découpe le dictado en tâches distinctes et pré-caractérise chacune :
- Projet probable
- Priorité suggérée
- Date estimée si mentionnée
- Récurrence détectée si mentionnée (ex : "chaque lundi", "tous les mois")
- Temps estimé si mentionné (ex : "ça me prendra 30 minutes")

Toute tâche capturée, même pré-caractérisée par l'IA, atterrit en statut **"à qualifier"**. Rien n'est validé sans confirmation manuelle.

---

## 4. Structure des tâches

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| Titre | Texte libre | Oui | |
| Statut | Liste fermée | Oui | Voir cycle de vie |
| Projet | Liste fermée | Oui | Maintenue par l'utilisateur |
| Priorité | Haute / Moyenne / Basse / Aucune | Oui | |
| Date de début | Date | Non | |
| Date d'échéance | Date + heure | Non | |
| Responsable | Texte | Oui | "Moi" par défaut |
| Avancement | % (0-100, saisi manuellement) | Non | |
| Temps estimé | Minutes ou heures | Non | Détecté par IA si vocal |
| Récurrence | Quotidienne / Hebdomadaire / Mensuelle | Non | Détectée par IA si vocal |
| Prédécesseur | Lien vers une autre tâche | Non | Mode avancé uniquement |
| Date de clôture réelle | Date + heure | Auto | Renseignée automatiquement |
| Notes | Texte libre | Non | |

**Mode avancé**
Le champ prédécesseur est masqué par défaut. Accessible via un bouton "Mode avancé" dans le détail de la tâche uniquement.

---

## 5. Cycle de vie d'une tâche

```
À qualifier → Active → En retard → Archivée → (Restaurable)
                ↓
         En attente de retour (tâches déléguées)
```

- **À qualifier** : capturée, non encore caractérisée
- **Active** : qualifiée, dans le backlog
- **En retard** : échéance dépassée, non clôturée
- **En attente de retour** : déléguée, en attente de confirmation
- **Archivée** : terminée, restaurable à tout moment

Les tâches "En attente de retour" remontent dans la relance retards du soir dès que leur échéance est dépassée.

---

## 6. Règles de gestion du stock "à qualifier"

| Seuil | Action | Configurable |
|---|---|---|
| 10 tâches | Notification push | Non |
| 15 tâches | Bannière orange persistante | Oui |
| 20 tâches | Bannière rouge persistante | Oui |

---

## 7. Les 3 flux quotidiens

### 7.1 Briefing matin — 8h00

**Déclencheur** : notification push Web Push (email Resend en secours)

**Contenu** : tâches du jour + retards, groupés par projet.

**Affichage** :
- Résumé en haut : nombre de tâches, nombre en retard, nombre faites, total temps estimé (ex : "8 tâches · ~3h30 estimées")
- Accordéon par projet, triés par volume décroissant
- Ligne projet : "Formation IA — 4 tâches dont 1 en retard"
- Dans chaque projet : retards P1→P3 en premier, puis tâches du jour P1→P3
- Cases à cocher directement dans la vue
- Cochage → archivage automatique avec date de clôture
- Bouton "Voir la semaine" → vue semaine

### 7.2 Qualification — 12h00

**Déclencheur** : notification push Web Push (email Resend en secours)

**Affichage** : wizard one-by-one
- Barre de progression (tâche X sur Y)
- Champs pré-remplis par l'IA affichés en bleu
- Bouton "Enregistrer & suivant" → enchaîne automatiquement
- Bouton "Passer" → ignore sans qualifier
- Bouton "Annuler" → retour au backlog

### 7.3 Relance retards — 18h00

**Déclencheur** : notification push Web Push (email Resend en secours)

**Contenu** : tâches en retard + tâches "En attente de retour" à échéance dépassée

**Affichage** : wizard one-by-one
- Badge "+Xj" indiquant le retard
- 3 actions : Clôturer / Reporter / Passer
- Reporter → date picker inline avec raccourcis + saisie libre
- Récapitulatif en fin de session

---

## 8. Navigation principale

**5 onglets permanents** en barre du bas :
1. ☀️ Aujourd'hui (briefing)
2. 📋 Backlog
3. ⚡ À qualifier (badge rouge avec compteur)
4. 📁 Archives
5. 📅 Semaine

**Accès transverse** :
- Bouton "+" → capture rapide depuis tous les écrans
- Bouton "Voir la semaine" depuis le briefing matin
- Bouton "Mode avancé" depuis le détail d'une tâche
- Menu ⚙️ → paramètres

---

## 9. Vue Backlog

**Filtres** : Tout / 🔴 Haute / 🟠 Moyenne / [Projets] / ⚡ À qualifier

**Tri** : Échéance / Priorité / Projet / Avancement / Non qualifiées

**Sections** : 🔴 En retard / 📅 Aujourd'hui / 📆 Cette semaine / Plus tard

**Sur chaque carte** : icône ⚡ si à qualifier, titre, projet, date d'échéance, retard calculé, barre de progression + %

Swipe gauche = reporter / Swipe droit = clôturer

---

## 10. Vue Semaine

**Format** : matrice
- Lignes = projets
- Colonnes = lundi → dimanche
- Chaque cellule = "X tâches" (tap → liste détaillée)

---

## 11. Détail d'une tâche

- Avancement : boutons rapides (0/25/50/75/100%) + saisie libre
- Temps estimé : saisie en minutes ou heures
- Récurrence : quotidienne / hebdomadaire / mensuelle + configuration
- Mode avancé : bouton dédié → champ Prédécesseur
- Actions : Terminer / Reporter / Supprimer

---

## 12. Archives

- Filtres : projet + priorité + période de clôture
- Tri : date de clôture / projet / priorité
- Recherche par mot-clé
- Restauration : confirmation → tâche repart en statut "Active"

---

## 13. Projets

- Liste fermée maintenue par l'utilisateur
- Couleur unique par projet (disparaît de la palette une fois attribuée)
- Si couleurs épuisées → icônes (🏠 ⭐ 🎯 💼 📌 🔖 ⚙️)
- Gestion depuis les paramètres

---

## 14. Délégation

Usage interne uniquement. L'utilisateur saisit les tâches déléguées, renseigne le responsable, change le statut en "En attente de retour", suit manuellement. Aucune notification externe.

---

## 15. Onboarding

5 étapes guidées à la première ouverture :
1. Bienvenue — prénom + mot de passe
2. Email
3. Projets + couleurs/icônes
4. Horaires des 3 notifications
5. Confirmation — récapitulatif

---

## 16. Paramètres

- Compte : prénom, mot de passe, email
- Projets : ajout / modification / couleur / icône
- Notifications : horaires des 3 flux
- Seuils d'alerte : bannière orange (défaut 15) et rouge (défaut 20)

---

## 17. Mode hors ligne — V1

En V1, pas de capture hors ligne. Si l'utilisateur est sans réseau :
- Les données existantes sont visibles en lecture seule (cache navigateur)
- Bandeau orange "Hors ligne — capture indisponible"
- La capture hors ligne avec synchronisation est reportée en V2

---

## 18. Backlog design (V2)

- [ ] Vue semaine — wireframe à créer
- [ ] Champ récurrence dans le détail tâche
- [ ] Champ temps estimé dans le détail tâche
- [ ] Mode avancé (prédécesseur)
- [ ] Statut "En attente de retour" dans le backlog et la relance retards
- [ ] Écran onboarding étape 5
- [ ] Capture hors ligne avec synchronisation (V2)

---

## 19. Décisions post-analyse critique

### 19.1 Projet — Optionnel (nullable)

Le champ "Projet" est **optionnel** sur une tâche. Une tâche peut exister sans projet à toutes les étapes de son cycle de vie. Les tâches sans projet apparaissent dans un groupe **"Sans projet"** dans le backlog, le briefing matin et la vue semaine. Ce groupe suit les mêmes règles de tri que les autres projets.

Impacte : schéma BDD (projet_id nullable), cadrage section 4 (Obligatoire → Non), besoins utilisateurs BU-06.

### 19.2 Fuseaux horaires

Un champ `timezone` est ajouté dans `preferences`, par défaut `'Europe/Paris'`. La timezone est **détectée automatiquement** à l'onboarding via `Intl.DateTimeFormat().resolvedOptions().timeZone`. L'utilisateur peut la modifier dans les paramètres. Le scheduling pg_cron calcule l'heure UTC correspondante avant d'insérer dans `jobs_notifications`.

### 19.3 Gestion des erreurs utilisateur

| Cas | Comportement UI |
|---|---|
| Claude API down pendant capture vocale | Toast "Service IA indisponible — tâche enregistrée en texte brut" |
| Supabase indisponible (lecture) | Bandeau persistant "Données indisponibles — réessaie dans quelques instants" |
| Supabase indisponible (écriture) | Toast "Sauvegarde échouée" + bouton Réessayer |
| Push + email tous les deux en échec | Log serveur uniquement, rien côté utilisateur |
| Perte connexion en milieu de wizard | Bandeau orange "Hors ligne" + wizard gelé + bouton Réessayer |
| Token expiré en cours de session | Modale "Session expirée — reconnecte-toi" |

### 19.4 Reset de mot de passe (BU-17)

Flux standard Supabase Auth — lien "Mot de passe oublié" sur l'écran de connexion → email de reset → nouveau mot de passe.

### 19.5 Suppression du champ "login" (décision du 11 juin 2026)

L'identifiant de connexion est **l'email** — le champ `login` (pseudo distinct de l'email) est supprimé. Raison : Supabase Auth ne gère nativement que l'email ; un login séparé imposerait une résolution login→email avant authentification (clé service-role, endpoint custom, contrainte d'unicité, surface d'énumération d'utilisateurs) pour un bénéfice quasi nul sur une app mono-utilisateur à session persistante. Le **prénom** est conservé pour la personnalisation de l'interface.

Impacte : schéma BDD (colonne `login` supprimée de `preferences`), API auth (connexion par email), onboarding étape 2, paramètres compte, besoins utilisateurs BU-13/BU-14, codes d'erreur (`LOGIN_DEJA_UTILISE` et `LOGIN_NOT_FOUND` supprimés).

### 19.6 Décisions de la tranche ① (11 juin 2026)

- **Confirmation d'email désactivée** dans Supabase Auth : friction inutile pour une app mono-utilisateur ; le RLS isole les données de tout compte tiers.
- **Préférences créées au premier accès authentifié** (à partir des métadonnées du signUp), pas à l'inscription — le flux fonctionne que la confirmation d'email soit activée ou non.
- **Onboarding simplifié** : l'inscription tient en un écran (prénom, email, mot de passe, timezone auto-détectée) ; projets et horaires se configurent dans Paramètres. Le wizard 5 étapes (§15) est suspendu — à réévaluer si un vrai besoin apparaît.
- **Écran détail `/tache/[id]`** ajouté : édition complète + bouton « Valider la qualification » (a_qualifier → active). Le wizard one-by-one (§7.2) reste prévu en tranche ③.
- La clôture se fait **au tap** sur le rond ✓ ; les gestes swipe (§9) sont reportés en tranche ③.

---

## 20. Itération « retours d'usage » (18 juin 2026)

Après une semaine d'utilisation réelle, livraison de 7 retours utilisateur + 2 écrans complémentaires. Tout est en production.

### 20.1 Capture en rafale (BU-20)
La modale de capture gagne un bouton **« Capturer et continuer »** : enregistre puis vide le titre/l'échéance en gardant projet + priorité, sans refermer la modale. Permet de saisir plusieurs tâches d'affilée.

### 20.2 Auto-qualification (BU-21)
À la capture comme à la qualification, si **projet + échéance + priorité explicite** sont renseignés, la tâche passe directement en `active` (plus rien à qualifier) au lieu de `a_qualifier`. Logique `estQualifiable` / `statutACapture`. Pas de nouveau statut : « qualifié » = `active`.

### 20.3 Qualification enchaînée (§7.2 livrée)
L'écran `/qualifier` devient un **wizard one-by-one** : compteur « N/total », barre de progression, « Valider et suivante », « Passer ». Plus de retour systématique au backlog entre deux tâches. Le pré-remplissage IA reste à venir (tranche ②).

### 20.4 Ergonomie des filtres backlog (§9 / BU-06)
Remplacement de la rangée de chips par : **barre de recherche** (titre + notes) + **bouton « Filtres »** ouvrant un panneau multi-sélection (statut / priorité / projet), avec les critères actifs en **pastilles supprimables**. Archives accessible depuis l'en-tête du backlog.

### 20.5 Module CRA — compte-rendu d'activité (BU-22)
Nouvel écran `/cra` : saisie du temps passé par jour, par **type d'activité** (paramétrable : réunion, expression de besoin, cahier des charges, recette, cadrage, COPIL, formation…) et par **projet**. Saisie **au quart d'heure** (multiples de 15 min). **Décompte** par rapport à une cible journalière (défaut 7h30, paramétrable) pouvant être négative. Nouvelles tables `types_activite` et `activites`, colonne `preferences.cible_jour_min`.

### 20.6 Restitution CRA (BU-23)
Écran `/cra/restitution` : synthèse **semaine / mois**, total vs cible (jours ouvrés × cible/jour), répartition **par type** et **par projet**, **export CSV**. Endpoint d'agrégation `/api/cra/resume`.

### 20.7 Vue Semaine livrée (§10) + indicateur CRA
La matrice projets × jours (§10) est implémentée, avec sous chaque jour une **pastille d'état CRA** à 3 états (complet ≥ cible / partiel / vide). Tap sur une cellule → tâches du jour.

### 20.8 Rappels email via Gmail (révision §6 notifications)
Les rappels **8h (briefing matin)** et **18h (relance retards)** sont envoyés par **email via Gmail SMTP** (nodemailer, compte expéditeur dédié), **et non plus push/Resend**. Le créneau **12h (qualification) est codé mais désactivé**. Scheduling : **pg_cron (toutes les 5 min) → `pg_net` → route Vercel `/api/cron/notifications`** (contourne la limite « 1 cron/jour » du plan Vercel Hobby), idempotence via `jobs_notifications`, fuseau + heure d'été gérés. Le push Web Push et le 12h restent activables ultérieurement.

### 20.9 Nouvelle icône
Icône d'application remplacée (calendrier) ; déclinaisons 192/512/maskable/apple/favicon générées depuis `public/icons/source-icon.png`.

### 20.10 Sauvegarde de la base (risque audit R1)
GitHub Action quotidienne : `pg_dump` → chiffrement GPG → artifact privé (90 j). Voir `docs/restauration-backup.md`. `pg_net` déplacé dans le schéma `extensions` (advisor sécurité).
