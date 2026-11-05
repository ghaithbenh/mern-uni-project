import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../AuthContext';
import { messageErreur } from '../api';
import { button, field, labelField, linkGhost, cx, card, muted } from '../ui';

type Mode = 'login' | 'register';

interface AuthFormState {
  nom: string;
  email: string;
  motDePasse: string;
}

const emptyForm: AuthFormState = { nom: '', email: '', motDePasse: '' };

export default function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<AuthFormState>(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Un seul handler pour tous les champs contrôlés
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.motDePasse);
      } else {
        await register(form.nom, form.email, form.motDePasse);
      }
    } catch (err: unknown) {
      setError(messageErreur(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={cx(card, 'p-5 lg:sticky lg:top-20')} onSubmit={handleSubmit}>
      <h2 className="font-serif text-xl font-semibold">
        {mode === 'login' ? 'Connexion' : 'Créer un compte'}
      </h2>
      <p className={cx(muted, 'mt-1 text-sm')}>
        Tu peux lire les annonces sans compte. Pour en publier ou donner ton avis,
        connecte-toi.
      </p>

      {mode === 'register' && (
        <label className={cx(labelField, 'mt-4')}>
          Nom
          <input className={field} name="nom" value={form.nom} onChange={handleChange} required />
        </label>
      )}
      <label className={cx(labelField, 'mt-3')}>
        Email
        <input
          className={field}
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </label>
      <label className={cx(labelField, 'mt-3')}>
        Mot de passe
        <input
          className={field}
          type="password"
          name="motDePasse"
          value={form.motDePasse}
          onChange={handleChange}
          minLength={6}
          required
        />
      </label>

      {error && (
        <p
          className="mt-3 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger font-medium"
          role="alert"
        >
          {error}
        </p>
      )}

      <button className={cx(button, 'mt-5 w-full')} type="submit" disabled={busy}>
        {busy ? '…' : mode === 'login' ? 'Se connecter' : 'S’inscrire'}
      </button>

      <button
        type="button"
        className={cx(linkGhost, 'mt-1 w-full justify-center')}
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login');
          setError('');
        }}
      >
        {mode === 'login' ? 'Pas de compte ? Inscris-toi' : 'Déjà inscrit ? Connecte-toi'}
      </button>
    </form>
  );
}
