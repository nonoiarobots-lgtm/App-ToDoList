# Outil personnel de gestion de tâches

PWA personnelle (mobile Android + desktop) de capture, qualification et pilotage de tâches,
avec découpage vocal assisté par IA et 3 rituels quotidiens (briefing matin, qualification,
relance retards).

**Stack** : Next.js (PWA via Serwist) · Supabase (BDD + Auth + Edge Functions + pg_cron) ·
Claude API (Anthropic) · Web Push API · Resend · Vercel

**Statut** : tranche ① livrée — **l'app est utilisable en production** : https://app-taches-bay.vercel.app
Auth email, capture rapide, backlog avec clôture, qualification, paramètres. Audit projet réalisé le 11/06 ([rapport](docs/audit-2026-06-11.md)).

## Avancement

- [x] Sprint 0 — scaffold, Supabase, Vercel, keep-alive
- [x] Tranche ① — auth email, capture texte, backlog, qualification basique, paramètres
- [x] Itération retours d'usage (2026-06-18) — capture en rafale, auto-qualification, wizard de qualification enchaînée, refonte ergonomique des filtres backlog, **module CRA** (compte-rendu d'activité), nouvelle icône
- [ ] Tranche ② — capture vocale (Web Speech API) + découpage IA Claude
- [ ] Tranche ③ — briefing matin, wizards qualification et relance retards, swipe
- [x] Vue semaine (matrice projets × jours + indicateur CRA par jour) + restitution CRA (synthèse semaine/mois, export CSV) — 2026-06-18
- [ ] Emails 8h/12h/18h (pg_cron + Edge Function + Resend ou SMTP Gmail) — *en attente du choix expéditeur*
- [ ] Tranche ⑤ — archives, récurrence, recherche, mode hors ligne

## Démarrage rapide

```bash
npm install
cp .env.example .env.local   # puis renseigner les clés
npm run dev                  # http://localhost:3000
npm run build                # build production (webpack, requis par Serwist)
npm test                     # Jest (unit / integration / e2e)
```

