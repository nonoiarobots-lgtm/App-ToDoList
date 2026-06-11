# Besoins utilisateurs — Outil personnel de gestion de tâches
**Version 3 — Suppression du champ login (cadrage §19.5)**
*Dernière mise à jour : 11 juin 2026*

---

## Profil utilisateur

**Persona** : Responsable de transformation, 20 ans d'expérience, profil hybride conseil / opérationnel. Travaille en mode projet, en réunion fréquemment, en déplacement. Manipule entre 100 et 200 tâches actives en parallèle sur des registres pro et perso. Usage 100% solo, possibilité de déléguer ponctuellement.

**Contraintes techniques acceptées** :
- PWA installée sur Android (pas d'app store)
- Pas de widget Android en V1
- Capture hors ligne non disponible en V1 (lecture seule sans réseau)

---

## BU-01 — Capturer une tâche sans friction

**En tant qu'utilisateur**, je veux pouvoir enregistrer une tâche en moins de 5 secondes, depuis n'importe où, sans avoir à la qualifier immédiatement.

**Contexte** : je sors d'une réunion, j'ai 3 actions à noter. Je ne veux pas être bloqué par un formulaire.

**Critères d'acceptation** :
- Saisie texte disponible via la PWA ou un raccourci écran d'accueil Android
- Saisie vocale disponible via Web Speech API
- La tâche est enregistrée sans champ obligatoire autre que le titre
- La tâche atterrit automatiquement en file "à qualifier"
- Nécessite une connexion réseau en V1

**Priorité** : Indispensable

---

## BU-02 — Dicter plusieurs actions d'un coup

**En tant qu'utilisateur**, je veux dicter un bloc d'actions en sortie de réunion et que l'IA les découpe automatiquement en tâches distinctes.

**Contexte** : "J'ai trois actions : envoyer le CR à l'équipe, planifier la revue budget avec Sophie vendredi, relancer le prestataire sur la livraison."

**Critères d'acceptation** :
- L'IA (Claude API) découpe le dictado en N tâches distinctes
- L'IA pré-caractérise chaque tâche (projet, priorité, date, récurrence, temps estimé si mentionnés)
- Chaque tâche pré-caractérisée est visualisable avant envoi
- Toutes les tâches partent en file "à qualifier" après validation
- La pré-caractérisation IA est affichée en bleu pour être distinguée des saisies manuelles
- Délai de traitement cible : moins de 3 secondes

**Priorité** : Indispensable

---

## BU-03 — Qualifier mes tâches une fois par jour

**En tant qu'utilisateur**, je veux être guidé une fois par jour pour qualifier toutes mes tâches brutes.

**Critères d'acceptation** :
- Notification Web Push à 12h (configurable)
- Email de secours via Resend si notification manquée
- Mode wizard one-by-one
- Champs pré-remplis par l'IA visibles et modifiables
- Bouton "Enregistrer & suivant" enchaîne automatiquement
- Bouton "Passer" ignore sans qualifier
- Barre de progression visible

**Priorité** : Indispensable

---

## BU-04 — Voir mes tâches du jour dès le matin

**En tant qu'utilisateur**, je veux recevoir chaque matin un briefing clair de ma journée.

**Critères d'acceptation** :
- Notification Web Push à 8h (configurable)
- Email de secours via Resend si notification manquée
- Résumé : tâches du jour / en retard / faites / total temps estimé
- Tâches groupées par projet en accordéon, triés par volume décroissant
- Dans chaque projet : retards P1→P3 en premier, puis tâches du jour P1→P3
- Cases à cocher directement dans la vue
- Cochage → archivage automatique

**Priorité** : Indispensable

---

## BU-05 — Traiter mes retards en fin de journée

**En tant qu'utilisateur**, je veux être relancé chaque soir sur les tâches en retard.

**Critères d'acceptation** :
- Notification Web Push à 18h (configurable)
- Email de secours via Resend
- Mode wizard one-by-one
- Badge "+Xj" sur chaque tâche
- 3 actions : Clôturer / Reporter / Passer
- Reporter → date picker inline avec raccourcis + saisie libre
- Les tâches "En attente de retour" à échéance dépassée remontent ici
- Récapitulatif en fin de session

**Priorité** : Indispensable

---

## BU-06 — Consulter et filtrer mon backlog

**En tant qu'utilisateur**, je veux consulter l'ensemble de mes tâches actives à tout moment.

**Critères d'acceptation** :
- Filtres rapides : tout / priorité / projet / ⚡ à qualifier
- Tri : échéance / priorité / projet / avancement / non qualifiées
- Sections : en retard / aujourd'hui / cette semaine / plus tard
- Sur chaque carte : ⚡ si à qualifier, titre, projet, échéance, retard, progression
- Swipe gauche = reporter / swipe droit = clôturer

**Priorité** : Indispensable

---

## BU-07 — Visualiser ma semaine en un coup d'œil

**En tant qu'utilisateur**, je veux voir toutes mes tâches de la semaine sous forme de matrice projets × jours.

**Critères d'acceptation** :
- Vue semaine accessible via 5e onglet ET bouton depuis le briefing matin
- Matrice : lignes = projets, colonnes = lundi→dimanche
- Chaque cellule = "X tâches" (tap → liste détaillée)

**Priorité** : Importante

---

## BU-08 — Suivre l'avancement de mes tâches

**En tant qu'utilisateur**, je veux renseigner manuellement un pourcentage d'avancement.

**Critères d'acceptation** :
- Champ avancement (0-100%) sur chaque tâche
- Boutons rapides (0/25/50/75/100%) + saisie libre
- Barre de progression visible sur les cartes
- Couleur barre : gris (0%) / bleu (en cours) / vert (80%+)

**Priorité** : Importante

---

## BU-09 — Estimer le temps de mes tâches

**En tant qu'utilisateur**, je veux renseigner un temps estimé pour savoir si ma journée est réaliste.

**Critères d'acceptation** :
- Champ temps estimé (minutes ou heures) sur chaque tâche
- Détecté par Claude API à la capture vocale si mentionné
- Total temps estimé affiché dans le résumé du briefing matin
- Saisie manuelle dans le détail de la tâche

**Priorité** : Importante

---

## BU-10 — Gérer des tâches récurrentes

**En tant qu'utilisateur**, je veux créer des tâches qui se répètent automatiquement.

**Critères d'acceptation** :
- Récurrence : quotidienne / hebdomadaire / mensuelle
- Configuration dans le détail de la tâche
- Détectée par Claude API à la capture vocale si mentionnée
- Tâche suivante créée automatiquement à la clôture via pg_cron (Supabase)

**Priorité** : Importante

---

## BU-11 — Retrouver et restaurer une tâche archivée

**En tant qu'utilisateur**, je veux retrouver une tâche terminée et la restaurer si nécessaire.

**Critères d'acceptation** :
- Filtres : projet / priorité / période de clôture
- Recherche par mot-clé
- Bouton "Restaurer" + confirmation
- Tâche restaurée repart en statut "Active"

**Priorité** : Importante

---

## BU-12 — Suivre les tâches que je délègue

**En tant qu'utilisateur**, je veux marquer une tâche comme déléguée et suivre son statut.

**Critères d'acceptation** :
- Champ "Responsable" modifiable
- Statut "En attente de retour" disponible
- Remonte dans la relance retards si échéance dépassée
- Aucune notification externe, aucun accès tiers

**Priorité** : Utile

---

## BU-13 — Configurer l'outil en moins de 5 minutes

**En tant qu'utilisateur**, je veux un onboarding guidé à la première ouverture.

**Critères d'acceptation** :
- 5 étapes : compte / email / projets / horaires / confirmation
- Navigation libre entre étapes
- Couleur unique par projet (disparaît de la palette)
- Icônes si couleurs épuisées

**Priorité** : Indispensable

---

## BU-14 — Modifier mes paramètres à tout moment

**En tant qu'utilisateur**, je veux pouvoir modifier mes préférences après l'onboarding.

**Critères d'acceptation** :
- Accessible depuis le menu ⚙️
- Modifiable : prénom, mot de passe, email, projets, horaires, seuils d'alerte

**Priorité** : Indispensable

---

## BU-15 — Être alerté si mes tâches s'accumulent

**En tant qu'utilisateur**, je veux être prévenu si mes tâches non qualifiées s'accumulent.

**Critères d'acceptation** :
- 10 tâches → notification push
- 15 tâches → bannière orange persistante (configurable)
- 20 tâches → bannière rouge persistante (configurable)

**Priorité** : Importante

---

## BU-16 — Utiliser l'app sans réseau (V2)

**En tant qu'utilisateur**, je veux pouvoir capturer des tâches même sans connexion internet.

**Note V1** : en V1, l'app est en lecture seule sans réseau. Un bandeau orange informe l'utilisateur. La capture hors ligne est reportée en V2.

**Critères d'acceptation V2** :
- Capture stockée localement sans réseau
- Icône ⏳ sur chaque tâche non synchronisée
- Synchro automatique au retour du réseau

**Priorité** : Importante (V2)

---

## Matrice de priorités

| Priorité | Besoins | Version |
|---|---|---|
| Indispensable | BU-01, BU-02, BU-03, BU-04, BU-05, BU-06, BU-13, BU-14 | V1 |
| Importante | BU-07, BU-08, BU-09, BU-10, BU-11, BU-15 | V1 |
| Importante | BU-16 | V2 |
| Utile | BU-12 | V1 |

---

## BU-17 — Réinitialiser mon mot de passe

**En tant qu'utilisateur**, je veux pouvoir réinitialiser mon mot de passe si je l'ai oublié.

**Critères d'acceptation** :
- Lien "Mot de passe oublié" visible sur l'écran de connexion
- Saisie de l'adresse email → envoi d'un lien de reset via Supabase Auth
- Le lien de reset est valable 1 heure
- Formulaire de nouveau mot de passe avec confirmation
- Retour automatique à l'écran de connexion après reset réussi
- Message d'erreur si email non reconnu

**Priorité** : Indispensable

---

## BU-18 — Être informé clairement en cas d'erreur

**En tant qu'utilisateur**, je veux comprendre ce qui se passe quand quelque chose ne fonctionne pas, et savoir quoi faire.

**Critères d'acceptation** :
- Si Claude API est indisponible pendant la capture vocale : toast "Service IA indisponible — tâche enregistrée en texte brut", la tâche est quand même créée
- Si Supabase est indisponible en lecture : bandeau rouge persistant "Données indisponibles" avec bouton Réessayer
- Si Supabase est indisponible en écriture : toast "Sauvegarde échouée" avec bouton Réessayer
- Si connexion perdue en milieu de wizard : bandeau orange + wizard gelé + bouton Réessayer
- Si token expiré : modale "Session expirée — reconnecte-toi" avec bouton de reconnexion
- Aucun message affiché si push + email échouent tous les deux (log serveur uniquement)

**Priorité** : Indispensable

---

## BU-19 — Utiliser l'app dans mon fuseau horaire

**En tant qu'utilisateur**, je veux que les notifications arrivent à l'heure locale configurée, quel que soit mon fuseau horaire.

**Critères d'acceptation** :
- Timezone détectée automatiquement à l'onboarding via le navigateur
- Timezone modifiable dans les paramètres
- Les 3 notifications quotidiennes arrivent à l'heure locale (8h, 12h, 18h heure Paris par défaut)
- Si l'utilisateur change de timezone, les prochaines notifications sont recalculées

**Priorité** : Indispensable

---

## Matrice de priorités — Version finale

| Priorité | Besoins | Version |
|---|---|---|
| Indispensable | BU-01, BU-02, BU-03, BU-04, BU-05, BU-06, BU-13, BU-14, BU-17, BU-18, BU-19 | V1 |
| Importante | BU-07, BU-08, BU-09, BU-10, BU-11, BU-15 | V1 |
| Importante | BU-16 | V2 |
| Utile | BU-12 | V1 |
