'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  bornesMois,
  bornesSemaine,
  decompteMin,
  formatHeures,
  isoLocal,
  pourcent,
} from '@/lib/logique-cra';

interface LigneType {
  id: string;
  nom: string;
  total_min: number;
}
interface LigneProjet {
  projet_id: string;
  nom: string;
  couleur: string | null;
  icone: string | null;
  total_min: number;
}
interface LigneExport {
  date: string;
  type: string;
  projet: string;
  duree_min: number;
  commentaire: string;
}
interface Resume {
  from: string;
  to: string;
  total_min: number;
  cible_periode_min: number;
  jours_saisis: number;
  par_type: LigneType[];
  par_projet: LigneProjet[];
  lignes: LigneExport[];
}

type Mode = 'semaine' | 'mois';

function decaler(mode: Mode, dateISO: string, delta: number): string {
  const d = new Date(`${dateISO}T12:00:00`);
  if (mode === 'semaine') d.setDate(d.getDate() + delta * 7);
  else d.setMonth(d.getMonth() + delta);
  return isoLocal(d);
}
function libelle(mode: Mode, from: string, to: string): string {
  if (mode === 'mois')
    return new Date(`${from}T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const opt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${new Date(`${from}T12:00:00`).toLocaleDateString('fr-FR', opt)} – ${new Date(`${to}T12:00:00`).toLocaleDateString('fr-FR', opt)}`;
}

function exporterCsv(resume: Resume) {
  const entete = ['Date', 'Type', 'Projet', 'Heures', 'Commentaire'];
  const lignes = resume.lignes.map(l => [
    l.date,
    l.type,
    l.projet,
    (l.duree_min / 60).toString().replace('.', ','),
    l.commentaire.replace(/"/g, '""'),
  ]);
  const csv = [entete, ...lignes].map(r => r.map(c => `"${c}"`).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cra_${resume.from}_${resume.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RestitutionPage() {
  const [mode, setMode] = useState<Mode>('semaine');
  const [ancre, setAncre] = useState(() => isoLocal(new Date()));

  const { from, to } = mode === 'semaine' ? bornesSemaine(ancre) : bornesMois(ancre);
  const { data } = useSWR<Resume>(`/api/cra/resume?from=${from}&to=${to}`);

  const total = data?.total_min ?? 0;
  const cible = data?.cible_periode_min ?? 0;
  const reste = decompteMin(total, cible);

  return (
    <main className="screen">
      <div className="screen-header">
        <h1 className="screen-title">Restitution CRA</h1>
        <div className="resto-toggle">
          <button className={mode === 'semaine' ? 'active' : ''} onClick={() => setMode('semaine')}>
            Semaine
          </button>
          <button className={mode === 'mois' ? 'active' : ''} onClick={() => setMode('mois')}>
            Mois
          </button>
        </div>
      </div>

      <div className="cra-datenav">
        <button aria-label="Période précédente" onClick={() => setAncre(decaler(mode, ancre, -1))}>
          ‹
        </button>
        <span className="cra-date">{libelle(mode, from, to)}</span>
        <button aria-label="Période suivante" onClick={() => setAncre(decaler(mode, ancre, 1))}>
          ›
        </button>
      </div>

      <div className="cra-decompte" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 500 }}>
          {formatHeures(total)}{' '}
          <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 400 }}>
            / {formatHeures(cible)}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
          {data?.jours_saisis ?? 0} jour{(data?.jours_saisis ?? 0) > 1 ? 's' : ''} saisi
          {(data?.jours_saisis ?? 0) > 1 ? 's' : ''} ·{' '}
          {reste >= 0 ? `${formatHeures(reste)} restant` : `${formatHeures(-reste)} en trop`}
        </div>
      </div>

      <div className="section-title">
        <span>Par type d&apos;activité</span>
      </div>
      {(data?.par_type ?? []).length === 0 && (
        <div className="empty-state">Aucune activité sur la période.</div>
      )}
      {(data?.par_type ?? []).map(t => (
        <div key={t.id} className="resto-ligne">
          <div className="resto-ligne-haut">
            <span>{t.nom}</span>
            <span className="val">
              {formatHeures(t.total_min)} · {pourcent(t.total_min, total)}%
            </span>
          </div>
          <div className="resto-bar">
            <span style={{ width: `${pourcent(t.total_min, total)}%` }} />
          </div>
        </div>
      ))}

      {(data?.par_projet ?? []).length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 16 }}>
            <span>Par projet</span>
          </div>
          {(data?.par_projet ?? []).map(p => (
            <div key={p.projet_id} className="resto-ligne-haut" style={{ padding: '4px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  className="cra-pastille"
                  style={{ background: p.couleur ?? 'var(--text-muted)' }}
                />
                {p.icone ? `${p.icone} ` : ''}
                {p.nom}
              </span>
              <span className="val">
                {formatHeures(p.total_min)} · {pourcent(p.total_min, total)}%
              </span>
            </div>
          ))}
        </>
      )}

      <div style={{ height: 16 }} />
      <button
        className="btn btn-secondary"
        onClick={() => data && exporterCsv(data)}
        disabled={!data || data.lignes.length === 0}
      >
        Exporter (CSV)
      </button>
      <div style={{ height: 10 }} />
      <Link href="/cra" className="btn btn-ghost" style={{ textAlign: 'center' }}>
        ← Retour à la saisie
      </Link>
    </main>
  );
}
