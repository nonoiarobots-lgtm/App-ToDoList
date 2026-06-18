# Inventaire des écrans — Outil personnel de gestion de tâches
**Version 4 — Itération retours d'usage (CRA, restitution, vue semaine, filtres)**
*Dernière mise à jour : 18 juin 2026*

---

## Navigation globale

```
Barre du bas (permanente)
├── ☀️ Aujourd'hui (Briefing)
├── 📋 Backlog
├── ⚡ À qualifier [badge compteur]
├── 📁 Archives
└── 📅 Semaine
```

```
Accès transverse
├── Bouton "+" → Capture rapide (tous les écrans)
├── Briefing → Bouton "Voir la semaine"
├── Détail tâche → Bouton "Mode avancé"
└── Menu ⚙️ → Paramètres
```

**Note technique** : la navigation est implémentée en Next.js avec routing côté client. La barre du bas est un composant persistant. Le bouton "+" déclenche une modale de capture.

---

## Écran 01 — Onboarding

**Accès** : première ouverture uniquement
**Tech** : Supabase Auth pour création de compte, stockage profil en base

| État | Description |
|---|---|
| Étape 1 | Bienvenue — prénom + mot de passe + confirmation |
| Étape 2 | Email |
| Étape 3 | Projets + couleurs/icônes |
| Étape 4 | Horaires des 3 notifications |
| Étape 5 | Confirmation — récapitulatif |

**Comportements** : navigation libre, bouton "Passer", nav bar grisée, barre de progression wizard.

**Wireframe** : `onboarding.html` ✅ Validé

---

## Écran 02 — Capture rapide

**Accès** : bouton "+" depuis tous les écrans
**Tech** : Web Speech API pour le vocal, Claude API pour le découpage et la pré-caractérisation

| État | Description |
|---|---|
| Saisie texte | Zone de texte libre |
| Saisie vocale | Bouton micro actif — écoute en cours |
| Prévisualisation IA | Tâches découpées avec pré-caractérisation en bleu |
| Confirmation | Bouton "Envoyer en file À qualifier" |

**Comportements** : toute tâche → statut "à qualifier". Délai cible < 3 secondes. Nécessite connexion réseau en V1.

**Wireframe** : `backlog-wireframe.html` écran ③ ✅ Validé

---

## Écran 03 — Briefing matin

**Accès** : onglet ☀️ + notification Web Push 8h + email Resend secours
**Tech** : pg_cron (Supabase) pour le scheduling, Resend pour l'email

| État | Description |
|---|---|
| Accordéons fermés | Vue initiale — tous les projets fermés |
| Projet ouvert | Tâches avec cases à cocher |
| Tâche cochée | Archivage instantané |

**Comportements** : résumé avec total temps estimé, tri projets par volume décroissant, retards P1→P3 en premier dans chaque projet, bouton "Voir la semaine".

**Wireframe** : `briefing-matin.html` ✅ Validé

---

## Écran 04 — Backlog

**Accès** : onglet 📋
**Tech** : requêtes Supabase filtrées côté client

| État | Description |
|---|---|
| Vue liste complète | Toutes les tâches actives |
| Filtre actif | Vue filtrée par projet / priorité / statut |
| Bannière orange | 15 tâches à qualifier |
| Bannière rouge | 20 tâches à qualifier |

**Comportements** : filtres, tri, sections, swipe, icône ⚡.

**Wireframe** : `backlog-wireframe.html` écran ① ✅ Validé

---

## Écran 05 — Détail d'une tâche

**Accès** : tap depuis backlog, briefing ou archives
**Tech** : update Supabase en temps réel

| État | Description |
|---|---|
| Vue standard | Tous les champs visibles |
| Mode avancé | Champ prédécesseur visible |
| Mode édition | Champ en cours de modification |

**Comportements** : avancement boutons rapides + saisie libre, temps estimé, récurrence, mode avancé, actions Terminer / Reporter / Supprimer.

**Wireframe** : `backlog-wireframe.html` écran ② ✅ Validé

---

## Écran 06 — Qualification (wizard)

**Accès** : onglet ⚡ + notification Web Push 12h + email Resend
**Tech** : lecture des tâches statut "à qualifier" depuis Supabase

| État | Description |
|---|---|
| Tâche avec pré-remplissage IA | Champs bleus à valider |
| Tâche sans pré-remplissage | Champs vides à remplir |
| Fin de session | Toutes les tâches traitées |

**Comportements** : wizard one-by-one, barre de progression, "Enregistrer & suivant", "Passer", "Annuler".

