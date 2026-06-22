'use client';

import { useRef, useState } from 'react';
import { appeler } from '@/lib/fetcher';
import { estQualifiable } from '@/lib/logique-taches';
import { Icon } from '@/components/ui/Icon';
import { DicteeIA } from './DicteeIA';
import type { Projet } from '@/types/projet';
import type { PrioriteTache } from '@/types/tache';

interface Props {
  projets: Projet[];
  onClose: () => void;
  onCreee: () => void;
}

// Capture rapide (cadrage §3) — titre obligatoire, le reste optionnel.
// "Capturer et continuer" enchaîne plusieurs saisies sans rouvrir la modale (besoin point 1).
// Si projet + échéance + priorité sont renseignés, la tâche part directement "active" (besoin point 2).
export function CaptureModal({ projets, onClose, onCreee }: Props) {
  const [titre, setTitre] = useState('');
  const [projetId, setProjetId] = useState('');
  const [priorite, setPriorite] = useState<PrioriteTache>('moyenne');
  const [echeance, setEcheance] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');
  const [nbAjoutees, setNbAjoutees] = useState(0);
  const [mode, setMode] = useState<'manuel' | 'dictee'>('manuel');
  const titreRef = useRef<HTMLInputElement>(null);

  const echeanceIso = echeance ? new Date(`${echeance}T18:00:00`).toISOString() : null;
  const seraQualifiee = estQualifiable({ projet_id: projetId || null, date_echeance: echeanceIso, priorite });

  async function creer(continuer: boolean) {
    if (!titre.trim() || enCours) return;
    setEnCours(true);
    setErreur('');
    try {
      await appeler('/api/taches', 'POST', {
        titre,
        projet_id: projetId || null,
        priorite,
        date_echeance: echeanceIso,
      });
      onCreee();
      if (continuer) {
        // On garde projet + priorité (souvent identiques d'une tâche à l'autre), on vide le reste
        setTitre('');
        setEcheance('');
        setNbAjoutees(n => n + 1);
        setEnCours(false);
        titreRef.current?.focus();
      } else {
        onClose();
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Sauvegarde échouée');
      setEnCours(false);
    }
  }

  if (mode === 'dictee') {
    return (
      <DicteeIA
        projets={projets}
        onCreees={onCreee}
        onClose={onClose}
        onRetour={() => setMode('manuel')}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Nouvelle tâche</h2>
        {nbAjoutees > 0 && (
          <div className="form-info">
            {nbAjoutees} tâche{nbAjoutees > 1 ? 's' : ''} ajoutée{nbAjoutees > 1 ? 's' : ''} ✓
          </div>
        )}
        {erreur && <div className="form-error">{erreur}</div>}
        <input
          ref={titreRef}
          autoFocus
          placeholder="Qu'est-ce qu'il ne faut pas oublier ?"
          value={titre}
          onChange={e => setTitre(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && creer(false)}
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
        {seraQualifiee && (
          <div className="hint-qualifiee">✓ Tous les champs sont remplis — sera enregistrée « qualifiée »</div>
        )}
        <button className="btn" onClick={() => creer(false)} disabled={!titre.trim() || enCours}>
          {enCours ? 'Enregistrement…' : 'Capturer et fermer'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => creer(true)}
          disabled={!titre.trim() || enCours}
        >
          + Capturer et continuer
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => setMode('dictee')}
          disabled={enCours}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Icon name="mic" size={18} /> Dicter plusieurs tâches (IA)
        </button>
        <button className="btn btn-ghost" onClick={onClose}>
          {nbAjoutees > 0 ? 'Terminé' : 'Annuler'}
        </button>
      </div>
    </div>
  );
}
