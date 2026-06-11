'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { appeler } from '@/lib/fetcher';
import { detecterTimezone } from '@/lib/logique-timezone';

export default function RegisterPage() {
  const router = useRouter();
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [enCours, setEnCours] = useState(false);

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur('');
    try {
      const res = await appeler<{ email_confirmation_requise: boolean }>(
        '/api/auth/register',
        'POST',
        { prenom, email, password, timezone: detecterTimezone() }
      );
      if (res.email_confirmation_requise) {
        setInfo('Compte créé ! Vérifie ta boîte mail et clique sur le lien de confirmation, puis connecte-toi.');
        setEnCours(false);
      } else {
        router.push('/aujourd-hui');
        router.refresh();
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Création impossible');
      setEnCours(false);
    }
  }

  return (
    <form className="form-page" onSubmit={creer}>
      <h1>Créer un compte</h1>
      <p className="form-sub">Ton outil personnel — indépendant de tout employeur.</p>
      {erreur && <div className="form-error">{erreur}</div>}
      {info && <div className="form-info">{info}</div>}
      <div className="field">
        <label htmlFor="prenom">Prénom</label>
        <input id="prenom" required value={prenom} onChange={e => setPrenom(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Mot de passe (8 caractères min.)</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      <button className="btn" type="submit" disabled={enCours}>
        {enCours ? 'Création…' : 'Créer mon compte'}
      </button>
      <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--text-dim)' }}>
        Déjà un compte ? <Link href="/login">Se connecter</Link>
      </p>
    </form>
  );
}
