'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR, { useSWRConfig } from 'swr';
import { TacheCard } from '@/components/taches/TacheCard';
import { appeler } from '@/lib/fetcher';
import {
  estEnRetard,
  filtrerTaches,
  FILTRES_VIDES,
  nombreFiltresActifs,
  type FiltresBacklog,
} from '@/lib/logique-taches';
import type { ReponseListeTaches } from '@/types/api';
import type { Tache, StatutTache, PrioriteTache } from '@/types/tache';
import type { Projet } from '@/types/projet';

const LABELS_STATUT: Record<string, string> = {
  a_qualifier: '⚡ À qualifier',
  active: 'Active',
  en_attente_retour: '⏳ En attente',
  en_retard: '🔴 En retard',
};
const STATUTS_FILTRABLES: StatutTache[] = ['a_qualifier', 'active', 'en_attente_retour', 'en_retard'];

const LABELS_PRIORITE: Record<string, string> = {
  haute: '🔴 Haute',
  moyenne: '🟠 Moyenne',
  basse: '🔵 Basse',
  aucune: 'Aucune',
};
const PRIORITES_FILTRABLES: PrioriteTache[] = ['haute', 'moyenne', 'basse', 'aucune'];

// Sections du backlog (cadrage §9) — regroupement par échéance
function repartir(taches: Tache[]) {
  const aujourdHui = new Date();
  const finSemaine = new Date(aujourdHui);
  finSemaine.setDate(finSemaine.getDate() + (7 - finSemaine.getDay() || 7));

  const sections = { retard: [] as Tache[], jour: [] as Tache[], semaine: [] as Tache[], plusTard: [] as Tache[] };
  for (const t of taches) {
    if (estEnRetard(t)) sections.retard.push(t);
    else if (t.date_echeance && new Date(t.date_echeance).toDateString() === aujourdHui.toDateString())
      sections.jour.push(t);
    else if (t.date_echeance && new Date(t.date_echeance) <= finSemaine) sections.semaine.push(t);
    else sections.plusTard.push(t);
  }
  return sections;
}

function bascule<T>(liste: T[], valeur: T): T[] {
  return liste.includes(valeur) ? liste.filter(v => v !== valeur) : [...liste, valeur];
}

