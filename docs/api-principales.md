# API principales — Outil personnel de gestion de tâches
**Version 1 — Next.js + Supabase**
*Dernière mise à jour : 30 mai 2026*

---

## Architecture générale

L'API est implémentée en **Next.js Route Handlers** (`/app/api/...`). Supabase est appelé côté serveur via le SDK `@supabase/supabase-js`. Claude API est appelé depuis les Route Handlers — jamais depuis le client (la clé API ne doit jamais être exposée au navigateur).

```
Client (PWA)
    │
    ▼
Next.js Route Handlers (/app/api/...)
    │
    ├── Supabase (BDD + Auth)
    ├── Claude API (IA)
    └── Resend (emails)

Supabase Edge Functions (jobs async)
    │
    ├── Web Push API (notifications)
    └── Resend (emails de secours)
```

**Authentification** : toutes les routes (sauf `/api/auth/*`) requièrent un token JWT Supabase dans le header `Authorization: Bearer <token>`. Le middleware Next.js vérifie le token avant chaque requête.

**Format** : JSON. Codes HTTP standards (200, 201, 400, 401, 404, 500).

**Convention de nommage** : `snake_case` pour les champs, calqué sur le schéma PostgreSQL.

---

## Auth

### POST /api/auth/register

Création de compte + préférences initiales.

**Body**
```json
{
  "prenom": "Jean-Pierre",
  "login": "jeanpierre",
  "email": "jp@gmail.com",
  "password": "••••••••",
  "heure_briefing": "08:00",
  "heure_qualification": "12:00",
  "heure_retards": "18:00"
}
```

**Logique**
1. Créer l'utilisateur via Supabase Auth (`supabase.auth.signUp`)
2. Insérer une ligne dans `preferences`
3. Retourner le token JWT

**Réponse 201**
```json
{
  "user_id": "uuid",
  "token": "jwt"
}
```

---

### POST /api/auth/login

**Body**
```json
{
  "login": "jeanpierre",
  "password": "••••••••"
}
```

**Logique**
1. Résoudre le login → email (lookup dans `preferences`)
2. Authentifier via Supabase Auth (`supabase.auth.signInWithPassword`)
3. Retourner le token JWT + les préférences utilisateur

**Réponse 200**
```json
{
  "token": "jwt",
  "preferences": { ... }
}
```

---

### POST /api/auth/logout

Invalide la session Supabase côté serveur.

---

## Tâches

### GET /api/taches

Retourne les tâches selon des filtres. Utilisé par le backlog, le briefing et la relance retards.

**Query params**

| Param | Type | Description |
|---|---|---|
| statut | string | `a_qualifier`, `active`, `en_retard`, `en_attente_retour`, `archivee` |
| projet_id | uuid | Filtre par projet |
| priorite | string | `haute`, `moyenne`, `basse`, `aucune` |
| date_debut | date | Tâches à partir de cette date |
| date_fin | date | Tâches jusqu'à cette date |
| vue | string | `briefing`, `semaine`, `retards` — requêtes optimisées |
| ordre | string | `echeance`, `priorite`, `avancement`, `created_at` |
| limit | integer | Défaut 50 |
| offset | integer | Pagination |

**Exemple** : tâches du jour + en retard pour le briefing
```
GET /api/taches?vue=briefing
```

