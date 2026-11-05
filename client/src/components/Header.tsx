import { useAuth } from '../AuthContext';
import type { AppView } from '../types';
import { badge, badgeAccent, cx, linkGhost } from '../ui';

interface HeaderProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
}

const BRAND =
  'flex items-baseline gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export default function Header({ view, onNavigate }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-card">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 lg:px-6">
        <button type="button" className={BRAND} onClick={() => onNavigate('board')}>
          <span className="font-serif text-[21px] font-semibold leading-none tracking-tight">
            Le Panneau
          </span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft sm:inline">
            Bulletin du club
          </span>
        </button>

        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {user.role === 'admin' && (
              <nav
                className="flex items-center gap-1 rounded-lg border border-rule bg-paper p-1"
                aria-label="Navigation"
              >
                <button
                  type="button"
                  onClick={() => onNavigate('board')}
                  className={cx(
                    'h-7 rounded-md px-2.5 text-xs font-medium transition-colors',
                    view === 'board'
                      ? 'bg-card text-ink shadow-card'
                      : 'text-ink-soft hover:text-ink'
                  )}
                >
                  Annonces
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className={cx(
                    'h-7 rounded-md px-2.5 text-xs font-medium transition-colors',
                    view === 'admin'
                      ? 'bg-card text-ink shadow-card'
                      : 'text-ink-soft hover:text-ink'
                  )}
                >
                  Administration
                </button>
              </nav>
            )}

            <span className="hidden items-center gap-1.5 sm:flex">
              <span className="text-sm font-medium">{user.nom}</span>
              <span className={user.role === 'admin' ? badgeAccent : badge}>
                {user.role === 'admin' ? 'admin' : 'membre'}
              </span>
            </span>

            <button type="button" className={linkGhost} onClick={logout}>
              Déconnexion
            </button>
          </div>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Lecture seule
          </span>
        )}
      </div>
    </header>
  );
}