**Infra** : Supabase `app-taches` (`gtyinljbotgcxinjfgjc`, région eu-west-3 Paris) · Vercel `app-taches` ·
GitHub [nonoiarobots-lgtm/App-ToDoList](https://github.com/nonoiarobots-lgtm/App-ToDoList) — **chaque push sur `main` déploie automatiquement en production**.

---

## Index des documents

Tous les documents de conception sont dans [`docs/`](docs/).

| Document | Version | Rôle |
|---|---|---|
| [cadrage-complet.md](docs/cadrage-complet.md) | v6 | **Référence fonctionnelle** — specs, cycle de vie, flux, décisions |
| [besoins-utilisateurs.md](docs/besoins-utilisateurs.md) | v3 | Besoins utilisateurs (BU-xx) et critères d'acceptation |
| [inventaire-ecrans.md](docs/inventaire-ecrans.md) | v3 | Liste des écrans et états |
| [audit-technique.md](docs/audit-technique.md) | v2 | Arbitrages techniques (PWA, Supabase, offline V2) et risques |
| [schema-base-donnees.md](docs/schema-base-donnees.md) | v2 | Schéma PostgreSQL/Supabase, RLS, index |
| [api-principales.md](docs/api-principales.md) | v2 | Endpoints Next.js Route Handlers |
| [prompt-engineering.md](docs/prompt-engineering.md) | v1 | Prompts Claude API (découpage + pré-caractérisation) |
| [tests-tdd.md](docs/tests-tdd.md) | v2 | Catalogue de 175 tests (unit / integration / e2e) |
| [plan-demarrage.md](docs/plan-demarrage.md) | v3 | Les 10 actions de setup avant la première feature |
| [analyse-critique-consultant.md](docs/analyse-critique-consultant.md) | — | Revue critique — décisions intégrées au cadrage v4 (section 19) |
| [audit-2026-06-11.md](docs/audit-2026-06-11.md) | — | Audit post-tranche ① : sécurité, perfs, écarts cadrage/réalisé, risques |

- [`docs/wireframes/`](docs/wireframes/) — 8 wireframes HTML (ouvrir dans un navigateur)
- [`docs/skills/`](docs/skills/) — skills Claude utilisés pour produire le cadrage (archive méthode)

## Règle de cohérence documentaire

**Le cadrage complet est le document maître.** Toute modification du cadrage déclenche une
revue des besoins utilisateurs et de l'inventaire des écrans. Incrémenter la version et la
date du document modifié.

## Décisions techniques postérieures au cadrage

| Date | Décision | Raison |
|---|---|---|
| 2026-06-11 | `next-pwa` remplacé par **Serwist** (`@serwist/next`) | next-pwa non maintenu, incompatible Next.js récents |
| 2026-06-11 | Champ `login` supprimé — connexion par **email** (cadrage §19.5) | Supabase Auth ne gère que l'email ; complexité et risque sans bénéfice en solo |
| 2026-06-11 | **Keep-alive Supabase** : route `/api/keepalive` + cron Vercel quotidien | Le plan gratuit Supabase pause les projets inactifs ~7 jours → pg_cron et notifications stoppés |
| 2026-06-11 | `@supabase/auth-helpers-nextjs` remplacé par **`@supabase/ssr`** | auth-helpers est déprécié ; @supabase/ssr est le successeur officiel |
| 2026-06-11 | `middleware.ts` → **`proxy.ts`** | Convention renommée dans Next.js 16 |
| 2026-06-11 | Build production avec **webpack** (`next build --webpack`) | Serwist ne supporte pas encore Turbopack en mode plugin (dev reste sur Turbopack, SW désactivé en dev) |
| 2026-06-11 | ESLint 9 **flat config** (`eslint.config.mjs`) au lieu de `.eslintrc.json` | Format par défaut de Next 16 / ESLint 9 |
| 2026-06-11 | Stub SQL `process_notifications()` dans la migration triggers | Référencée par pg_cron mais implémentée en tranche ④ — le stub évite l'échec de migration |
| 2026-06-11 | Confirmation d'email **désactivée** dans Supabase Auth | App mono-utilisateur — friction inutile ; RLS isole les données de toute façon |
| 2026-06-11 | Ligne `preferences` créée au **premier accès authentifié** (depuis `user_metadata`) et non à l'inscription | Robuste que la confirmation email soit activée ou non |
| 2026-06-11 | Écran détail `/tache/[id]` ajouté — sert de qualification basique | Le wizard one-by-one du cadrage arrive en tranche ③ ; l'onboarding 5 étapes est remplacé par une inscription simple (à arbitrer) |
| 2026-06-11 | Migration `audit_fixes` : search_path des fonctions SQL figé, RLS `(select auth.uid())`, index FK | Correctifs des advisors Supabase (voir [audit](docs/audit-2026-06-11.md)) |
| 2026-06-18 | **Module CRA** : tables `types_activite` + `activites`, colonne `preferences.cible_jour_min` (migration 7) | Besoin utilisateur — suivi du temps passé par type/projet, décompte sur base 7h30 |
| 2026-06-18 | Statut « qualifié » = réutilisation de `active` (pas de nouveau statut) | Éviter une migration d'enum risquée ; une tâche entièrement renseignée n'a plus rien à qualifier |
| 2026-06-18 | `npm run dev` → `next dev --webpack` | Next 16 lance Turbopack par défaut, incompatible avec la config webpack de Serwist |

## Prochaine étape

Suivre [plan-demarrage.md](docs/plan-demarrage.md) (Sprint 0, ~1 jour), puis développer en
tranches verticales : ① auth + capture texte + backlog → ② capture vocale IA → ③ qualification
+ briefing → ④ notifications push + pg_cron → ⑤ retards, semaine, archives, récurrence.
