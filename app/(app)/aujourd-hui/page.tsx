'use client';

import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { appeler } from '@/lib/fetcher';
import { estEnRetard, joursDeRetard } from '@/lib/logique-taches';
import type { ReponseListeTaches } from '@/types/api';
import type { Tache } from '@/types/tache';
import type { Preferences } from '@/types/preferences';

const COULEUR_PRIORITE: Record<string, string> = {
  haute: 'var(--p1)',
  moyenne: 'var(--p2)',
  basse: 'var(--p3)',
  aucune: 'var(--p4)',
};

function labelEcheance(tache: Tache): { texte: string; late: boolean } | null {
  if (!tache.date_echeance) return null;
  const echeance = new Date(tache.date_echeance);
  const aujourdHui = new Date();
  if (estEnRetard(tache)) {
    const jours = joursDeRetard(tache.date_echeance);
    return { texte: jours > 0 ? `+${jours}j de retard` : 'en retard', late: true };
  }
  if (echeance.toDateString() === aujourdHui.toDateString()) return { texte: "aujourd'hui", late: false };
  return {
    texte: echeance.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    late: false,
  };
}

type Groupe = {
  id: string;
  nom: string;
  icone: string | null;
  couleur: string;
  taches: Tache[];
  retards: number;
};

function grouperParProjet(taches: Tache[]): Groupe[] {
  const map = new Map<string, Groupe>();
  for (const t of taches) {
    const id = t.projet?.id ?? 'sans-projet';
    if (!map.has(id)) {
      map.set(id, {
        id,
        nom: t.projet?.nom ?? 'Sans projet',
        icone: t.projet?.icone ?? null,
        couleur: t.projet?.couleur ?? 'var(--primary)',
        taches: [],
        retards: 0,
      });
    }
    const g = map.get(id)!;
    g.taches.push(t);
    if (estEnRetard(t)) g.retards += 1;
  }
  return [...map.values()].sort((a, b) => b.retards - a.retards);
}

function LigneTache({ tache, onCloturer }: { tache: Tache; onCloturer: (t: Tache) => void }) {
  const echeance = labelEcheance(tache);
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '10px 16px' }}>
      <span
        className="priority-dot"
        style={{ background: COULEUR_PRIORITE[tache.priorite], marginTop: 7 }}
      />
      <button
        className="task-check"
        aria-label="Clôturer la tâche"
        onClick={() => onCloturer(tache)}
      >
        <Icon name="check" />
      </button>
      <Link
        href={`/tache/${tache.id}`}
        style={{ flex: 1, minWidth: 0, color: 'inherit' }}
      >
        <div className="task-title">{tache.titre}</div>
        {echeance && (
          <div style={{ marginTop: 5 }}>
            <span className={`tag tag-date ${echeance.late ? 'late' : ''}`}>{echeance.texte}</span>
          </div>
        )}
      </Link>
    </div>
  );
}

function ProjetAccordeon({
  groupe,
  onCloturer,
}: {
  groupe: Groupe;
  onCloturer: (t: Tache) => void;
}) {
  const [ouvert, setOuvert] = useState(true);
  return (
    <div className="proj-acc">
      <button className="proj-acc-head" onClick={() => setOuvert(o => !o)}>
        <div className="proj-chip" style={{ background: groupe.couleur }}>
          {groupe.icone ? (
            <span style={{ fontSize: 16 }}>{groupe.icone}</span>
          ) : (
            <Icon name="folder" />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div className="proj-name">{groupe.nom}</div>
          <div className="proj-sub">
            {groupe.taches.length} tâche{groupe.taches.length > 1 ? 's' : ''}
            {groupe.retards > 0 && (
              <>
                {' · '}
                <span className="late">{groupe.retards} en retard</span>
              </>
            )}
          </div>
        </div>
        <Icon name="chevron_right" className={`proj-chevron ${ouvert ? 'open' : ''}`} />
      </button>
      {ouvert && (
        <div className="proj-body">
          {groupe.taches.map(t => (
            <LigneTache key={t.id} tache={t} onCloturer={onCloturer} />
          ))}
        </div>
      )}
    </div>
  );
}

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

  const pertinentes = [...retards, ...dueAujourdHui];
  const groupes = grouperParProjet(pertinentes);

  const date = new Date()
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();
  const prenom = prefsData?.preferences?.prenom;

  return (
    <main className="screen with-hero">
      <div className="hero">
        <Link href="/parametres" aria-label="Paramètres" className="hero-gear">
          <Icon name="settings" size={22} />
        </Link>
        <div className="hero-date">{date}</div>
        <div className="hero-greeting">
          Bonjour,
          <br />
          {prenom ?? 'à vous'}
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--red)' }}>
            {retards.length}
          </div>
          <div className="stat-label">En retard</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--primary)' }}>
            {dueAujourdHui.length}
          </div>
          <div className="stat-label">Aujourd&apos;hui</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--green)' }}>
            {pertinentes.length}
          </div>
          <div className="stat-label">À faire</div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {isLoading && <div className="empty-state">Chargement…</div>}
        {!isLoading && pertinentes.length === 0 && (
          <div className="empty-state">
            Rien d&apos;urgent aujourd&apos;hui 🎉 — consultez le <Link href="/backlog">backlog</Link>.
          </div>
        )}
        {groupes.map(g => (
          <ProjetAccordeon key={g.id} groupe={g} onCloturer={cloturer} />
        ))}
      </div>
    </main>
  );
}