**Logique pour `vue=briefing`**
Exécute la requête SQL optimisée du briefing (cf. schéma BDD) — groupée par projet, triée par volume décroissant, tâches triées par priorité dans chaque projet.

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "titre": "Appeler Sophie",
      "statut": "active",
      "priorite": "haute",
      "projet": {
        "id": "uuid",
        "nom": "Formation IA",
        "couleur": "#4a9eff",
        "icone": null
      },
      "date_echeance": "2026-05-30T14:00:00Z",
      "avancement": 60,
      "temps_estime_min": 30,
      "pre_caracterisee_ia": false,
      "responsable": "Moi",
      "notes": null,
      "recurrence_id": null,
      "predecesseur_id": null,
      "created_at": "2026-05-30T08:00:00Z",
      "updated_at": "2026-05-30T09:00:00Z"
    }
  ],
  "total": 142,
  "nb_a_qualifier": 15,
  "nb_en_retard": 4
}
```

**Note** : `nb_a_qualifier` est toujours retourné — permet d'afficher le badge et les bannières sans requête supplémentaire.

---

### GET /api/taches/:id

Retourne le détail complet d'une tâche, y compris la récurrence et le prédécesseur.

**Réponse 200**
```json
{
  "id": "uuid",
  "titre": "Appeler Sophie",
  "statut": "active",
  "priorite": "haute",
  "projet": { ... },
  "date_debut": "2026-05-30",
  "date_echeance": "2026-05-30T14:00:00Z",
  "date_cloture": null,
  "avancement": 60,
  "temps_estime_min": 30,
  "responsable": "Moi",
  "notes": "Valider budget Q3",
  "recurrence": {
    "id": "uuid",
    "frequence": "hebdomadaire",
    "jour_semaine": 4
  },
  "predecesseur": {
    "id": "uuid",
    "titre": "Envoyer le CR"
  },
  "pre_caracterisee_ia": false,
  "created_at": "...",
  "updated_at": "..."
}
```

---

### POST /api/taches

Crée une ou plusieurs tâches. Utilisé après la capture (texte ou vocal).

**Body — saisie texte simple**
```json
{
  "taches": [
    {
      "titre": "Rappeler Martin",
      "pre_caracterisee_ia": false
    }
  ]
}
```

**Body — après découpage IA**
```json
{
  "taches": [
    {
      "titre": "Envoyer CR réunion à l'équipe",
      "projet_id": "uuid",
      "priorite": "haute",
      "date_echeance": "2026-05-30T23:59:00Z",
      "temps_estime_min": 20,
      "pre_caracterisee_ia": true
    },
    {
      "titre": "Planifier revue budget avec Sophie",
      "projet_id": "uuid",
      "priorite": "moyenne",
      "date_echeance": "2026-06-03T23:59:00Z",
      "pre_caracterisee_ia": true
    }
  ]
}
```

**Logique**
- Toutes les tâches créées avec `statut = 'a_qualifier'`
- Insertion en batch (une seule requête SQL)
- Vérification du seuil d'alerte après insertion → si seuil atteint, log dans `jobs_notifications`

**Réponse 201**
```json
{
  "taches": [ { "id": "uuid", ... }, { "id": "uuid", ... } ],
  "nb_a_qualifier": 16,
  "alerte": "rouge"  // null | "orange" | "rouge"
}
```

---

### PATCH /api/taches/:id

Met à jour un ou plusieurs champs d'une tâche. Utilisé partout (qualification, archivage, reporter, modifier l'avancement...).

**Body — exemples d'usage**

Qualifier une tâche :
```json
{
  "statut": "active",
  "projet_id": "uuid",
  "priorite": "haute",
  "date_echeance": "2026-06-01T18:00:00Z",
  "temps_estime_min": 45
}
```

Archiver (cocher) une tâche :
```json
{
  "statut": "archivee"
}
```
→ Le trigger PostgreSQL renseigne automatiquement `date_cloture = now()`
→ Si `recurrence_id` est renseigné, le trigger crée la tâche suivante

Reporter une tâche :
```json
{
  "date_echeance": "2026-06-02T18:00:00Z",
  "statut": "active"
}
```

Mettre à jour l'avancement :
```json
{
  "avancement": 75
}
```

**Réponse 200**
```json
{
  "tache": { ... },
  "tache_suivante_id": "uuid"  // null sauf si récurrence déclenchée
}
```

---

### DELETE /api/taches/:id

Suppression définitive. Pas de corbeille en V1.

**Réponse 204** (no content)

---

### POST /api/taches/:id/restaurer

Restaure une tâche archivée dans le backlog actif.

**Logique**
- `statut` repasse à `active`
- `date_cloture` remis à `null`

**Réponse 200**
```json
{
  "tache": { ... }
}
```

---

## Capture IA

### POST /api/capture/ia

Envoie le texte dicté à Claude API pour découpage et pré-caractérisation.

**Body**
```json
{
  "texte": "J'ai trois actions : envoyer le CR à l'équipe, planifier la revue budget avec Sophie vendredi, relancer le prestataire sur la livraison",
  "projets": [
    { "id": "uuid", "nom": "Formation IA" },
    { "id": "uuid", "nom": "Recherche emploi" },
    { "id": "uuid", "nom": "Perso" }
  ],
  "date_reference": "2026-05-30"
}
```

**Logique**
1. Construire le prompt avec la liste des projets et la date de référence
2. Appeler Claude API (`claude-sonnet-4-20250514`)
3. Parser la réponse JSON
4. Retourner les tâches pré-caractérisées

**Réponse 200**
```json
{
  "taches": [
    {
      "titre": "Envoyer CR réunion à l'équipe",
      "projet_id": "uuid",
      "projet_nom": "Formation IA",
      "priorite": "haute",
      "date_echeance": "2026-05-30T23:59:00Z",
      "temps_estime_min": null,
      "recurrence": null,
      "confiance": 0.9  // score de confiance IA (0 à 1)
    },
    {
      "titre": "Planifier revue budget avec Sophie",
      "projet_id": "uuid",
      "projet_nom": "Formation IA",
      "priorite": "moyenne",
      "date_echeance": "2026-06-03T23:59:00Z",
      "temps_estime_min": null,
      "recurrence": null,
      "confiance": 0.85
    },
    {
      "titre": "Relancer prestataire — livraison",
      "projet_id": null,
      "projet_nom": null,
      "priorite": "moyenne",
      "date_echeance": null,
      "temps_estime_min": null,
      "recurrence": null,
      "confiance": 0.4  // projet non identifié → champ orange dans l'UI
    }
  ],
  "duree_ms": 1240  // pour monitoring de la latence
}
```

**Note** : un `confiance < 0.6` sur le projet → le champ projet s'affiche en orange "? À définir" dans l'interface de capture.

---

## Projets

### GET /api/projets

Retourne tous les projets actifs de l'utilisateur.

**Réponse 200**
```json
{
  "projets": [
    {
      "id": "uuid",
      "nom": "Formation IA",
      "ordre": 0,
      "type_identifiant": "couleur",
      "couleur": "#4a9eff",
      "icone": null,
      "nb_taches_actives": 12
    }
  ],
  "couleurs_disponibles": ["#9b59b6", "#e74c3c", "#1abc9c"],
  "icones_disponibles": ["🏠", "⭐", "🎯", "💼", "📌", "🔖", "⚙️"]
}
```

**Note** : `couleurs_disponibles` et `icones_disponibles` sont calculées dynamiquement en soustrayant les couleurs/icônes déjà utilisées. L'UI n'affiche que ce que cette route retourne.

---

### POST /api/projets

Crée un nouveau projet.

**Body**
```json
{
  "nom": "Side project",
  "type_identifiant": "couleur",
  "couleur": "#9b59b6"
}
```

**Réponse 201**
```json
{
  "projet": { ... }
}
```

---

### PATCH /api/projets/:id

Modifie un projet (nom, couleur, icône, ordre).

---

### DELETE /api/projets/:id

Désactive le projet (`actif = false`). Les tâches associées restent en base mais le projet n'apparaît plus dans les filtres.

---

## Préférences

### GET /api/preferences

Retourne les préférences de l'utilisateur.

### PATCH /api/preferences

Met à jour les préférences.

**Body — exemples**

Modifier les horaires :
```json
{
  "heure_briefing": "07:30",
  "heure_qualification": "13:00",
  "heure_retards": "19:00"
}
```

Modifier les seuils :
```json
{
  "seuil_orange": 12,
  "seuil_rouge": 18
}
```

Enregistrer la subscription Web Push :
```json
{
  "push_subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": { "p256dh": "...", "auth": "..." }
  }
}
```

---

## Notifications (Supabase Edge Functions)

Ces fonctions ne sont pas appelées par le client — elles sont déclenchées par pg_cron.

### process_notifications()

Appelée toutes les 5 minutes par pg_cron. Logique :

```
1. Récupérer les jobs_notifications planifiés dont planifiee_at <= now()
2. Pour chaque job :
   a. Tenter l'envoi Web Push (via push_subscription de l'utilisateur)
   b. Si succès → statut = 'envoyee'
   c. Si échec → tenter l'envoi email via Resend
   d. Mettre à jour le statut et envoyee_at