**Wireframe** : `qualification.html` ✅ Validé

---

## Écran 07 — Relance retards (wizard)

**Accès** : notification Web Push 18h + email Resend
**Tech** : pg_cron pour le scheduling, requête Supabase sur tâches en retard

| État | Description |
|---|---|
| Actions sur tâche en retard | 3 boutons : Clôturer / Reporter / Passer |
| Date picker inline | Raccourcis + saisie libre |
| Fin de session | Récapitulatif |

**Comportements** : wizard one-by-one, badge "+Xj", tâches "En attente de retour" incluses si échéance dépassée.

**Wireframe** : `relance-retards.html` ✅ Validé

---

## Écran 08 — Vue semaine

**Accès** : onglet 📅 + bouton depuis le briefing
**Tech** : agrégation côté serveur (Supabase Edge Function) pour la matrice

| État | Description |
|---|---|
| Vue matrice | Projets × jours, cellules résumées |
| Cellule ouverte | Liste détaillée des tâches |

**Comportements** : lignes = projets, colonnes = lun→dim, cellule = "X tâches", tap → détail.

**Wireframe** : ⏳ À créer (backlog design V2)

---

## Écran 09 — Archives

**Accès** : onglet 📁
**Tech** : requêtes Supabase sur tâches statut "archivée"

| État | Description |
|---|---|
| Vue liste | Toutes les tâches archivées |
| Filtre actif | Vue filtrée |
| Confirmation restauration | Avant restauration |

**Comportements** : filtres projet + priorité + période, recherche mot-clé, restauration avec confirmation.

**Wireframe** : `archives.html` ✅ Validé

---

## Écran 10 — Paramètres

**Accès** : menu ⚙️
**Tech** : update profil et préférences dans Supabase

| Section | Contenu |
|---|---|
| Compte | Prénom, mot de passe, email |
| Projets | Liste + ajout + modification couleur/icône |
| Notifications | Horaires des 3 flux |
| Seuils d'alerte | Bannière orange + rouge (configurables) |

**Wireframe** : `onboarding.html` écran ⑤ ✅ Validé

---

## Écran 11 — Mode hors ligne V1

**Pas un écran dédié** — état superposé à tous les écrans.
**Tech** : cache navigateur (Service Worker Next.js) pour lecture seule

| Élément | Condition | Apparence |
|---|---|---|
| Bandeau global | Sans réseau | Orange "Hors ligne — capture indisponible" |
| Capture désactivée | Sans réseau | Bouton "+" grisé avec message explicatif |

**Note** : la capture hors ligne avec synchronisation est reportée en V2.

**Wireframe** : `hors-ligne.html` ✅ Validé (à adapter pour V1)

---

## Statuts des wireframes

| Écran | Fichier | Statut |
|---|---|---|
| Onboarding | `onboarding.html` | ✅ Validé |
| Capture rapide | `backlog-wireframe.html` | ✅ Validé |
| Briefing matin | `briefing-matin.html` | ✅ Validé |
| Backlog | `backlog-wireframe.html` | ✅ Validé |
| Détail tâche | `backlog-wireframe.html` | ✅ Validé |
| Qualification | `qualification.html` | ✅ Validé |
| Relance retards | `relance-retards.html` | ✅ Validé |
| Vue semaine | — | ⏳ À créer |
| Archives | `archives.html` | ✅ Validé |
| Paramètres | `onboarding.html` | ✅ Validé |
| Mode hors ligne | `hors-ligne.html` | ✅ Validé (à adapter V1) |
| Navigation complète | `navigation-complete.html` | ✅ Validé |

---

## Backlog design V2

- [ ] Vue semaine — matrice projets × jours
- [ ] Champ récurrence dans le détail tâche
- [ ] Champ temps estimé dans le détail tâche
- [ ] Mode avancé (prédécesseur)
- [ ] Statut "En attente de retour" dans le backlog et la relance retards
- [ ] Écran onboarding étape 5
- [ ] Capture hors ligne avec synchronisation

---

## Mises à jour post-analyse critique

### États d'erreur — ajoutés à tous les écrans

Les états d'erreur suivants sont transverses — ils peuvent apparaître sur n'importe quel écran.

