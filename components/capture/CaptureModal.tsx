'use client';

import { useState } from 'react';
import { appeler } from '@/lib/fetcher';
import type { Projet } from '@/types/projet';
import type { PrioriteTache } from '@/types/tache';

interface Props {
  projets: Projet[];
  onClose: () => void;
  onCreee: () => void;
}

// Capture rapide (cadrage §3) — titre obligatoire, le reste optionnel.
// La tâche atterrit en "à qualifier" ; la saisie vocale arrive en tranche ②.
export function CaptureModal({ projets, onClose, onCreee }: Props) {
  const [titre, setTitre] = useState('');
  const [projetId, setProjetId] = useState('');
  const [priorite, setPriorite] = useState<PrioriteTache>('moyenne');
  const [echeance, setEcheance] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  async function creer() {
    if (!titre.trim() || enCours) return;
    setEnCours(true);
    setErreur('');
    try {
      await appeler('/api/taches', 'POST', {
        titre,
        projet_id: projetId || null,
        priorite,
        date_echeance: echeance ? new Date(`${echeance}T18:00:00`).toISOString() : null,
      });
      onCreee();
      onClose();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Sauvegarde échouée');
      setEnCours(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Nouvelle tâche</h2>
        {erreur && <div className="form-error">{erreur}</div>}
        <input
          autoFocus
          placeholder="Qu'est-ce qu'il ne faut pas oublier ?"
          value={titre}
          onChange={e => setTitre(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && creer()}
        />
        <div className="row-2">
          <select value={projetId} onChange={e => setProjetId(e.target.value)}>
            <option value="">Sans projet</option>
            {projets.map(p => (
              <option key={p.id} value={p.id}>
                {p.icone ? `${p.icone} ` : ''}
                {p.nom}
              </option>
            ))}
          </select>
          <select value={priorite} onChange={e => setPriorite(e.target.value as PrioriteTache)}>
            <option value="haute">🔴 Haute</option>
            <option value="moyenne">🟠 Moyenne</option>
            <option value="basse">🔵 Basse</option>
            <option value="aucune">Aucune</option>
          </select>
        </div>
        <div className="field">
          <label>Échéance (optionnelle)</label>
          <input type="date" value={echeance} onChange={e => setEcheance(e.target.value)} />
        </div>
        <button className="btn" onClick={creer} disabled={!titre.trim() || enCours}>
          {enCours ? 'Enregistrement…' : 'Capturer'}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          Annuler
        </button>
      </div>
    </div>
  );
}
