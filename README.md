# Outil personnel de gestion de tâches

PWA personnelle (mobile Android + desktop) de capture, qualification et pilotage de tâches,
avec découpage vocal assisté par IA et 3 rituels quotidiens (briefing matin, qualification,
relance retards).

**Stack** : Next.js (PWA via Serwist) · Supabase (BDD + Auth + Edge Functions + pg_cron) ·
Claude API (Anthropic) · Web Push API · Resend · Vercel

**Statut** : Sprint 0 terminé — scaffold opérationnel, base Supabase migrée, déployé sur Vercel.
Prochaine étape : tranche ① (auth + capture texte + backlog).

## Démarrage rapide

```bash
npm install
cp .env.example .env.local   # puis renseigner les clés
npm run dev                  # http://localhost:3000
npm run build                # build production (webpack, requis par Serwist)
npm test                     # Jest (unit / integration / e2e)
```

**Infra** : Supabase `app-taches` (`gtyinljbotgcxinjfgjc`, région eu-west-3 Paris) · Vercel `app-taches`.

---

## Index des documents

Tous les documents de conception sont dans [`docs/`](docs/).

| Document | Version | Rôle |
|---|---|---|
| [cadrage-complet.md](docs/cadrage-complet.md) | v5 | **Référence fonctionnelle** — specs, cycle de vie, flux, décisions |
| [besoins-utilisateurs.md](docs/besoins-utilisateurs.md) | v3 | Besoins utilisateurs (BU-xx) et critères d'acceptation |
| [inventaire-ecrans.md](docs/inventaire-ecrans.md) | v3 | Liste des écrans et états |
| [audit-technique.md](docs/audit-technique.md) | v2 | Arbitrages techniques (PWA, Supabase, offline V2) et risques |
| [schema-base-donnees.md](docs/schema-base-donnees.md) | v2 | Schéma PostgreSQL/Supabase, RLS, index |
| [api-principales.md](docs/api-principales.md) | v2 | Endpoints Next.js Route Handlers |
| [prompt-engineering.md](docs/prompt-engineering.md) | v1 | Prompts Claude API (découpage + pré-caractérisation) |
| [tests-tdd.md](docs/tests-tdd.md) | v2 | Catalogue de 175 tests (unit / integration / e2e) |
| [plan-demarrage.md](docs/plan-demarrage.md) | v3 | Les 10 actions de setup avant la première feature |
| [analyse-critique-consultant.md](docs/analyse-critique-consultant.md) | — | Revue critique — décisions intégrées au cadrage v4 (section 19) |

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

## Prochaine étape

Suivre [plan-demarrage.md](docs/plan-demarrage.md) (Sprint 0, ~1 jour), puis développer en
tranches verticales : ① auth + capture texte + backlog → ② capture vocale IA → ③ qualification
+ briefing → ④ notifications push + pg_cron → ⑤ retards, semaine, archives, récurrence.
