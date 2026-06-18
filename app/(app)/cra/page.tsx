'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR, { useSWRConfig } from 'swr';
import { appeler } from '@/lib/fetcher';
import { formatHeures, heuresEnMinutes, estDureeValide, minutesEnHeures } from '@/lib/logique-cra';
import type { Activite, TypeActivite } from '@/types/activite';
import type { Projet } from '@/types/projet';

interface ReponseActivites {
  activites: Activite[];
  total_min: number;
  cible_min: number;
  decompte_min: number;
}

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function decalerJour(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return isoLocal(d);
}
function libelleDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function CraPage() {
  const [date, setDate] = useState(() => isoLocal(new Date()));
  const [modale, setModale] = useState<{ ouvert: boolean; activite?: Activite }>({ ouvert: false });

  const { data } = useSWR<ReponseActivites>(`/api/activites?date=${date}`);
  const { data: typesData } = useSWR<{ types: TypeActivite[] }>('/api/types-activite');
  const { data: projetsData } = useSWR<{ projets: Projet[] }>('/api/projets');

  const activites = data?.activites ?? [];
  const cible = data?.cible_min ?? 450;
  const total = data?.total_min ?? 0;
  const decompte = data?.decompte_min ?? cible;
  const pourcent = cible > 0 ? Math.min(100, Math.round((total / cible) * 100)) : 0;
  const couleurDecompte = decompte > 0 ? 'var(--orange)' : decompte < 0 ? 'var(--red)' : 'var(--green)';
  const estAujourdhui = date === isoLocal(new Date());

  return (
    <main className="screen">
      <div className="screen-header">
        <h1 className="screen-title">Compte-rendu</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!estAujourdhui && (
            <button className="screen-count" style={{ cursor: 'pointer' }} onClick={() => setDate(isoLocal(new Date()))}>
              Aujourd&apos;hui
            </button>
          )}
          <Link href="/cra/restitution" style={{ fontSize: 13, color: 'var(--accent)' }}>
            📊 Restitution
          </Link>
        </div>
      </div>

      <div className="cra-datenav">
        <button aria-label="Jour précédent" onClick={() => setDate(decalerJour(date, -1))}>
          ‹
        </button>
        <span className="cra-date">{libelleDate(date)}</span>
        <button aria-label="Jour suivant" onClick={() => setDate(decalerJour(date, 1))}>
          ›
        </button>
      </div>

      <div className="cra-decompte">
        <div className="cra-decompte-haut">
          <span className="cra-decompte-saisi">
            Saisi : {formatHeures(total)} / {formatHeures(cible)}
          </span>
          <span className="cra-decompte-valeur" style={{ color: couleurDecompte }}>
            {formatHeures(decompte)}
            <small> {decompte >= 0 ? 'restant' : 'en trop'}</small>
          </span>
        </div>
        <div className="cra-jauge">
          <span style={{ width: `${pourcent}%`, background: decompte < 0 ? 'var(--red)' : 'var(--accent)' }} />
        </div>
      </div>

      {activites.length === 0 && (
        <div className="empty-state">Aucune activité ce jour. Appuie sur + pour en ajouter.</div>
      )}

      <div className="task-list">
        {activites.map(a => (
          <div key={a.id} className="cra-activite" onClick={() => setModale({ ouvert: true, activite: a })}>
            <div className="cra-activite-haut">
              <span className="cra-badge-type">{a.type_activite?.nom ?? 'Sans type'}</span>
              <span className="cra-activite-duree">{formatHeures(a.duree_min)}</span>
            </div>
            <div className="cra-activite-bas">
              {a.projet?.couleur && <span className="cra-pastille" style={{ background: a.projet.couleur }} />}
              <span>
                {a.projet ? `${a.projet.icone ? `${a.projet.icone} ` : ''}${a.projet.nom}` : 'Sans projet'}
              </span>
              {a.commentaire && <span>· {a.commentaire}</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 12 }} />
      <button className="btn" onClick={() => setModale({ ouvert: true })}>
        + Ajouter une activité
      </button>

      {modale.ouvert && (
        <ModaleActivite
          date={date}
          activite={modale.activite}
          types={typesData?.types ?? []}
          projets={projetsData?.projets ?? []}
          onClose={() => setModale({ ouvert: false })}
        />
      )}
    </main>
  );
}

interface ModaleProps {
  date: string;
  activite?: Activite;
  types: TypeActivite[];
  projets: Projet[];
  onClose: () => void;
}

function ModaleActivite({ date, activite, types, projets, onClose }: ModaleProps) {
  const { mutate } = useSWRConfig();
  const [typeId, setTypeId] = useState(activite?.type_activite_id ?? '');
  const [projetId, setProjetId] = useState(activite?.projet_id ?? '');
  const [heures, setHeures] = useState(activite ? minutesEnHeures(activite.duree_min) : 1);
  const [commentaire, setCommentaire] = useState(activite?.commentaire ?? '');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  function rafraichir() {
    mutate(key => typeof key === 'string' && key.startsWith('/api/activites'));
  }

  async function enregistrer() {
    if (enCours) return;
    if (!estDureeValide(heures)) {
      setErreur('La durée doit être un multiple d’un quart d’heure (ex. 0,25 / 0,5 / 1,25).');
      return;
    }
    setEnCours(true);
    setErreur('');
    const corps = {
      date_activite: date,
      type_activite_id: typeId || null,
      projet_id: projetId || null,
      duree_min: heuresEnMinutes(heures),
      commentaire: commentaire.trim() || null,
    };
    try {
      if (activite) await appeler(`/api/activites/${activite.id}`, 'PATCH', corps);
      else await appeler('/api/activites', 'POST', corps);
      rafraichir();
      onClose();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Sauvegarde échouée');
      setEnCours(false);
    }
  }

  async function supprimer() {
    if (!activite || !confirm('Supprimer cette activité ?')) return;
    await appeler(`/api/activites/${activite.id}`, 'DELETE');
    rafraichir();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{activite ? 'Modifier l’activité' : 'Nouvelle activité'}</h2>
        {erreur && <div className="form-error">{erreur}</div>}

        <div className="field">
          <label>Type d’activité</label>
          <select value={typeId} onChange={e => setTypeId(e.target.value)}>
            <option value="">Sans type</option>
            {types.map(t => (
              <option key={t.id} value={t.id}>
                {t.nom}
              </option>
            ))}
          </select>
        </div>
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
          <label>Durée — {formatHeures(heuresEnMinutes(heures))}</label>
          <div className="row-2" style={{ alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setHeures(h => Math.max(0.25, Math.round((h - 0.25) * 4) / 4))}
            >
              − ¼ h
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setHeures(h => Math.round((h + 0.25) * 4) / 4)}
            >
              + ¼ h
            </button>
          </div>
          <input
            type="number"
            step="0.25"
            min="0.25"
            value={heures}
            onChange={e => setHeures(Number(e.target.value))}
            style={{ marginTop: 8 }}
          />
        </div>
        <div className="field">
          <label>Commentaire (optionnel)</label>
          <textarea rows={2} value={commentaire} onChange={e => setCommentaire(e.target.value)} />
        </div>

        <button className="btn" onClick={enregistrer} disabled={enCours}>
          {enCours ? 'Enregistrement…' : activite ? 'Enregistrer' : 'Ajouter'}
        </button>
        {activite && (
          <button className="btn btn-danger" onClick={supprimer} disabled={enCours}>
            Supprimer
          </button>
        )}
        <button className="btn btn-ghost" onClick={onClose}>
          Annuler
        </button>
      </div>
    </div>
  );
}
