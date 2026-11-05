import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import api, { messageErreur } from '../api';
import { button, card, cx, field, fieldArea, labelField } from '../ui';
import type { Event, EventDraft } from '../types';

const empty: EventDraft = { titre: '', description: '', lieu: '', date: '' };

interface EventFormProps {
  onCreated: (event: Event) => void;
}

export default function EventForm({ onCreated }: EventFormProps) {
  const [form, setForm] = useState<EventDraft>(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post<Event>('/events', form);
      onCreated(data);
      setForm(empty);
    } catch (err: unknown) {
      setError(messageErreur(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className={cx(card, 'p-5 lg:sticky lg:top-20')}
      onSubmit={handleSubmit}
    >
      <h2 className="font-serif text-xl font-semibold">Publier une annonce</h2>

      <label className={cx(labelField, 'mt-4')}>
        Titre
        <input className={field} name="titre" value={form.titre} onChange={handleChange} required />
      </label>
      <label className={cx(labelField, 'mt-3')}>
        Date et heure
        <input
          className={field}
          type="datetime-local"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />
      </label>
      <label className={cx(labelField, 'mt-3')}>
        Lieu
        <input className={field} name="lieu" value={form.lieu} onChange={handleChange} required />
      </label>
      <label className={cx(labelField, 'mt-3')}>
        Description
        <textarea
          className={fieldArea}
          name="description"
          rows={4}
          value={form.description}
          onChange={handleChange}
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
        {busy ? '…' : 'Publier'}
      </button>
    </form>
  );
}
