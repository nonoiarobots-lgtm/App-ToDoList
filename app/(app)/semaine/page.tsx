'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { bornesSemaine, etatCraJour, isoLocal, listerJours, formatHeures } from '@/lib/logique-cra';
import type { Tache } from '@/types/tache';
import type { Projet } from '@/types/projet';

interface ResumeCra {
  par_jour: Record<string, number>;
  cible_jour_min: number;
}

const JOURS_NOMS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function decalerSemaine(dateISO: string, deltaSemaines: number): string {
  const d = new Date(`${dateISO}T12:00:00`);
  d.setDate(d.getDate() + deltaSemaines * 7);
  return isoLocal(d);
}
function libelleCourt(dateISO: string): string {
  return new Date(`${dateISO}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function SemainePage() {
  const [ancre, setAncre] = useState(() => isoLocal(new Date()));
  const { from, to } = bornesSemaine(ancre);
  const jours = listerJours(from, to);
  const aujourdHui = isoLocal(new Date());

  const { data: tachesData } = useSWR<{ taches: Tache[] }>(`/api/taches/semaine?from=${from}&to=${to}`);
  const { data: projetsData } = useSWR<{ projets: Projet[] }>('/api/projets');
  const { data: resume } = useSWR<ResumeCra>(`/api/cra/resume?from=${from}&to=${to}`);

  const [cellule, setCellule] = useState<{ projetKey: string; jour: string } | null>(null);

  const taches = tachesData?.taches ?? [];
  const projets = projetsData?.projets ?? [];
  const cibleJour = resume?.cible_jour_min ?? 450;
  const parJour = resume?.par_jour ?? {};

  // Lignes = projets utilisés cette semaine + "Sans projet" si nécessaire
  const jourDe = (t: Tache) => (t.date_echeance ? isoLocal(new Date(t.date_echeance)) : '');
  const projetKeyDe = (t: Tache) => t.projet_id ?? 'sans-projet';

  const clesUtilisees = new Set(taches.map(projetKeyDe));
  const lignes: { key: string; nom: string; couleur: string | null; icone: string | null }[] = [];
  for (const p of projets) {
    if (clesUtilisees.has(p.id)) lignes.push({ key: p.id, nom: p.nom, couleur: p.couleur, icone: p.icone });
  }
  if (clesUtilisees.has('sans-projet'))
    lignes.push({ key: 'sans-projet', nom: 'Sans projet', couleur: null, icone: null });

  const compter = (projetKey: string, jour: string) =>
    taches.filter(t => projetKeyDe(t) === projetKey && jourDe(t) === jour).length;

  const tachesCellule = cellule
    ? taches.filter(t => projetKeyDe(t) === cellule.projetKey && jourDe(t) === cellule.jour)
    : [];

  return (
    <main className="screen">
      <div className="screen-header">
        <h1 className="screen-title">Semaine</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-dim)' }}>
          <button className="cra-nav-btn" style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', fontSize: 18 }} onClick={() => setAncre(decalerSemaine(ancre, -1))}>
            ‹
          </button>
          <span>
            {libelleCourt(from)} – {libelleCourt(to)}
          </span>
          <button style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', fontSize: 18 }} onClick={() => setAncre(decalerSemaine(ancre, 1))}>
            ›
          </button>
        </div>
      </div>

      <div className="sem-legende">
        <span><span className="sem-pastille sem-pastille-vert" style={{ margin: 0 }} /> CRA complet</span>
        <span><span className="sem-pastille sem-pastille-orange" style={{ margin: 0 }} /> partiel</span>
        <span><span className="sem-pastille sem-pastille-vide" style={{ margin: 0 }} /> vide</span>
      </div>

      <div className="sem-scroll">
        <table className="sem-table">
          <thead>
            <tr>
              <th className="sem-proj">Projet</th>
              {jours.map((j, i) => {
                const etat = etatCraJour(parJour[j] ?? 0, cibleJour);
                const classePastille =
                  etat === 'complet' ? 'sem-pastille-vert' : etat === 'partiel' ? 'sem-pastille-orange' : 'sem-pastille-vide';
                return (
                  <th key={j}>
                    <div className={`sem-jour-nom ${j === aujourdHui ? 'today' : ''}`}>{JOURS_NOMS[i]}</div>
                    <div className="sem-jour-num">{new Date(`${j}T12:00:00`).getDate()}</div>
                    <div className={`sem-pastille ${classePastille}`} title={formatHeures(parJour[j] ?? 0)} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 && (
              <tr>
                <td colSpan={8} style={{ color: 'var(--text-muted)', padding: 24 }}>
                  Aucune tâche planifiée cette semaine.
                </td>
              </tr>
            )}
            {lignes.map(l => (
              <tr key={l.key}>
                <th className="sem-proj">
                  {l.couleur && <span className="cra-pastille" style={{ background: l.couleur, marginRight: 6 }} />}
                  {l.icone ? `${l.icone} ` : ''}
                  {l.nom}
                </th>
                {jours.map(j => {
                  const n = compter(l.key, j);
                  return (
                    <td
                      key={j}
                      className={`sem-cell ${n > 0 ? 'pleine' : 'vide'}`}
                      onClick={() => n > 0 && setCellule({ projetKey: l.key, jour: j })}
                    >
                      {n > 0 ? n : '·'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cellule && (
        <div className="modal-overlay" onClick={() => setCellule(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>
              {lignes.find(l => l.key === cellule.projetKey)?.nom} — {libelleCourt(cellule.jour)}
            </h2>
            <div className="task-list">
              {tachesCellule.map(t => (
                <Link key={t.id} href={`/tache/${t.id}`} className="cra-activite" style={{ display: 'block' }}>
                  <div className="cra-activite-haut">
                    <span>{t.titre}</span>
                  </div>
                </Link>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={() => setCellule(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
