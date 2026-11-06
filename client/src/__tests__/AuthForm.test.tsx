import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import AuthForm from '../components/AuthForm';

// AuthForm appelle useAuth : on fournit des stubs sans base de données.
vi.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

beforeEach(cleanup);

const basculer = async (): Promise<void> => {
  const bouton = await screen.findByRole('button', {
    name: /Pas de compte|Déjà inscrit/u,
  });
  await userEvent.click(bouton);
};

describe('AuthForm', () => {
  it('affiche le mode connexion par défaut', () => {
    render(<AuthForm />);
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nom/u)).not.toBeInTheDocument();
  });

  it('bascule vers l’inscription : champ Nom + bouton S’inscrire', async () => {
    render(<AuthForm />);
    await basculer();

    expect(screen.getByLabelText('Nom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'S’inscrire' })).toBeInTheDocument();
    expect(screen.queryByText('Pas de compte ? Inscris-toi')).not.toBeInTheDocument();
  });

  it('revient à la connexion', async () => {
    render(<AuthForm />);
    await basculer();
    await basculer();

    expect(screen.queryByLabelText('Nom')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });

  it('exige l’email et le mot de passe', () => {
    render(<AuthForm />);
    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText('Mot de passe')).toBeRequired();
    expect(screen.getByLabelText('Mot de passe')).toHaveAttribute('minLength', '6');
  });
});
