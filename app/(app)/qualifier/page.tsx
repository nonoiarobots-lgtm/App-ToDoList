'use client';

import useSWR, { useSWRConfig } from 'swr';
import { TacheCard } from '@/components/taches/TacheCard';
import { appeler } from '@/lib/fetcher';
import type { ReponseListeTaches } from '@/types/api';
import type { Tache } from '@/types/tache';

// Liste des tâches à qualifier — tap sur une tâche → écran de qualification.
// Le wizard one-by-one avec pré-remplissage IA arrive en tranche ③.
export default function QualifierPage() {
  const { mutate } = useSWRConfig();
  const { data, isLoading } = useSWR<ReponseListeTaches>('/api/taches?statut=a_qualifier');

  async function cloturer(tache: Tache) {
    await appeler(`/api/taches/${tache.id}`, 'PATCH', { statut: 'archivee' });
    mutate(key => typeof key === 'string' && key.startsWith('/api/taches'));
  }

  return (
    <main className="screen">
      <div className="screen-header">
        <h1 className="screen-title">⚡ À qualifier</h1>
        <span className="screen-count">{data?.total ?? '…'}</span>
      </div>
      {isLoading && <div className="empty-state">Chargement…</div>}
      {!isLoading && (data?.data ?? []).length === 0 && (
        <div className="empty-state">Tout est qualifié 🎉</div>
      )}
      <div className="task-list">
        {(data?.data ?? []).map(t => (
          <TacheCard key={t.id} tache={t} onCloturer={cloturer} />
        ))}
      </div>
    </main>
  );
}
