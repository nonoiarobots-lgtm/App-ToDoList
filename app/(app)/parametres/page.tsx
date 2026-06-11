'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { appeler } from '@/lib/fetcher';
import type { Preferences } from '@/types/preferences';
import type { Projet, PaletteDisponible } from '@/types/projet';

export default function ParametresPage() {
  const { data: prefsData } = useSWR<{ preferences: Preferences; email: string }>('/api/preferences');

  if (!prefsData?.preferences) return <main className="screen empty-state">Chargement…</main>;

  return (
    <FormulaireParametres
      key={prefsData.preferences.updated_at}
      prefs={prefsData.preferences}
      email={prefsData.email}
    />
  );
}

function FormulaireParametres({ prefs, email }: { prefs: Preferences; email: string }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data: projetsData } = useSWR<{ projets: Projet[]; palette: PaletteDisponible }>('/api/projets');

  const [prenom, setPrenom] = useState(prefs.prenom);
  const [heures, setHeures] = useState({
    briefing: prefs.heure_briefing.slice(0, 5),
    qualification: prefs.heure_qualification.slice(0, 5),
    retards: prefs.heure_retards.slice(0, 5),
  });
  const [seuils, setSeuils] = useState({ orange: prefs.seuil_orange, rouge: prefs.seuil_rouge });
  const [nouveauProjet, setNouveauProjet] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  async function enregistrerPrefs() {
    setErreur('');
    setMessage('');
    try {
      await appeler('/api/preferences', 'PATCH', {
        prenom,
        heure_briefing: heures.briefing,
        heure_qualification: heures.qualification,
        heure_retards: heures.retards,
        seuil_orange: seuils.orange,
        seuil_rouge: seuils.rouge,
      });
      mutate('/api/preferences');
      setMessage('Préférences enregistrées ✓');
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Sauvegarde échouée');
    }
  }

  async function ajouterProjet(e: React.FormEvent) {
    e.preventDefault();
    if (!nouveauProjet.trim()) return;
    setErreur('');
    try {
      await appeler('/api/projets', 'POST', { nom: nouveauProjet });
      setNouveauProjet('');
      mutate('/api/projets');
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Création impossible');
    }
  }

  async function supprimerProjet(p: Projet) {
    if (!confirm(`Supprimer le projet « ${p.nom} » ? Ses tâches passeront en « Sans projet ».`)) return;
    await appeler(`/api/projets/${p.id}`, 'DELETE');
    mutate('/api/projets');
    mutate(key => typeof key === 'string' && key.startsWith('/api/taches'));
  }

  async function deconnecter() {
    await appeler('/api/auth/logout', 'POST');
    router.push('/login');
    router.refresh();
  }

  return (
    <main className="screen">
      <div className="screen-header">
        <h1 className="screen-title">Paramètres</h1>
      </div>
      {erreur && <div className="form-error">{erreur}</div>}
      {message && <div className="form-info">{message}</div>}

      <div className="settings-section">
        <h2>Compte</h2>
        <div className="field">
          <label>Prénom</label>
          <input value={prenom} onChange={e => setPrenom(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={email} disabled />
        </div>
      </div>

      <div className="settings-section">
        <h2>Projets</h2>
        {(projetsData?.projets ?? []).map(p => (
          <div key={p.id} className="projet-row">
            {p.couleur ? (
              <span className="projet-pastille" style={{ background: p.couleur }} />
            ) : (
              <span>{p.icone}</span>
            )}
            <span className="projet-nom">{p.nom}</span>
            <button className="btn-ghost" style={{ cursor: 'pointer' }} onClick={() => supprimerProjet(p)}>
              ✕
            </button>
          </div>
        ))}
        <form className="row-2" onSubmit={ajouterProjet}>
          <input
            placeholder="Nouveau projet…"
            value={nouveauProjet}
            onChange={e => setNouveauProjet(e.target.value)}
          />
          <button className="btn btn-secondary" type="submit" style={{ maxWidth: 110 }}>
            Ajouter
          </button>
        </form>
      </div>

      <div className="settings-section">
        <h2>Notifications (tranche ④)</h2>
        <div className="row-2">
          <div className="field">
            <label>Briefing</label>
            <input
              type="time"
              value={heures.briefing}
              onChange={e => setHeures({ ...heures, briefing: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Qualification</label>
            <input
              type="time"
              value={heures.qualification}
              onChange={e => setHeures({ ...heures, qualification: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Retards</label>
            <input
              type="time"
              value={heures.retards}
              onChange={e => setHeures({ ...heures, retards: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>Seuils d&apos;alerte « à qualifier »</h2>
        <div className="row-2">
          <div className="field">
            <label>Bannière orange</label>
            <input
              type="number"
              min={1}
              value={seuils.orange}
              onChange={e => setSeuils({ ...seuils, orange: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>Bannière rouge</label>
            <input
              type="number"
              min={2}
              value={seuils.rouge}
              onChange={e => setSeuils({ ...seuils, rouge: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <button className="btn" onClick={enregistrerPrefs}>
        Enregistrer
      </button>
      <div style={{ height: 10 }} />
      <button className="btn btn-danger" onClick={deconnecter}>
        Se déconnecter
      </button>
    </main>
  );
}
