'use client';

import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { TacheCard } from '@/components/taches/TacheCard';
import { appeler } from '@/lib/fetcher';
import { estEnRetard } from '@/lib/logique-taches';
import type { ReponseListeTaches } from '@/types/api';
import type { Tache } from '@/types/tache';
import type { Projet } from '@/types/projet';

type Filtre = 'tout' | 'haute' | 'moyenne' | 'a_qualifier' | string; // string = projet_id

// Sections du backlog (cadrage §9)
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

export default function BacklogPage() {
  const { mutate } = useSWRConfig();
  const { data, isLoading } = useSWR<ReponseListeTaches>('/api/taches');
  const { data: projetsData } = useSWR<{ projets: Projet[] }>('/api/projets');
  const [filtre, setFiltre] = useState<Filtre>('tout');

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

  const taches = (data?.data ?? []).filter(t => {
    if (filtre === 'tout') return true;
    if (filtre === 'haute' || filtre === 'moyenne') return t.priorite === filtre;
    if (filtre === 'a_qualifier') return t.statut === 'a_qualifier';
    return t.projet_id === filtre;
  });
  const sections = repartir(taches);
  const projets = projetsData?.projets ?? [];

  return (
    <main className="screen">
      {data?.alerte && (
        <div className={`banner ${data.alerte}`}>
          ⚡ {data.nb_a_qualifier} tâches à qualifier — pense à les traiter
        </div>
      )}
      <div className="screen-header">
        <h1 className="screen-title">Backlog</h1>
        <span className="screen-count">{data?.total ?? '…'} tâches</span>
      </div>

      <div className="filter-row">
        {(
          [
            ['tout', 'Tout'],
            ['haute', '🔴 Haute'],
            ['moyenne', '🟠 Moyenne'],
            ['a_qualifier', '⚡ À qualifier'],
          ] as [Filtre, string][]
        ).map(([val, label]) => (
          <button
            key={val}
            className={`filter-chip ${filtre === val ? 'active' : ''}`}
            onClick={() => setFiltre(val)}
          >
            {label}
          </button>
        ))}
        {projets.map(p => (
          <button
            key={p.id}
            className={`filter-chip ${filtre === p.id ? 'active' : ''}`}
            onClick={() => setFiltre(p.id)}
          >
            {p.icone ? `${p.icone} ` : ''}
            {p.nom}
          </button>
        ))}
      </div>

      {isLoading && <div className="empty-state">Chargement…</div>}
      {!isLoading && taches.length === 0 && (
        <div className="empty-state">
          Rien ici. Appuie sur <strong>+</strong> pour capturer ta première tâche.
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
    </main>
  );
}