export default function BacklogPage() {
  const { mutate } = useSWRConfig();
  const { data, isLoading } = useSWR<ReponseListeTaches>('/api/taches');
  const { data: projetsData } = useSWR<{ projets: Projet[] }>('/api/projets');
  const [filtres, setFiltres] = useState<FiltresBacklog>(FILTRES_VIDES);
  const [panneauOuvert, setPanneauOuvert] = useState(false);

  async function cloturer(tache: Tache) {
    // Optimiste : la tâche disparaît immédiatement, archivage en arrière-plan
    await mutate(
      '/api/taches',
      async (courant?: ReponseListeTaches) => {
        await appeler(`/api/taches/${tache.id}`, 'PATCH', { statut: 'archivee' });
        return courant
          ? { ...courant, data: courant.data.filter(t => t.id !== tache.id) }
          : courant;
      },
      {
        optimisticData: (courant?: ReponseListeTaches) =>
          courant
            ? { ...courant, data: courant.data.filter(t => t.id !== tache.id) }
            : ({ data: [], total: 0, nb_a_qualifier: 0, nb_en_retard: 0, alerte: null } as ReponseListeTaches),
        rollbackOnError: true,
      }
    );
  }

  const projets = projetsData?.projets ?? [];
  const projetNom = (id: string) =>
    id === 'sans-projet' ? 'Sans projet' : projets.find(p => p.id === id)?.nom ?? 'Projet';

  const taches = filtrerTaches(data?.data ?? [], filtres);
  const sections = repartir(taches);
  const nbActifs = nombreFiltresActifs(filtres);

  // Pastilles supprimables des critères actifs
  const chipsActives: { cle: string; label: string; retirer: () => void }[] = [];
  if (filtres.recherche.trim())
    chipsActives.push({
      cle: 'recherche',
      label: `« ${filtres.recherche.trim()} »`,
      retirer: () => setFiltres(f => ({ ...f, recherche: '' })),
    });
  filtres.statuts.forEach(s =>
    chipsActives.push({
      cle: `s-${s}`,
      label: LABELS_STATUT[s],
      retirer: () => setFiltres(f => ({ ...f, statuts: f.statuts.filter(v => v !== s) })),
    })
  );
  filtres.priorites.forEach(p =>
    chipsActives.push({
      cle: `p-${p}`,
      label: LABELS_PRIORITE[p],
      retirer: () => setFiltres(f => ({ ...f, priorites: f.priorites.filter(v => v !== p) })),
    })
  );
  filtres.projetIds.forEach(id =>
    chipsActives.push({
      cle: `pr-${id}`,
      label: projetNom(id),
      retirer: () => setFiltres(f => ({ ...f, projetIds: f.projetIds.filter(v => v !== id) })),
    })
  );

  return (
    <main className="screen">
      {data?.alerte && (
        <div className={`banner ${data.alerte}`}>
          ⚡ {data.nb_a_qualifier} tâches à qualifier — pense à les traiter
        </div>
      )}
      <div className="screen-header">
        <h1 className="screen-title">Backlog</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="screen-count">{taches.length} tâches</span>
          <Link href="/archives" style={{ fontSize: 13, color: 'var(--accent)' }}>
            📁 Archives
          </Link>
        </div>
      </div>

      <div className="search-row">
        <div className="search-box">
          <span aria-hidden>🔍</span>
          <input
            type="search"
            placeholder="Rechercher…"
            value={filtres.recherche}
            onChange={e => setFiltres(f => ({ ...f, recherche: e.target.value }))}
          />
        </div>
        <button
          className={`btn-filtres ${nbActifs > 0 ? 'active' : ''}`}
          onClick={() => setPanneauOuvert(true)}
        >
          Filtres
          {nbActifs > 0 && <span className="btn-filtres-badge">{nbActifs}</span>}
        </button>
      </div>

      {chipsActives.length > 0 && (
        <div className="active-filtres">
          {chipsActives.map(c => (
            <button key={c.cle} className="chip-removable" onClick={c.retirer}>
              {c.label} <span aria-hidden>✕</span>
            </button>
          ))}
          <button className="chip-clear" onClick={() => setFiltres(FILTRES_VIDES)}>
            Tout effacer
          </button>
        </div>
      )}

      {isLoading && <div className="empty-state">Chargement…</div>}
      {!isLoading && taches.length === 0 && (
        <div className="empty-state">
          {nbActifs > 0 ? (
            'Aucune tâche ne correspond à ces filtres.'
          ) : (
            <>
              Rien ici. Appuie sur <strong>+</strong> pour capturer ta première tâche.
            </>
          )}
        </div>
      )}

      {(
        [
          ['🔴 En retard', sections.retard],
          ["📅 Aujourd'hui", sections.jour],
          ['📆 Cette semaine', sections.semaine],
          ['Plus tard', sections.plusTard],
        ] as [string, Tache[]][]
      ).map(
        ([titre, liste]) =>
          liste.length > 0 && (
            <section key={titre}>
              <div className="section-title">
                <span>{titre}</span>
                <span>{liste.length}</span>
              </div>
              <div className="task-list">
                {liste.map(t => (
                  <TacheCard key={t.id} tache={t} onCloturer={cloturer} />
                ))}
              </div>
            </section>
          )
      )}

      {panneauOuvert && (
        <div className="modal-overlay" onClick={() => setPanneauOuvert(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Filtres</h2>

            <div className="filtre-groupe">
              <label>Statut</label>
              <div className="filtre-chips">
                {STATUTS_FILTRABLES.map(s => (
                  <button
                    key={s}
                    className={`filter-chip ${filtres.statuts.includes(s) ? 'active' : ''}`}
                    onClick={() => setFiltres(f => ({ ...f, statuts: bascule(f.statuts, s) }))}
                  >
                    {LABELS_STATUT[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="filtre-groupe">
              <label>Priorité</label>
              <div className="filtre-chips">
                {PRIORITES_FILTRABLES.map(p => (
                  <button
                    key={p}
                    className={`filter-chip ${filtres.priorites.includes(p) ? 'active' : ''}`}
                    onClick={() => setFiltres(f => ({ ...f, priorites: bascule(f.priorites, p) }))}
                  >
                    {LABELS_PRIORITE[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="filtre-groupe">
              <label>Projet</label>
              <div className="filtre-chips">
                <button
                  className={`filter-chip ${filtres.projetIds.includes('sans-projet') ? 'active' : ''}`}
                  onClick={() =>
                    setFiltres(f => ({ ...f, projetIds: bascule(f.projetIds, 'sans-projet') }))
                  }
                >
                  Sans projet
                </button>
                {projets.map(p => (
                  <button
                    key={p.id}
                    className={`filter-chip ${filtres.projetIds.includes(p.id) ? 'active' : ''}`}
                    onClick={() => setFiltres(f => ({ ...f, projetIds: bascule(f.projetIds, p.id) }))}
                  >
                    {p.icone ? `${p.icone} ` : ''}
                    {p.nom}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn" onClick={() => setPanneauOuvert(false)}>
              Voir {taches.length} tâche{taches.length > 1 ? 's' : ''}
            </button>
            <button className="btn btn-ghost" onClick={() => setFiltres(FILTRES_VIDES)}>
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
