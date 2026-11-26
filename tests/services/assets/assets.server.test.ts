import { afterEach, describe, expect, it, vi } from 'vitest';
import * as Artifacts from '@/services/artifacts/artifacts.server';
import * as Assets from '@/services/assets/assets.server';
import { errorsResultOf } from '@/utils/errors.utils';
import { testDepsCreate } from '../../support/deps';
import type { ArtifactsSpec } from '@/types/artifacts.types';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const spec: ArtifactsSpec = { root: 'page', elements: { page: { type: 'Separator', props: {}, children: [] } }, state: {} };

async function errorCode(promise: Promise<object>) {
  return promise.then(() => null, (error: Error['cause']) => errorsResultOf(error).code);
}

function svg(body: string) {
  return btoa(`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${body}</svg>`);
}

describe('assets', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads an image to an artifact, lists it and serves it with safe headers', async () => {
    const { deps } = testDepsCreate();

    const artifact = await Artifacts.artifactsCreate(deps, {
      title: 'Team',
      spec,
      visibility: 'public',
    });

    const asset = await Assets.assetsUpload(deps, {
      artifactId: artifact.id,
      name: 'Ana',
      base64: `data:image/png;base64,${png}`,
    });

    expect(asset).toMatchObject({
      artifactId: artifact.id,
      name: 'Ana',
      mimeType: 'image/png',
      bytes: 70,
    });
    expect(asset.url).toBe(`https://artifacts.test/a/${artifact.id}/assets/${asset.id}`);
    expect(asset.id).toMatch(/^[0-9A-Za-z]{12}\.png$/);
    await expect(Assets.assetsList(deps, { artifactId: artifact.id })).resolves.toEqual([asset]);

    const served = await Assets.assetsServe({ ...deps, user: null }, { pathname: new URL(asset.url).pathname });

    expect(served?.status).toBe(200);
    expect(served?.headers.get('content-type')).toBe('image/png');
    expect(served?.headers.get('content-security-policy')).toContain('sandbox');
    expect(served?.headers.get('x-content-type-options')).toBe('nosniff');
    expect(new Uint8Array(await served?.arrayBuffer() ?? new ArrayBuffer(0)).length).toBe(70);
    await expect(Assets.assetsServe(deps, { pathname: '/a/abc' })).resolves.toBeNull();
  });

  it('serves assets of a private artifact only to someone signed in', async () => {
    const { deps, anonymous } = testDepsCreate();

    const artifact = await Artifacts.artifactsCreate(deps, {
      title: 'Private',
      spec,
      visibility: 'private',
    });

    const asset = await Assets.assetsUpload(deps, { artifactId: artifact.id, base64: png });
    const pathname = new URL(asset.url).pathname;

    expect((await Assets.assetsServe(anonymous, { pathname }))?.status).toBe(404);
    expect((await Assets.assetsServe(deps, { pathname }))?.status).toBe(200);
  });

  it('refuses files that are not images and SVGs that could run code or load files', async () => {
    const { deps } = testDepsCreate();

    const { id: artifactId } = await Artifacts.artifactsCreate(deps, {
      title: 'Logos',
      spec,
      visibility: 'private',
    });

    const unsafe = [
      svg('<script>alert(1)</script>'),
      svg('<rect onload="alert(1)" width="1" height="1"/>'),
      svg('<image href="https://evil.test/x.png"/>'),
      svg('<foreignObject><div>x</div></foreignObject>'),
      svg('<a xlink:href="javascript:alert(1)"><text>x</text></a>'),
      btoa('<html><body>hi</body></html>'),
      'not base64 at all!',
    ];

    const codes = await Promise.all(unsafe.map((base64) => errorCode(Assets.assetsUpload(deps, { artifactId, base64 }))));

    expect(codes).toEqual(unsafe.map(() => 'ASSET_INVALID'));
    await expect(Assets.assetsUpload(deps, {
      artifactId,
      name: 'logo',
      base64: svg('<defs><linearGradient id="g"><stop offset="0" stop-color="#f60"/></linearGradient></defs><circle cx="5" cy="5" r="4" fill="url(#g)"/>'),
    })).resolves.toMatchObject({ mimeType: 'image/svg+xml' });
    await expect(errorCode(Assets.assetsUpload(deps, { artifactId: 'Nope000000', base64: png }))).resolves.toBe('ARTIFACT_NOT_FOUND');
  });

  it('downloads an image from an https link', async () => {
    const { deps } = testDepsCreate();

    const { id: artifactId } = await Artifacts.artifactsCreate(deps, {
      title: 'Links',
      spec,
      visibility: 'private',
    });

    const bytes = Uint8Array.from(atob(png), (char) => char.codePointAt(0) ?? 0);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(bytes, { headers: { 'content-type': 'image/png' } }));

    await expect(Assets.assetsUpload(deps, { artifactId, url: 'https://images.test/ana.png' })).resolves.toMatchObject({ name: 'ana.png', mimeType: 'image/png' });
  });

  it('deletes single assets, and every asset when the artifact goes', async () => {
    const { deps, objects } = testDepsCreate();

    const { id: artifactId } = await Artifacts.artifactsCreate(deps, {
      title: 'Gallery',
      spec,
      visibility: 'private',
    });

    const first = await Assets.assetsUpload(deps, { artifactId, base64: png });

    await Assets.assetsUpload(deps, { artifactId, base64: png });

    await expect(Assets.assetsDelete(deps, { artifactId, ids: [first.id, 'Missing00000.png'] })).resolves.toEqual([
      { id: first.id, ok: true, error: null },
      { id: 'Missing00000.png', ok: false, error: { code: 'ASSET_NOT_FOUND', data: { id: 'Missing00000.png' } } },
    ]);
    expect(objects.size).toBe(1);
    await Artifacts.artifactsDelete(deps, { ids: [artifactId] });
    expect(objects.size).toBe(0);
  });
});
