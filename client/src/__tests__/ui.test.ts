import { describe, expect, it } from 'vitest';
import { cx } from '../ui';

describe('cx', () => {
  it('concatène avec des espaces', () => {
    expect(cx('a', 'b')).toBe('a b');
  });

  it('ignore les valeurs fausses', () => {
    expect(cx('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('renvoie une chaîne vide quand tout est fautif', () => {
    expect(cx(false, null)).toBe('');
  });
});
