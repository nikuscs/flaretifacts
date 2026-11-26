import { describe, expect, it } from 'vitest';
import { artifactsIdCreate } from '@/services/artifacts/artifacts.utils';

describe('artifacts ids', () => {
  it('makes 10-character ids of letters and digits that do not repeat', () => {
    const ids = Array.from({ length: 2000 }, () => artifactsIdCreate());

    expect(ids.every((id) => /^[0-9A-Za-z]{10}$/.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids.join('')).size).toBe(62);
  });
});
