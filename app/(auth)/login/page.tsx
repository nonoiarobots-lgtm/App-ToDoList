'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { appeler } from '@/lib/fetcher';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  async function connecter(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur('');
    try {
      await appeler('/api/auth/login', 'POST', { email, password });
      router.push('/aujourd-hui');
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Connexion impossible');
      setEnCours(false);
    }
  }

  return (
    <form className="form-page" onSubmit={connecter}>
      <h1>Mes Tâches</h1>
      <p className="form-sub">Connecte-toi pour retrouver ton backlog.</p>
      {erreur && <div className="form-error">{erreur}</div>}
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
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      <button className="btn" type="submit" disabled={enCours}>
        {enCours ? 'Connexion…' : 'Se connecter'}
      </button>
      <p style={{ fontSize: 13, textAlign: 'center' }}>
        <Link href="/reset-password">Mot de passe oublié ?</Link>
      </p>
      <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--text-dim)' }}>
        Pas encore de compte ? <Link href="/register">Créer un compte</Link>
      </p>
    </form>
  );
}
