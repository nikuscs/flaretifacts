import { describe, expect, it } from 'vitest';
import * as Artifacts from '@/services/artifacts/artifacts.server';
import * as Assets from '@/services/assets/assets.server';
import { OG } from '@/services/og/og.constants';
import { ogServe } from '@/services/og/og.server';
import { ogCardElement, ogSite } from '@/services/og/og.utils';
import { testDepsCreate } from '../../support/deps';
import type { ArtifactsSpec } from '@/types/artifacts.types';

const spec: ArtifactsSpec = { root: 'page', elements: { page: { type: 'Separator', props: {}, children: [] } }, state: {} };

describe('og', () => {
  it('renders a public card once, keeps it with the artifact and out of its assets', async () => {
    const { deps, objects } = testDepsCreate();

    const artifact = await Artifacts.artifactsCreate(deps, {
      title: 'Trip',
      emoji: '🌍',
      spec,
      visibility: 'public',
    });

    const first = await ogServe(deps, { pathname: `/a/${artifact.id}/og.png` });

    expect(first?.status).toBe(200);
    expect(first?.headers.get('content-type')).toBe('image/png');
    expect([...objects.keys()]).toEqual([expect.stringMatching(new RegExp(`^${artifact.id}/og/[0-9a-f]{16}\\.png$`))]);
    await expect(Assets.assetsList(deps, { artifactId: artifact.id })).resolves.toEqual([]);
    await ogServe(deps, { pathname: `/a/${artifact.id}/og.png` });
    expect(objects.size).toBe(1);
    await Artifacts.artifactsDelete(deps, { ids: [artifact.id] });
    expect(objects.size).toBe(0);
  });

  it('shows one locked card for private and passcode artifacts, and nothing for other paths', async () => {
    const { deps, objects } = testDepsCreate();

    const artifact = await Artifacts.artifactsCreate(deps, {
      title: 'Salaries',
      spec,
      visibility: 'private',
    });

    expect((await ogServe(deps, { pathname: `/a/${artifact.id}/og.png` }))?.status).toBe(200);
    expect([...objects.keys()]).toEqual(['og/locked-v2.png']);
    expect((await ogServe(deps, { pathname: '/a/Missing000/og.png' }))?.status).toBe(404);
    await expect(ogServe(deps, { pathname: `/a/${artifact.id}` })).resolves.toBeNull();
  });

  it('uses the APP_ORIGIN host on the card and falls back to the request host when unset', () => {
    expect(ogSite('https://docs.example.com', 'fallback.test')).toBe('docs.example.com');
    expect(ogSite('', 'fallback.test')).toBe('fallback.test');
    expect(ogSite('')).toBe('');
    expect(JSON.stringify(ogCardElement({
      emoji: '🌍',
      title: 'Trip',
      subtitle: OG.subtitle,
      site: 'docs.example.com',
    }))).toContain('docs.example.com');
  });
});
