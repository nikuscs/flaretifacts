import { describe, expect, it } from 'vitest';
import { artifactsBlocksCatalog, artifactsCreateInput } from '@/types/artifacts.types';

describe('artifacts blocks catalog', () => {
  it('lists every block with its description and JSON Schema props', () => {
    expect(Object.keys(artifactsBlocksCatalog)).toHaveLength(56);
    expect(artifactsBlocksCatalog.Checklist).toMatchObject({
      description: expect.stringContaining('$bindState'),
      props: { type: 'object', required: ['items'] },
    });
  });

  it('takes any emoji for an artifact, flags and keycaps too, and nothing else', () => {
    const spec = { root: 'page', elements: { page: { type: 'Separator' } } };

    const valid = (emoji: string) => artifactsCreateInput.safeParse({
      title: 'Trip',
      emoji,
      spec,
    }).success;

    expect(['📊', '🇯🇵', '1️⃣', '👩‍💻'].map(valid)).toEqual([true, true, true, true]);
    expect(['ab', '1'].map(valid)).toEqual([false, false]);
  });
});
