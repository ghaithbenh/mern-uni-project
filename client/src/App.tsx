import { useEffect, useState } from 'react';
import api, { messageErreur } from './api';
import { AuthProvider, useAuth } from './AuthContext';
import Header from './components/Header';
import AuthForm from './components/AuthForm';
import EventForm from './components/EventForm';
import EventItem from './components/EventItem';
import AdminDashboard from './pages/AdminDashboard';
import { card, cx, eyebrow } from './ui';
import type { AppView, Event } from './types';

function Board() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<AppView>('board');

  // Un non-admin ne doit jamais rester sur la vue administration.
  useEffect(() => {
    if (user?.role !== 'admin') {
      setView('board');
    }
  }, [user]);

  // Charge (ou recharge) les annonces quand on revient sur le tableau.
  useEffect(() => {
    if (view === 'admin') return;

    setLoading(true);
    setError('');
    api
      .get<Event[]>('/events')
      .then((res) => setEvents(res.data))
      .catch((err: unknown) => setError(messageErreur(err)))
      .finally(() => setLoading(false));
  }, [view]);

  const addEvent = (event: Event): void =>
    setEvents((prev) =>
      [...prev, event].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    );

  const deleteEvent = async (id: string): Promise<void> => {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    try {
      await api.delete(`/events/${id}`);
      setEvents((prev) => prev.filter((e) => e._id !== id));
    } catch (err: unknown) {
      setError(messageErreur(err));
    }
  };

  const adminView = view === 'admin' && user?.role === 'admin';

  const countLabel = loading
    ? 'Chargement des annonces…'
    : events.length === 0
      ? 'Aucune annonce pour le moment.'
      : `${events.length} ${events.length > 1 ? 'annonces publiées' : 'annonce publiée'}`;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header view={view} onNavigate={setView} />

      {adminView ? (
        <AdminDashboard />
      ) : (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-6">
          <header className="mb-10 max-w-xl">
            <p className={eyebrow}>Le Panneau — Club étudiant · Sousse</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
              Annonces du club
            </h1>
            <p className="mt-2 text-sm text-ink-soft">{countLabel}</p>
          </header>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section aria-label="Annonces">
              {error && (
                <p
                  className="mb-4 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger font-medium"
                  role="alert"
                >
                  {error}
                </p>
              )}
              {loading && <p className="text-sm text-ink-soft">Chargement…</p>}
              {!loading && events.length === 0 && !error && (
                <div
                  className={cx(
                    card,
                    'border-dashed px-6 py-12 text-center text-sm text-ink-soft'
                  )}
                >
                  Rien d’affiché pour le moment.
                </div>
              )}

              {!loading && events.length > 0 && (
                <div className={cx(card, 'divide-y divide-rule overflow-hidden')}>
                  {events.map((event) => (
                    <EventItem key={event._id} event={event} onDelete={deleteEvent} />
                  ))}
                </div>
              )}
            </section>

            <aside>
              {/* Rendu conditionnel : visiteur → connexion, connecté → formulaire d'ajout */}
              {user ? <EventForm onCreated={addEvent} /> : <AuthForm />}
            </aside>
          </div>
        </main>
      )}

      <footer className="border-t border-rule bg-card py-6 text-center text-xs text-ink-soft">
        Le Panneau — projet MERN, EPS 2025/2026
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Board />
    </AuthProvider>
  );
}
