import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { cx, linkGhost, linkDanger } from '../ui';
import FeedbackSection from './FeedbackSection';
import type { Event } from '../types';

const MOIS = [
  'janv',
  'févr',
  'mars',
  'avr',
  'mai',
  'juin',
  'juil',
  'août',
  'sept',
  'oct',
  'nov',
  'déc',
];

interface EventItemProps {
  event: Event;
  onDelete: (id: string) => void;
}

export default function EventItem({ event, onDelete }: EventItemProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const d = new Date(event.date);
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const passe = d < new Date();
  const estAuteur = user !== null && event.auteur !== null && user.id === event.auteur._id;
  const peutSupprimer = estAuteur || user?.role === 'admin';

  return (
    <article
      className={cx(
        'grid grid-cols-[56px_minmax(0,1fr)] gap-x-5 px-5 py-6',
        passe && 'opacity-60'
      )}
    >
      <div className="pt-0.5 text-center">
        <div className="font-serif text-[26px] font-semibold leading-none">
          {String(d.getDate()).padStart(2, '0')}
        </div>
        <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
          {MOIS[d.getMonth()]}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-ink-soft">
          {d.getFullYear()}
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="font-serif text-lg font-semibold leading-snug">{event.titre}</h3>

        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
          <span>{heure}</span>
          <span className="mx-1.5 text-accent">·</span>
          <span className="normal-case tracking-normal">{event.lieu}</span>
          {passe && (
            <span className="ml-2 rounded border border-rule bg-paper px-1.5 py-px">
              terminé
            </span>
          )}
        </p>

        <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed">
          {event.description}
        </p>

        <p className="mt-2 text-xs text-ink-soft">
          Posté par {event.auteur ? event.auteur.nom : 'compte supprimé'}
        </p>

        <div className="mt-3 flex gap-2">
          <button type="button" className={linkGhost} onClick={() => setOpen(!open)}>
            {open ? 'Masquer les avis' : 'Voir les avis'}
          </button>
          {peutSupprimer && (
            <button type="button" className={linkDanger} onClick={() => onDelete(event._id)}>
              Supprimer
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="col-span-2">
          <FeedbackSection eventId={event._id} />
        </div>
      )}
    </article>
  );
}
