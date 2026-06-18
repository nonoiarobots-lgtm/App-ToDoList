# Sauvegarde & restauration de la base

La base Supabase est sauvegardée **automatiquement chaque jour** par la GitHub Action
[`backup-db.yml`](../.github/workflows/backup-db.yml) : `pg_dump` → gzip → **chiffrement GPG (AES256)**
→ stocké comme **artifact privé** du dépôt (rétention 90 jours). Aucun dump n'est commité
dans ce dépôt public.

## Secrets GitHub requis
Repo → **Settings → Secrets and variables → Actions** :

| Secret | Valeur |
|---|---|
| `SUPABASE_DB_URL` | Chaîne **Session pooler** (Supabase → Settings → Database → Connection string → *Session pooler*), avec le mot de passe de la base |
| `BACKUP_PASSPHRASE` | Phrase secrète de chiffrement — **à conserver hors du dépôt** (sans elle, les sauvegardes sont illisibles) |

## Récupérer une sauvegarde
1. GitHub → onglet **Actions** → workflow **Sauvegarde BDD** → ouvrir un run réussi.
2. Section **Artifacts** → télécharger `db-backup-<id>` (fichier `.sql.gz.gpg`).

## Restaurer
```bash
# 1. Déchiffrer + décompresser
gpg --batch --passphrase 'TA_PASSPHRASE' -d backup-AAAA-MM-JJ.sql.gz.gpg | gunzip > backup.sql

# 2. Restaurer dans une base cible (ex. nouveau projet Supabase)
psql "postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" -f backup.sql
```

> Le dump couvre toute la base. Selon le scénario (même projet vs projet neuf), une
> restauration **sélective** (schéma `public` uniquement) peut être préférable pour éviter
> les conflits avec les schémas internes Supabase (`auth`, `storage`…).

## Tester la sauvegarde
Onglet **Actions** → **Sauvegarde BDD** → **Run workflow** (déclenchement manuel) :
le run doit être vert et produire un artifact.
