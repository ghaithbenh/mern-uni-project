import { useCallback, useEffect, useState } from 'react';
import api, { messageErreur } from '../api';
import { useAuth } from '../AuthContext';
import ActivityChart from '../components/charts/ActivityChart';
import DonutChart from '../components/charts/DonutChart';
import RatingBars from '../components/charts/RatingBars';
import Sparkline from '../components/charts/Sparkline';
import {
  buttonSecondary,
  buttonSecondarySmall,
  card,
  cx,
  eyebrow,
  fieldSelect,
  fieldSelectSmall,
  fieldSmall,
  muted,
  panelTitle,
} from '../ui';
import type { AdminStats, DashboardPeriod, Event, Role, User } from '../types';

const PERIODS: readonly DashboardPeriod[] = [7, 14, 30, 90];

const toPeriod = (value: string): DashboardPeriod => {
  const parsed = Number(value);
  return PERIODS.find((days) => days === parsed) ?? 14;
};

const formatNumber = (value: number): string => value.toLocaleString('fr-FR');

const formatNote = (value: number | null): string =>
  value === null ? '—' : value.toFixed(1).replace('.', ',');

interface Kpi {
  key: string;
  label: string;
  value: string;
  delta: number | null;
  meta: string;
  series: number[];
  accent: boolean;
}

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [period, setPeriod] = useState<DashboardPeriod>(14);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, eventsRes] = await Promise.all([
        api.get<AdminStats>('/admin/stats', { params: { days: period } }),
        api.get<User[]>('/users'),
        api.get<Event[]>('/events'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setEvents(eventsRes.data);
    } catch (err: unknown) {
      setError(messageErreur(err));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshStats = useCallback(async (): Promise<void> => {
    const { data } = await api.get<AdminStats>('/admin/stats', {
      params: { days: period },
    });
    setStats(data);
  }, [period]);

  const handleRoleChange = async (id: string, role: Role): Promise<void> => {
    setUpdatingId(id);
    setError('');
    try {
      const { data } = await api.patch<User>(`/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
      await refreshStats();
    } catch (err: unknown) {
      setError(messageErreur(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteEvent = async (event: Event): Promise<void> => {
    if (!window.confirm(`Supprimer « ${event.titre} » ?`)) return;

    setDeletingId(event._id);
    setError('');
    try {
      await api.delete(`/events/${event._id}`);
      setEvents((prev) => prev.filter((e) => e._id !== event._id));
      await refreshStats();
    } catch (err: unknown) {
      setError(messageErreur(err));
    } finally {
      setDeletingId(null);
    }
  };

  const needle = query.trim().toLowerCase();
  const filteredUsers = users.filter(
    (user) =>
      needle.length === 0 ||
      user.nom.toLowerCase().includes(needle) ||
      user.email.toLowerCase().includes(needle)
  );

  const kpis: Kpi[] = stats
    ? [
        {
          key: 'users',
          label: 'Utilisateurs',
          value: formatNumber(stats.users),
          delta: stats.newUsers,
          meta: `${stats.admins} admin${stats.admins > 1 ? 's' : ''}`,
          series: stats.series.map((point) => point.users),
          accent: false,
        },
        {
          key: 'events',
          label: 'Annonces',
          value: formatNumber(stats.events),
          delta: stats.newEvents,
          meta: `${stats.upcomingEvents} à venir`,
          series: stats.series.map((point) => point.events),
          accent: false,
        },
        {
          key: 'feedbacks',
          label: 'Avis',
          value: formatNumber(stats.feedbacks),
          delta: stats.newFeedbacks,
          meta: `${formatNote(stats.averageNote)} / 5 de moyenne`,
          series: stats.series.map((point) => point.feedbacks),
          accent: true,
        },
        {
          key: 'note',
          label: 'Note moyenne',
          value: formatNote(stats.averageNote),
          delta: null,
          meta: `${formatNumber(stats.feedbacks)} avis au total`,
          series: [],
          accent: true,
        },
      ]
    : [];

  const topMax =
    stats && stats.topEvents.length > 0
      ? Math.max(...stats.topEvents.map((event) => event.feedbacks))
      : 1;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={eyebrow}>Administration</p>
          <h2 className="mt-1.5 font-serif text-3xl font-semibold leading-tight">
            Tableau de bord
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="admin-period">
            Période analysée
          </label>
          <select
            className={fieldSelect}
            id="admin-period"
            value={period}
            disabled={loading}
            onChange={(event) => setPeriod(toPeriod(event.target.value))}
          >
            {PERIODS.map((days) => (
              <option key={days} value={days}>
                {days} jours
              </option>
            ))}
          </select>
          <button
            type="button"
            className={buttonSecondary}
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? '…' : 'Actualiser'}
          </button>
        </div>
      </div>

      {error && (
        <p
          className="mt-4 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      {!stats && loading && (
        <p className={cx(muted, 'mt-6 text-sm')}>Chargement du tableau de bord…</p>
      )}

      {stats && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <article className={cx(card, 'p-4')} key={kpi.key}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                    {kpi.label}
                  </span>
                  {kpi.delta !== null && (
                    <span
                      className={cx(
                        'rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
                        kpi.delta > 0
                          ? 'bg-accent-soft text-ink'
                          : 'bg-rule/60 text-ink'
                      )}
                      title={`Nouveaux sur les ${period} derniers jours`}
                    >
                      {kpi.delta > 0 ? '+' : ''}
                      {kpi.delta}
                    </span>
                  )}
                </div>
                <div className="mt-2 font-serif text-[27px] font-medium leading-none">
                  {kpi.value}
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <span className="text-xs text-ink-soft">{kpi.meta}</span>
                  {kpi.series.length > 1 && (
                    <Sparkline
                      values={kpi.series}
                      color={
                        kpi.accent ? 'var(--color-accent)' : 'var(--color-ink)'
                      }
                      label={`${kpi.label} sur ${period} jours`}
                    />
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className={cx(card, 'p-5 lg:col-span-2')}>
              <h3 className={panelTitle}>Activité</h3>
              <p className={cx(muted, 'mt-0.5 text-xs')}>
                Créations par jour · {period} derniers jours
              </p>
              <ActivityChart data={stats.series} />
            </section>

            <section className={cx(card, 'p-5')}>
              <h3 className={panelTitle}>Rôles</h3>
              <p className={cx(muted, 'mt-0.5 text-xs')}>Répartition des comptes</p>
              <DonutChart
                segments={[
                  {
                    label: 'Membres',
                    value: Math.max(0, stats.users - stats.admins),
                    color: 'var(--color-ink)',
                  },
                  {
                    label: 'Admins',
                    value: stats.admins,
                    color: 'var(--color-accent)',
                  },
                ]}
                centerValue={formatNumber(stats.users)}
                centerLabel="comptes"
              />
            </section>

            <section className={cx(card, 'p-5')}>
              <h3 className={panelTitle}>Notes</h3>
              <p className={cx(muted, 'mt-0.5 text-xs')}>Distribution des avis</p>
              <RatingBars ratings={stats.ratings} average={stats.averageNote} />
            </section>

            <section className={cx(card, 'p-5 lg:col-span-2')}>
              <h3 className={panelTitle}>Annonces les plus commentées</h3>
              <p className={cx(muted, 'mt-0.5 text-xs')}>Top 5 par nombre d’avis</p>

              {stats.topEvents.length === 0 ? (
                <p className={cx(muted, 'mt-4 text-sm')}>
                  Pas encore d’avis sur les annonces.
                </p>
              ) : (
                <ol className="mt-4 grid list-none gap-3">
                  {stats.topEvents.map((event, index) => (
                    <li
                      className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-2.5"
                      key={event.id}
                    >
                      <span className="pt-0.5 text-xs tabular-nums text-ink-soft">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex flex-col justify-between gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                          <span className="font-serif text-[15px] font-semibold">
                            {event.titre}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-2 text-xs text-ink-soft">
                            {event.feedbacks} avis
                            {event.note !== null && (
                              <span className="rounded bg-rule/70 px-1.5 py-px font-medium tabular-nums text-ink">
                                {event.note.toFixed(1).replace('.', ',')}/5
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-rule">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{
                              width: `${Math.max(4, (event.feedbacks / topMax) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </>
      )}

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h3 className="font-serif text-xl font-semibold">Utilisateurs &amp; rôles</h3>
          <label className="flex w-full items-center gap-2 sm:w-auto">
            <span className="text-xs text-ink-soft">Filtrer</span>
            <input
              className={cx(fieldSmall, 'w-full sm:w-56')}
              type="search"
              value={query}
              placeholder="nom ou email"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {loading && users.length === 0 ? (
          <p className={cx(muted, 'text-sm')}>Chargement…</p>
        ) : filteredUsers.length === 0 ? (
          <div
            className={cx(card, 'border-dashed px-6 py-10 text-center text-sm text-ink-soft')}
          >
            Aucun utilisateur ne correspond.
          </div>
        ) : (
          <div className={cx(card, 'overflow-hidden')}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper/70">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
                    Nom
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
                    Rôle
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const estMoi = currentUser?.id === user.id;

                  return (
                    <tr
                      className="border-t border-rule first:border-t-0 hover:bg-paper/50"
                      key={user.id}
                    >
                      <td className="px-4 py-3 align-middle">
                        {user.nom}
                        {estMoi && (
                          <span className={cx(muted, 'text-xs')}> (toi)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs align-middle">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <select
                          className={fieldSelectSmall}
                          value={user.role}
                          disabled={estMoi || updatingId === user.id}
                          onChange={(event) => {
                            const role: Role =
                              event.target.value === 'admin' ? 'admin' : 'user';
                            void handleRoleChange(user.id, role);
                          }}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h3 className="font-serif text-xl font-semibold">Annonces</h3>
          <span className={cx(muted, 'text-sm')}>
            {events.length} {events.length > 1 ? 'annonces' : 'annonce'}
          </span>
        </div>

        {events.length === 0 ? (
          <div
            className={cx(card, 'border-dashed px-6 py-10 text-center text-sm text-ink-soft')}
          >
            Aucune annonce.
          </div>
        ) : (
          <div className={cx(card, 'overflow-hidden')}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper/70">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
                    Titre
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
                    Auteur
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
                    Date
                  </th>
                  <th className="w-10 px-4 py-2.5" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    className="border-t border-rule first:border-t-0 hover:bg-paper/50"
                    key={event._id}
                  >
                    <td className="px-4 py-3 font-medium align-middle">{event.titre}</td>
                    <td className="px-4 py-3 align-middle">
                      {event.auteur ? event.auteur.nom : 'compte supprimé'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs align-middle">
                      {new Date(event.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right align-middle">
                      <button
                        type="button"
                        className={buttonSecondarySmall}
                        disabled={deletingId === event._id}
                        onClick={() => void handleDeleteEvent(event)}
                      >
                        {deletingId === event._id ? '…' : 'Supprimer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
