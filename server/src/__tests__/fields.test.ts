import { describe, expect, it } from 'vitest';
import { AppError } from '../common/errors/app-error.js';
import { asRecord, requiredNumber, requiredString } from '../common/validation/fields.js';
import { parseCreateEventDto } from '../events/dto/events.dto.js';
import { parseCreateFeedbackDto } from '../feedbacks/dto/feedbacks.dto.js';
import { parseLoginDto, parseRegisterDto } from '../auth/dto/auth.dto.js';
import { parseUpdateRoleDto } from '../users/dto/users.dto.js';

const codeDe = (fn: () => unknown): number => {
  try {
    fn();
  } catch (err: unknown) {
    if (err instanceof AppError) return err.statusCode;
    throw err;
  }
  throw new Error('AppError attendu mais non levé');
};

describe('asRecord', () => {
  it('accepte un objet', () => {
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
  });

  it('rejette tableaux, null et scalaires', () => {
    expect(asRecord([1, 2])).toEqual({});
    expect(asRecord(null)).toEqual({});
    expect(asRecord('x')).toEqual({});
  });
});

describe('requiredString / requiredNumber', () => {
  it('accepte une chaîne non vide', () => {
    expect(requiredString('  alice ', 'msg')).toBe('  alice ');
  });

  it('refuse vide, espaces, non-chaîne (400)', () => {
    expect(codeDe(() => requiredString('', 'msg'))).toBe(400);
    expect(codeDe(() => requiredString('   ', 'msg'))).toBe(400);
    expect(codeDe(() => requiredString(42, 'msg'))).toBe(400);
    expect(codeDe(() => requiredNumber('5', 'msg'))).toBe(400);
    expect(codeDe(() => requiredNumber(Number.NaN, 'msg'))).toBe(400);
  });
});

describe('parseRegisterDto', () => {
  const valide = { nom: 'Alice', email: 'a@b.c', motDePasse: 'abcdef' };

  it('accepte un compte valide', () => {
    expect(parseRegisterDto(valide)).toEqual(valide);
  });

  it('refuse les champs manquants (400)', () => {
    expect(codeDe(() => parseRegisterDto({ ...valide, email: '' }))).toBe(400);
    expect(codeDe(() => parseRegisterDto(null))).toBe(400);
  });

  it('refuse un mot de passe trop court (400)', () => {
    expect(codeDe(() => parseRegisterDto({ ...valide, motDePasse: '12345' }))).toBe(400);
  });

  it('ne concerne pas login (login sans longueur minimale)', () => {
    expect(parseLoginDto({ email: 'a@b.c', motDePasse: '12345' })).toEqual({
      email: 'a@b.c',
      motDePasse: '12345',
    });
  });
});

describe('parseCreateEventDto', () => {
  const valide = {
    titre: 'Réunion',
    description: 'Frontline',
    lieu: 'A204',
    date: '2026-02-01T10:00:00.000Z',
  };

  it('convertit la date en Date valide', () => {
    const dto = parseCreateEventDto(valide);
    expect(dto.date).toBeInstanceOf(Date);
    expect(dto.date.toISOString()).toBe('2026-02-01T10:00:00.000Z');
  });

  it('refuse une date injoignable (400)', () => {
    expect(codeDe(() => parseCreateEventDto({ ...valide, date: 'demain' }))).toBe(400);
  });

  it('refuse un champ manquant (400)', () => {
    expect(codeDe(() => parseCreateEventDto({ ...valide, lieu: '' }))).toBe(400);
  });
});

describe('parseCreateFeedbackDto', () => {
  const valide = { texte: 'Super', note: 5, evenement: '655f3d1e7a1d2c58a4f00a11' };

  it('accepte une note 1-5', () => {
    expect(parseCreateFeedbackDto({ ...valide, note: 1 })).toEqual({ ...valide, note: 1 });
  });

  it('refuse note 0 et 6 (400)', () => {
    expect(codeDe(() => parseCreateFeedbackDto({ ...valide, note: 0 }))).toBe(400);
    expect(codeDe(() => parseCreateFeedbackDto({ ...valide, note: 6 }))).toBe(400);
  });

  it('refuse un ObjectId invalide (400)', () => {
    expect(codeDe(() => parseCreateFeedbackDto({ ...valide, evenement: 'zzz' }))).toBe(400);
  });

  it('refuse une note non numérique (400)', () => {
    expect(codeDe(() => parseCreateFeedbackDto({ ...valide, note: '5' }))).toBe(400);
  });
});

describe('parseUpdateRoleDto', () => {
  it('accepte user et admin', () => {
    expect(parseUpdateRoleDto({ role: 'user' })).toEqual({ role: 'user' });
    expect(parseUpdateRoleDto({ role: 'admin' })).toEqual({ role: 'admin' });
  });

  it('refuse les autres rôles (400)', () => {
    expect(codeDe(() => parseUpdateRoleDto({ role: 'superadmin' }))).toBe(400);
    expect(codeDe(() => parseUpdateRoleDto({}))).toBe(400);
  });
});
