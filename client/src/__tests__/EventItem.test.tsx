import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AuthContext } from '../AuthContext';
import EventItem from '../components/EventItem';
import type { Event, User } from '../types';

// EventItem ne monte la section d'avis qu'à la demande : mock léger.
vi.mock('../components/FeedbackSection', () => ({
  default: (): string => '§section-avis§',
}));

const utilisateur = (id: string, role: User['role']): User => ({
  id,
  nom: 'Test User',
  email: 'test@club.org',
  role,
});

const creerContexte = (user: User | null) => ({
  user,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
});

const rendu = (event: Event, user: User | null): void => {
  render(
    <AuthContext.Provider value={creerContexte(user)}>
      <EventItem event={event} onDelete={() => {}} />
    </AuthContext.Provider>
  );
};

const evenement = (date: string, auteurId: string): Event => ({
  _id: 'abc123',
  titre: 'Soirée jeux',
  description: 'Tournoi de jeux de société',
  lieu: 'Maison du club',
  date,
  auteur: { _id: auteurId, nom: 'Alice' },
  createdAt: '2026-03-01T09:00:00.000Z',
  updatedAt: '2026-03-01T09:00:00.000Z',
});

beforeEach(cleanup);

describe('EventItem', () => {
  it('affiche le titre, le lieu et le numéro de jour', () => {
    rendu(evenement('2026-03-12T18:00', 'u1'), utilisateur('u1', 'user'));
    expect(screen.getByText('Soirée jeux')).toBeInTheDocument();
    expect(screen.getByText('Maison du club')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('mars')).toBeInTheDocument();
  });

  it('marque un événement terminé si la date est passée', () => {
    rendu(evenement('2020-01-01T10:00', 'u1'), utilisateur('u1', 'user'));
    expect(screen.getByText('terminé')).toBeInTheDocument();
  });

  it('montre Supprimer à l’auteur', () => {
    rendu(evenement('2026-03-12T18:00', 'u1'), utilisateur('u1', 'user'));
    expect(screen.getByText('Supprimer')).toBeInTheDocument();
  });

  it('cache Supprimer à un autre membre', () => {
    rendu(evenement('2026-03-12T18:00', 'u1'), utilisateur('u2', 'user'));
    expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
  });

  it('montre Supprimer à un admin, même non-auteur', () => {
    rendu(evenement('2026-03-12T18:00', 'u1'), utilisateur('admin1', 'admin'));
    expect(screen.getByText('Supprimer')).toBeInTheDocument();
  });

  it('garde la consultation des avis ouverte aux visiteurs, sans suppression', () => {
    rendu(evenement('2026-03-12T18:00', 'u1'), null);
    expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
    expect(screen.getByText('Voir les avis')).toBeInTheDocument();
  });

  it('gère un auteur supprimé', () => {
    const event = evenement('2026-03-12T18:00', 'u1');
    event.auteur = null;
    rendu(event, utilisateur('u2', 'user'));
    expect(screen.getByText(/compte supprimé/u)).toBeInTheDocument();
  });

  it('ouvre la section des avis au clic', async () => {
    rendu(evenement('2026-03-12T18:00', 'u1'), utilisateur('u1', 'user'));

    await userEvent.click(screen.getByText('Voir les avis'));
    expect(screen.getByText('§section-avis§')).toBeInTheDocument();
    expect(screen.getByText('Masquer les avis')).toBeInTheDocument();
  });
});
