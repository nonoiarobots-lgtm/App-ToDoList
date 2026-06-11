'use client';

import useSWR, { useSWRConfig } from 'swr';
import Link from 'next/link';
import { TacheCard } from '@/components/taches/TacheCard';
import { appeler } from '@/lib/fetcher';
import { estEnRetard } from '@/lib/logique-taches';
import type { ReponseListeTaches } from '@/types/api';
import type { Tache } from '@/types/tache';
import type { Preferences } from '@/types/preferences';

// Vue du jour : retards + tâches dues aujourd'hui.
// Le briefing complet (accordéon par projet, résumé temps estimé) arrive en tranche ③.
export default function AujourdHuiPage() {
  const { mutate } = useSWRConfig();
  const { data, isLoading } = useSWR<ReponseListeTaches>('/api/taches');
  const { data: prefsData } = useSWR<{ preferences: Preferences }>('/api/preferences');

  async function cloturer(tache: Tache) {
    await appeler(`/api/taches/${tache.id}`, 'PATCH', { statut: 'archivee' });
    mutate(key => typeof key === 'string' && key.startsWith('/api/taches'));
  }

  const taches = data?.data ?? [];
  const retards = taches.filter(t => estEnRetard(t));
  const dueAujourdHui = taches.filter(
    t =>
      !estEnRetard(t) &&
      t.date_echeance &&
      new Date(t.date_echeance).toDateString() === new Date().toDateString()
  );

  const date = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <main className="screen">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">
            Bonjour{prefsData?.preferences?.prenom ? ` ${prefsData.preferences.prenom}` : ''} ☀️
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', textTransform: 'capitalize' }}>{date}</p>
        </div>
        <Link href="/parametres" aria-label="Paramètres" style={{ fontSize: 20 }}>
          ⚙️
        </Link>
      </div>

      {data && (
        <p style={{ fontSize: 13, color: 'var(--text-dim)', padding: '0 4px 8px' }}>
          {dueAujourdHui.length + retards.length} tâche(s) pour aujourd&apos;hui
          {retards.length > 0 && ` dont ${retards.length} en retard`}
        </p>
      )}

      {isLoading && <div className="empty-state">Chargement…</div>}
      {!isLoading && retards.length === 0 && dueAujourdHui.length === 0 && (
        <div className="empty-state">
          Rien d&apos;urgent aujourd&apos;hui 🎉 — consulte le <Link href="/backlog">backlog</Link>.
        </div>
      )}

      {retards.length > 0 && (
        <section>
          <div className="section-title">
            <span>🔴 En retard</span>
            <span>{retards.length}</span>
          </div>
          <div className="task-list">
            {retards.map(t => (
              <TacheCard key={t.id} tache={t} onCloturer={cloturer} />
            ))}
          </div>
        </section>
      )}

      {dueAujourdHui.length > 0 && (
        <section>
          <div className="section-title">
            <span>📅 Aujourd&apos;hui</span>
            <span>{dueAujourdHui.length}</span>
          </div>
          <div className="task-list">
            {dueAujourdHui.map(t => (
              <TacheCard key={t.id} tache={t} onCloturer={cloturer} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
