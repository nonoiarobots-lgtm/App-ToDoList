'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { appeler } from '@/lib/fetcher';
import { Icon } from '@/components/ui/Icon';
import type { Tache, PrioriteTache, StatutTache } from '@/types/tache';
import type { Projet } from '@/types/projet';

// Détail / édition d'une tâche — sert aussi de qualification basique :
// valider une tâche "à qualifier" la passe en "active".
export default function TacheDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useSWR<{ tache: Tache }>(`/api/taches/${id}`);
  const { data: projetsData } = useSWR<{ projets: Projet[] }>('/api/projets');

  if (isLoading) return <main className="screen empty-state">Chargement…</main>;
  if (!data?.tache) return <main className="screen empty-state">Tâche introuvable.</main>;

  // key force la réinitialisation du formulaire si la tâche change
  return <FormulaireTache key={data.tache.id} tache={data.tache} projets={projetsData?.projets ?? []} />;
}

function FormulaireTache({ tache, projets }: { tache: Tache; projets: Projet[] }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const [titre, setTitre] = useState(tache.titre);
  const [projetId, setProjetId] = useState(tache.projet_id ?? '');
  const [priorite, setPriorite] = useState<PrioriteTache>(tache.priorite);
  const [statut, setStatut] = useState<StatutTache>(tache.statut);
  const [echeance, setEcheance] = useState(tache.date_echeance ? tache.date_echeance.slice(0, 10) : '');
  const [responsable, setResponsable] = useState(tache.responsable);
  const [avancement, setAvancement] = useState(tache.avancement);
  const [notes, setNotes] = useState(tache.notes ?? '');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(statutForce?: StatutTache) {
    if (!titre.trim() || enCours) return;
    setEnCours(true);
    setErreur('');
    try {
      await appeler(`/api/taches/${tache.id}`, 'PATCH', {
        titre,
        projet_id: projetId || null,
        priorite,
        statut: statutForce ?? statut,
        date_echeance: echeance ? new Date(`${echeance}T18:00:00`).toISOString() : null,
        responsable: responsable.trim() || 'Moi',
        avancement,
        notes: notes.trim() || null,
      });
      mutate(key => typeof key === 'string' && key.startsWith('/api/taches'));
      router.push('/backlog');
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Sauvegarde échouée');
      setEnCours(false);
    }
  }

  async function supprimer() {
    if (!confirm('Supprimer définitivement cette tâche ?')) return;
    await appeler(`/api/taches/${tache.id}`, 'DELETE');
    mutate(key => typeof key === 'string' && key.startsWith('/api/taches'));
    router.push('/backlog');
  }

  return (
    <main className="screen">
      <div className="screen-header">
        <h1 className="screen-title">{tache.statut === 'a_qualifier' ? 'Qualifier' : 'Détail'}</h1>
        <button
          className="btn-ghost"
          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          onClick={() => router.back()}
        >
          <Icon name="close" size={18} /> Fermer
        </button>
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
        <div className="row-2">
          <div className="field">
            <label>Échéance</label>
            <input type="date" value={echeance} onChange={e => setEcheance(e.target.value)} />
          </div>
          <div className="field">
            <label>Statut</label>
            <select value={statut} onChange={e => setStatut(e.target.value as StatutTache)}>
              <option value="a_qualifier">⚡ À qualifier</option>
              <option value="active">Active</option>
              <option value="en_retard">En retard</option>
              <option value="en_attente_retour">⏳ En attente de retour</option>
              <option value="archivee">Archivée</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Responsable</label>
          <input value={responsable} onChange={e => setResponsable(e.target.value)} />
        </div>
        <div className="field">
          <label>Avancement — {avancement}%</label>
          <div className="row-2" style={{ alignItems: 'center' }}>
            {[0, 25, 50, 75, 100].map(v => (
              <button
                key={v}
                className={`filter-chip ${avancement === v ? 'active' : ''}`}
                onClick={() => setAvancement(v)}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      {tache.statut === 'a_qualifier' ? (
        <button className="btn" onClick={() => enregistrer('active')} disabled={enCours}>
          {enCours ? 'Enregistrement…' : 'Valider la qualification'}
        </button>
      ) : (
        <button className="btn" onClick={() => enregistrer()} disabled={enCours}>
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      )}
      <div style={{ height: 10 }} />
      <button
        className="btn btn-secondary"
        onClick={() => enregistrer('archivee')}
        disabled={enCours}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Icon name="check_circle" size={18} /> Terminer la tâche
      </button>
      <div style={{ height: 10 }} />
      <button className="btn btn-danger" onClick={supprimer} disabled={enCours}>
        Supprimer
      </button>
    </main>
  );
}
