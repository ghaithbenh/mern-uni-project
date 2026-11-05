import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api, { messageErreur } from '../api';
import { useAuth } from '../AuthContext';
import { buttonPrimarySmall, cx, fieldArea, fieldSelect, linkDanger } from '../ui';
import type { Feedback, FeedbackDraft } from '../types';

interface FeedbackSectionProps {
  eventId: string;
}

export default function FeedbackSection({ eventId }: FeedbackSectionProps) {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [texte, setTexte] = useState('');
  const [note, setNote] = useState(5);
  const [error, setError] = useState('');

  // Chargé à l'ouverture de la section
  useEffect(() => {
    api
      .get<Feedback[]>(`/events/${eventId}/feedbacks`)
      .then((res) => setFeedbacks(res.data))
      .catch((err: unknown) => setError(messageErreur(err)))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    try {
      const payload: FeedbackDraft = { texte, note, evenement: eventId };
      const { data } = await api.post<Feedback>('/feedbacks', payload);
      setFeedbacks((prev) => [data, ...prev]);
      setTexte('');
      setNote(5);
    } catch (err: unknown) {
      setError(messageErreur(err));
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await api.delete(`/feedbacks/${id}`);
      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
    } catch (err: unknown) {
      setError(messageErreur(err));
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-rule bg-paper p-4">
      {loading && <p className="text-sm text-ink-soft">Chargement…</p>}
      {!loading && feedbacks.length === 0 && (
        <p className="text-sm text-ink-soft">Aucun avis pour l’instant.</p>
      )}

      {feedbacks.map((f) => {
        const peutSupprimer =
          user !== null &&
          (user.role === 'admin' || (f.auteur !== null && user.id === f.auteur._id));

        return (
          <div className="flex gap-3 py-2 first:pt-0" key={f._id}>
            <span
              className="inline-flex h-6 shrink-0 items-center rounded-md border border-rule bg-card px-1.5 font-mono text-[11px] font-medium"
              aria-label={`Note ${f.note} sur 5`}
            >
              {f.note}/5
            </span>
            <div className="min-w-0">
              <p className="text-sm">{f.texte}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft">
                {f.auteur ? f.auteur.nom : 'compte supprimé'}
                {peutSupprimer && (
                  <>
                    <span>·</span>
                    <button
                      type="button"
                      className={cx(linkDanger, 'px-1 py-0 text-xs')}
                      onClick={() => handleDelete(f._id)}
                    >
                      supprimer
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        );
      })}

      {error && (
        <p
          className="mt-2 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger font-medium"
          role="alert"
        >
          {error}
        </p>
      )}

      {user ? (
        <form className="mt-4 grid gap-2 border-t border-rule pt-4" onSubmit={handleSubmit}>
          <textarea
            className={fieldArea}
            rows={2}
            placeholder="Ton avis"
            value={texte}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTexte(e.target.value)}
            required
          />
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-ink-soft">
              Note
              <select
                className={fieldSelect}
                value={note}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setNote(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}/5
                  </option>
                ))}
              </select>
            </label>
            <button className={buttonPrimarySmall} type="submit">
              Envoyer
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">Connecte-toi pour laisser un avis.</p>
      )}
    </div>
  );
}