| Erreur | Composant UI | Persistance | Action disponible |
|---|---|---|---|
| Claude API down (capture vocale) | Toast bas d'écran | 5 secondes | Aucune — tâche enregistrée en texte brut |
| Supabase indisponible (lecture) | Bandeau rouge persistant | Jusqu'au retour réseau | Bouton "Réessayer" |
| Supabase indisponible (écriture) | Toast bas d'écran | 5 secondes | Bouton "Réessayer" |
| Perte connexion en wizard | Bandeau orange + wizard gelé | Jusqu'au retour réseau | Bouton "Réessayer" |
| Token expiré | Modale bloquante | Jusqu'à action | Bouton "Se reconnecter" |
| Push + email en échec | Aucun (log serveur) | — | — |

### Écran 12 — Reset de mot de passe (nouveau)

**Accès** : lien "Mot de passe oublié" sur l'écran de connexion
**Tech** : Supabase Auth `resetPasswordForEmail()`

| État | Description |
|---|---|
| Saisie email | L'utilisateur entre son email |
| Email envoyé | Confirmation + instruction de consulter la boîte mail |
| Nouveau mot de passe | L'utilisateur saisit et confirme le nouveau mot de passe |
| Confirmation | Succès — retour à l'écran de connexion |

**Wireframe** : ⏳ À créer

### Groupe "Sans projet" dans le backlog et le briefing

Les tâches sans projet (projet_id = null) apparaissent dans un groupe **"Sans projet"** :
- Icône neutre (⬜ ou gris #555)
- Même comportement que les autres projets (accordéon, filtres, tri)
- Triées après les projets nommés dans le briefing matin
- Filtrables via un chip "Sans projet" dans le backlog

### Paramètres — ajout timezone

La section Compte dans les paramètres inclut désormais :

| Champ | Description |
|---|---|
| Fuseau horaire | Détecté automatiquement, modifiable (ex : "Europe/Paris") |

---

## Mises à jour — itération du 18 juin 2026 (cadrage §20)

### Navigation (barre du bas) — révisée
```
├── ☀️ Aujourd'hui
├── 📋 Backlog        (en-tête : lien 📁 Archives)
├── ⚡ À qualifier [badge]
├── 📊 CRA            (en-tête : lien Restitution)
└── 📅 Semaine
```
**Archives** n'est plus dans la barre du bas (max 5 onglets) → accès via l'en-tête du Backlog. La liste des onglets reste plafonnée à 5 (bonne pratique mobile).

### Écran 02 — Capture rapide (mis à jour)
- Bouton **« Capturer et continuer »** (saisie en rafale) en plus de « Capturer et fermer ».
- **Auto-qualification** : si projet + échéance + priorité sont remplis, indication « sera qualifiée » et tâche créée en `active`.
- La capture vocale + IA reste à venir (tranche ②).

### Écran 04 — Backlog (mis à jour)
- **Barre de recherche** (titre + notes) + bouton **« Filtres »** (badge du nb de critères).
- Panneau **Filtres** : statut / priorité / projet en **multi-sélection** ; critères actifs en **pastilles supprimables** + « Tout effacer ».
- En-tête : lien **📁 Archives**.

### Écran 06 — Qualification (wizard livré)
Wizard one-by-one effectif : compteur « N/total », barre de progression, « Valider et suivante », « Passer ». Pré-remplissage IA non encore implémenté.

### Écran 08 — Vue semaine (livrée)
Matrice projets × jours opérationnelle. **Pastille d'état CRA** sous chaque jour (🟢 complet ≥ cible / 🟠 partiel / ⚪ vide). Tap cellule → liste des tâches du jour. Navigation par semaine.

### Écran 10 — Paramètres (mis à jour)
| Section | Contenu |
|---|---|
| Compte | Prénom, email, fuseau |
| Projets | Liste + ajout/suppression |
| **Rappels email** | Heures **Briefing matin (8h)** et **Relance retards (18h)** — le 12h est retiré de l'UI (en veille) |
| **Compte-rendu d'activité** | Cible journalière (défaut 7h30) + gestion des **types d'activité** |
| Seuils d'alerte | Bannière orange + rouge |

### Écran 13 — CRA (saisie) — nouveau
**Accès** : onglet 📊. Navigation par jour, carte **décompte** (vert/orange/rouge, peut être négatif), liste des activités, modale d'ajout/édition (type, projet, durée ± ¼ h, commentaire).

### Écran 14 — Restitution CRA — nouveau
**Accès** : lien « 📊 Restitution » depuis l'écran CRA. Bascule **semaine/mois**, total vs cible, répartition **par type** (barres) et **par projet** (%), **export CSV**.

### Rappels — canal
Les rappels passent par **email Gmail SMTP** (plus push/Resend). Référence : cadrage §20.8.
