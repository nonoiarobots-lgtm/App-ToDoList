'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { appeler } from '@/lib/fetcher';
import { Icon } from '@/components/ui/Icon';
import type { ReponseListeTaches } from '@/types/api';
import type { Tache, PrioriteTache } from '@/types/tache';
import type { Projet } from '@/types/projet';

// Qualification enchaînée (besoin point 4) : on parcourt une à une les tâches "à qualifier"
// sans revenir au backlog entre chaque. On fige la file au montage pour que l'index reste
// stable même si la liste serveur se vide au fil des validations.
export default function QualifierPage() {
  const { data, isLoading } = useSWR<ReponseListeTaches>('/api/taches?statut=a_qualifier');
  const { data: projetsData } = useSWR<{ projets: Projet[] }>('/api/projets');

  if (isLoading || !data) return <main className="screen empty-state">Chargement…</main>;

  // Le Wizard fige la file à son montage (useState initializer) : l'index reste stable
  // même quand la liste serveur se vide au fil des validations.
  return <Wizard initial={data.data} projets={projetsData?.projets ?? []} />;
}

function Wizard({ initial, projets }: { initial: Tache[]; projets: Projet[] }) {
  const router = useRouter();
  const [file] = useState(initial);
  const [index, setIndex] = useState(0);

  if (file.length === 0) return <main className="screen empty-state">Tout est qualifié 🎉</main>;

  if (index >= file.length) {
    return (
      <main className="screen">
        <div className="empty-state">
          ✅ Qualification terminée — {file.length} tâche{file.length > 1 ? 's' : ''} passée
          {file.length > 1 ? 's' : ''} en revue.
          <div style={{ height: 16 }} />
          <button className="btn" onClick={() => router.push('/backlog')}>
            Voir le backlog
          </button>
        </div>
      </main>
    );
  }

  const tache = file[index];
  return (
    <FicheQualif
      key={tache.id}
      tache={tache}
      projets={projets}
      position={index + 1}
      total={file.length}
      onTermine={() => setIndex(i => i + 1)}
    />
  );
}

interface FicheProps {
  tache: Tache;
  projets: Projet[];
  position: number;
  total: number;
  onTermine: () => void;
}

function FicheQualif({ tache, projets, position, total, onTermine }: FicheProps) {
  const { mutate } = useSWRConfig();
  const [titre, setTitre] = useState(tache.titre);
  const [projetId, setProjetId] = useState(tache.projet_id ?? '');
  const [priorite, setPriorite] = useState<PrioriteTache>(tache.priorite);
  const [echeance, setEcheance] = useState(tache.date_echeance ? tache.date_echeance.slice(0, 10) : '');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  async function valider() {
    if (!titre.trim() || enCours) return;
    setEnCours(true);
    setErreur('');
    try {
      await appeler(`/api/taches/${tache.id}`, 'PATCH', {
        titre,
        projet_id: projetId || null,
        priorite,
        date_echeance: echeance ? new Date(`${echeance}T18:00:00`).toISOString() : null,
        statut: 'active',
      });
      mutate(key => typeof key === 'string' && key.startsWith('/api/taches'));
      onTermine();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Sauvegarde échouée');
      setEnCours(false);
    }
  }

  return (
    <main className="screen">
      <div className="screen-header">
        <h1 className="screen-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon name="auto_awesome" style={{ color: 'var(--primary)' }} /> Qualifier
        </h1>
        <span className="screen-count">
          {position} / {total}
        </span>
      </div>
      <div className="wizard-progress">
        <span style={{ width: `${(position / total) * 100}%` }} />
      </div>

      {erreur && <div className="form-error">{erreur}</div>}

      <div className="settings-section">
        <div className="field">
          <label>Titre</label>
          <input value={titre} onChange={e => setTitre(e.target.value)} />
        </div>
        <div className="row-2">
          <div className="field">
            <label>Projet</label>
            <select value={projetId} onChange={e => setProjetId(e.target.value)}>
              <option value="">Sans projet</option>
              {projets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.icone ? `${p.icone} ` : ''}
                  {p.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Priorité</label>
            <select value={priorite} onChange={e => setPriorite(e.target.value as PrioriteTache)}>
              <option value="haute">🔴 Haute</option>
              <option value="moyenne">🟠 Moyenne</option>
              <option value="basse">🔵 Basse</option>
              <option value="aucune">Aucune</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Échéance</label>
          <input type="date" value={echeance} onChange={e => setEcheance(e.target.value)} />
        </div>
      </div>

      <button className="btn" onClick={valider} disabled={!titre.trim() || enCours}>
        {enCours ? 'Enregistrement…' : position < total ? 'Valider et suivante →' : 'Valider et terminer'}
      </button>
      <div style={{ height: 10 }} />
      <button className="btn btn-ghost" onClick={onTermine} disabled={enCours}>
        Passer
      </button>
    </main>
  );
}
