'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { appeler } from '@/lib/fetcher';
import { getSupabaseClient } from '@/lib/supabase-client';

// Deux modes (BU-17) :
// 1. Demande — saisie de l'email, envoi du lien de réinitialisation
// 2. Nouveau mot de passe — arrivée depuis le lien email (?code=...)
function ResetPasswordContenu() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get('code');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [sessionPrete, setSessionPrete] = useState(false);

  // Mode 2 : échanger le code du lien email contre une session
  useEffect(() => {
    if (!code) return;
    getSupabaseClient()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) setErreur('Lien invalide ou expiré — refais une demande.');
        else setSessionPrete(true);
      });
  }, [code]);

  async function envoyerLien(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur('');
    try {
      await appeler('/api/auth/reset-password', 'POST', { email });
      setInfo('Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.');
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Envoi impossible');
    }
    setEnCours(false);
  }

  async function changerMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur('');
    const { error } = await getSupabaseClient().auth.updateUser({ password });
    if (error) {
      setErreur(error.message);
      setEnCours(false);
    } else {
      router.push('/aujourd-hui');
      router.refresh();
    }
  }

  if (code) {
    return (
      <form className="form-page" onSubmit={changerMotDePasse}>
        <h1>Nouveau mot de passe</h1>
        {erreur && <div className="form-error">{erreur}</div>}
        <div className="field">
          <label htmlFor="password">Nouveau mot de passe (8 caractères min.)</label>
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
        <button className="btn" type="submit" disabled={enCours || !sessionPrete}>
          {enCours ? 'Enregistrement…' : 'Changer le mot de passe'}
        </button>
      </form>
    );
  }

  return (
    <form className="form-page" onSubmit={envoyerLien}>
      <h1>Mot de passe oublié</h1>
      <p className="form-sub">Saisis ton email — tu recevras un lien de réinitialisation.</p>
      {erreur && <div className="form-error">{erreur}</div>}
      {info && <div className="form-info">{info}</div>}
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
      <button className="btn" type="submit" disabled={enCours}>
        {enCours ? 'Envoi…' : 'Envoyer le lien'}
      </button>
      <p style={{ fontSize: 13, textAlign: 'center' }}>
        <Link href="/login">← Retour à la connexion</Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContenu />
    </Suspense>
  );
}