3. Planifier les prochains jobs si nécessaire
```

### schedule_notifications()

Appelée une fois par jour à minuit par pg_cron. Crée les entrées dans `jobs_notifications` pour chaque utilisateur selon ses horaires configurés.

```sql
-- Exemple de logique pour le briefing matin
insert into jobs_notifications (user_id, type, canal, planifiee_at)
select
  p.user_id,
  'briefing_matin',
  'push',
  (current_date + p.heure_briefing)::timestamptz
from preferences p
where not exists (
  select 1 from jobs_notifications j
  where j.user_id = p.user_id
    and j.type = 'briefing_matin'
    and j.planifiee_at::date = current_date
);
```

---

## Vue semaine

### GET /api/taches/semaine

Retourne la matrice pour la vue semaine.

**Query params**

| Param | Type | Description |
|---|---|---|
| debut | date | Lundi de la semaine (ex: `2026-05-25`) |

**Logique** : exécute la requête SQL de la vue semaine (cf. schéma BDD) avec `debut` et `debut + 6 jours`.

**Réponse 200**
```json
{
  "semaine": {
    "debut": "2026-05-25",
    "fin": "2026-05-31"
  },
  "matrix": [
    {
      "projet": { "id": "uuid", "nom": "Formation IA", "couleur": "#4a9eff" },
      "jours": {
        "2026-05-25": { "nb": 2, "taches": [ { "id": "uuid", "titre": "...", "priorite": "haute" } ] },
        "2026-05-26": { "nb": 0, "taches": [] },
        "2026-05-27": { "nb": 1, "taches": [ ... ] },
        "2026-05-28": { "nb": 0, "taches": [] },
        "2026-05-29": { "nb": 3, "taches": [ ... ] },
        "2026-05-30": { "nb": 1, "taches": [ ... ] },
        "2026-05-31": { "nb": 0, "taches": [] }
      }
    }
  ]
}
```

---

## Récapitulatif des endpoints

| Méthode | Route | Usage |
|---|---|---|
| POST | /api/auth/register | Création de compte |
| POST | /api/auth/login | Connexion |
| POST | /api/auth/logout | Déconnexion |
| GET | /api/taches | Liste tâches (backlog, briefing, retards) |
| GET | /api/taches/:id | Détail tâche |
| POST | /api/taches | Créer une ou plusieurs tâches |
| PATCH | /api/taches/:id | Modifier une tâche |
| DELETE | /api/taches/:id | Supprimer une tâche |
| POST | /api/taches/:id/restaurer | Restaurer depuis archives |
| GET | /api/taches/semaine | Vue semaine matrice |
| POST | /api/capture/ia | Découpage + pré-caractérisation IA |
| GET | /api/projets | Liste projets + couleurs disponibles |
| POST | /api/projets | Créer un projet |
| PATCH | /api/projets/:id | Modifier un projet |
| DELETE | /api/projets/:id | Désactiver un projet |
| GET | /api/preferences | Lire les préférences |
| PATCH | /api/preferences | Modifier les préférences |

**Total : 16 endpoints**

---

## Gestion des erreurs

Format uniforme pour toutes les erreurs :

```json
{
  "error": {
    "code": "TACHE_NOT_FOUND",
    "message": "La tâche demandée n'existe pas ou n'appartient pas à cet utilisateur.",
    "status": 404
  }
}
```

| Code | Status | Description |
|---|---|---|
| UNAUTHORIZED | 401 | Token manquant ou invalide |
| TACHE_NOT_FOUND | 404 | Tâche inexistante ou non autorisée |
| PROJET_NOT_FOUND | 404 | Projet inexistant |
| COULEUR_DEJA_UTILISEE | 400 | Couleur déjà attribuée à un autre projet |
| ICONE_DEJA_UTILISEE | 400 | Icône déjà attribuée |
| IA_TIMEOUT | 503 | Claude API n'a pas répondu dans les délais |
| VALIDATION_ERROR | 400 | Champ manquant ou invalide |

---

## Prochaine étape

- Prompt engineering Claude API
