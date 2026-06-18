'use client';

import { useRef, useState } from 'react';
import { appeler } from '@/lib/fetcher';
import type { Projet } from '@/types/projet';
import type { PrioriteTache, TacheIA } from '@/types/tache';

interface Props {
  projets: Projet[];
  onCreees: () => void;
  onClose: () => void;
  onRetour: () => void;
}

// Web Speech API — types minimaux (absents de lib.dom).
interface ResultatVocal {
  0: { transcript: string };
  isFinal: boolean;
}
interface EventVocal {
  results: ArrayLike<ResultatVocal>;
  resultIndex: number;
}
interface ReconnaissanceVocale {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: EventVocal) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type ConstructeurVocal = new () => ReconnaissanceVocale;

function getConstructeurVocal(): ConstructeurVocal | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: ConstructeurVocal;
    webkitSpeechRecognition?: ConstructeurVocal;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Ligne {
  titre: string;
  projetId: string;
  priorite: PrioriteTache;
  echeance: string;
  ia: boolean;
  incertain: boolean;
}

function tacheVersLigne(t: TacheIA): Ligne {
  return {
    titre: t.titre,
    projetId: t.projet_id ?? '',
    priorite: t.priorite,
    echeance: t.date_echeance ? t.date_echeance.slice(0, 10) : '',
    ia: true,
    incertain: t.projet_incertain,
  };
}

export function DicteeIA({ projets, onCreees, onClose, onRetour }: Props) {
  const [texte, setTexte] = useState('');
  const [ecoute, setEcoute] = useState(false);
  const [analyse, setAnalyse] = useState(false);
  const [enregistre, setEnregistre] = useState(false);
  const [erreur, setErreur] = useState('');
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const reconnaissanceRef = useRef<ReconnaissanceVocale | null>(null);
  const [micDispo] = useState(() => getConstructeurVocal() !== null);

  function basculerMicro() {
    if (ecoute) {
      reconnaissanceRef.current?.stop();
      return;
    }
    const Ctor = getConstructeurVocal();
    if (!Ctor) return;
    const reco = new Ctor();
    reco.lang = 'fr-FR';
    reco.continuous = true;
    reco.interimResults = false;
    reco.onresult = e => {
      let ajout = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) ajout += e.results[i][0].transcript;
      }
      if (ajout) setTexte(t => (t ? `${t} ${ajout}` : ajout));
    };
    reco.onend = () => setEcoute(false);
    reco.onerror = () => setEcoute(false);
    reconnaissanceRef.current = reco;
    reco.start();
    setEcoute(true);
  }

  async function analyser() {
    if (!texte.trim() || analyse) return;
    reconnaissanceRef.current?.stop();
    setAnalyse(true);
    setErreur('');
    try {
      const res = await appeler<{ taches: TacheIA[] }>('/api/capture/ia', 'POST', { texte });
      if (res.taches.length === 0) {
        setErreur('Aucune tâche détectée. Reformule ou ajoute des détails.');
      } else {
        setLignes(res.taches.map(tacheVersLigne));
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Analyse impossible');
    } finally {
      setAnalyse(false);
    }
  }

  function majLigne(index: number, champ: Partial<Ligne>) {
    setLignes(ls => (ls ? ls.map((l, i) => (i === index ? { ...l, ...champ } : l)) : ls));
  }
  function retirerLigne(index: number) {
    setLignes(ls => (ls ? ls.filter((_, i) => i !== index) : ls));
  }

  async function toutAjouter() {
    if (!lignes || lignes.length === 0 || enregistre) return;
    setEnregistre(true);
    setErreur('');
    try {
      for (const l of lignes) {
        if (!l.titre.trim()) continue;
        await appeler('/api/taches', 'POST', {
          titre: l.titre,
          projet_id: l.projetId || null,
          priorite: l.priorite,
          date_echeance: l.echeance ? new Date(`${l.echeance}T18:00:00`).toISOString() : null,
          pre_caracterisee_ia: true,
        });
      }
      onCreees();
      onClose();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Sauvegarde échouée');
      setEnregistre(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>🎤 Dicter plusieurs tâches</h2>
        {erreur && <div className="form-error">{erreur}</div>}

        {!lignes ? (
          <>
            <textarea
              rows={4}
              autoFocus
              placeholder="Dicte ou écris tes tâches… ex. « Envoyer le CR à l'équipe, rappeler Sophie vendredi, et relancer le prestataire c'est urgent »"
              value={texte}
              onChange={e => setTexte(e.target.value)}
            />
            {micDispo ? (
              <button
                className={`btn ${ecoute ? 'btn-danger' : 'btn-secondary'}`}
                onClick={basculerMicro}
              >
                {ecoute ? '⏹ Arrêter la dictée' : '🎤 Dicter'}
              </button>
            ) : (
              <div className="hint-qualifiee" style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)' }}>
                Micro non disponible sur ce navigateur — tu peux écrire le texte.
              </div>
            )}
            <button className="btn" onClick={analyser} disabled={!texte.trim() || analyse}>
              {analyse ? 'Analyse en cours…' : '✨ Analyser avec l\'IA'}
            </button>
            <button className="btn btn-ghost" onClick={onRetour}>
              ← Saisie manuelle
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              {lignes.length} tâche{lignes.length > 1 ? 's' : ''} détectée{lignes.length > 1 ? 's' : ''} — vérifie puis ajoute.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '50vh', overflowY: 'auto' }}>
              {lignes.map((l, i) => (
                <div key={i} className="settings-section" style={{ margin: 0 }}>
                  <div className="row-2" style={{ alignItems: 'center' }}>
                    <input value={l.titre} onChange={e => majLigne(i, { titre: e.target.value })} />
                    <button className="btn-ghost" style={{ cursor: 'pointer', maxWidth: 36 }} onClick={() => retirerLigne(i)}>
                      ✕
                    </button>
                  </div>
                  <div className="row-2">
                    <select value={l.projetId} onChange={e => majLigne(i, { projetId: e.target.value })}>
                      <option value="">{l.incertain ? 'Projet ? (à vérifier)' : 'Sans projet'}</option>
                      {projets.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.icone ? `${p.icone} ` : ''}
                          {p.nom}
                        </option>
                      ))}
                    </select>
                    <select value={l.priorite} onChange={e => majLigne(i, { priorite: e.target.value as PrioriteTache })}>
                      <option value="haute">🔴 Haute</option>
                      <option value="moyenne">🟠 Moyenne</option>
                      <option value="basse">🔵 Basse</option>
                      <option value="aucune">Aucune</option>
                    </select>
                  </div>
                  <input type="date" value={l.echeance} onChange={e => majLigne(i, { echeance: e.target.value })} />
                </div>
              ))}
            </div>
            <button className="btn" onClick={toutAjouter} disabled={enregistre}>
              {enregistre ? 'Ajout…' : `✓ Tout ajouter (${lignes.length})`}
            </button>
            <button className="btn btn-ghost" onClick={() => setLignes(null)}>
              ← Modifier le texte
            </button>
          </>
        )}
      </div>
    </div>
  );
}
