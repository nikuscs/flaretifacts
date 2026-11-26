import { ASSETS } from '@/services/assets/assets.constants';
import * as AssetsUtils from '@/services/assets/assets.utils';
import { errorsCreate, errorsResultOf } from '@/utils/errors.utils';
import type * as AssetsTypes from '@/types/assets.types';
import type { Deps } from '@/types/deps.types';

export async function assetsUpload(deps: Deps, params: AssetsTypes.AssetsUploadInput): Promise<AssetsTypes.AssetsAsset> {
  await AssetsUtils.assetsArtifactCheck(deps, params.artifactId);

  const bytes = params.url ? await AssetsUtils.assetsDownload(params.url) : AssetsUtils.assetsBase64Decode(params.base64 ?? '');
  const mimeType = AssetsUtils.assetsCheck(bytes);

  if ((await AssetsUtils.assetsStored(deps, params.artifactId)).length >= ASSETS.perArtifactMax) {
    throw errorsCreate('ASSET_LIMIT', { max: ASSETS.perArtifactMax });
  }

  const id = AssetsUtils.assetsIdCreate(mimeType);
  const uploadedAt = Date.now();
  const name = params.name ?? params.url?.split('/').pop() ?? id;

  await deps.assetsBucket.put(AssetsUtils.assetsKey(params.artifactId, id), bytes.slice().buffer, {
    httpMetadata: { contentType: mimeType },
    customMetadata: { name, uploadedAt: String(uploadedAt) },
  });

  return {
    id,
    artifactId: params.artifactId,
    url: AssetsUtils.assetsUrl(deps.appOrigin, params.artifactId, id),
    name,
    mimeType,
    bytes: bytes.length,
    uploadedAt,
  };
}

export async function assetsList(deps: Deps, params: AssetsTypes.AssetsListInput) {
  await AssetsUtils.assetsArtifactCheck(deps, params.artifactId);

  return (await AssetsUtils.assetsStored(deps, params.artifactId))
    .map((stored) => AssetsUtils.assetsAssetOf(deps.appOrigin, params.artifactId, stored))
    .toSorted((a, b) => b.uploadedAt - a.uploadedAt);
}

export async function assetsDelete(deps: Deps, params: AssetsTypes.AssetsDeleteInput) {
  await AssetsUtils.assetsArtifactCheck(deps, params.artifactId);

  const keys = new Set((await AssetsUtils.assetsStored(deps, params.artifactId)).map((stored) => stored.key));

  return Promise.all(params.ids.map(async (id) => {
    try {
      const key = AssetsUtils.assetsKey(params.artifactId, id);

      if (!keys.has(key)) {
        throw errorsCreate('ASSET_NOT_FOUND', { id });
      }

      await deps.assetsBucket.delete([key]);

      return { id, ok: true, error: null };
    } catch (error) {
      return { id, ok: false, error: errorsResultOf(error) };
    }
  }));
}

export async function assetsRemoveAll(deps: Deps, params: AssetsTypes.AssetsListInput) {
  const keys = (await AssetsUtils.assetsStoredAll(deps, params.artifactId)).map((stored) => stored.key);

  if (keys.length > 0) {
    await deps.assetsBucket.delete(keys);
  }
}

export async function assetsServe(deps: Deps, params: AssetsTypes.AssetsServeInput): Promise<Response | null> {
  const [, artifactId, id] = ASSETS.servePath.exec(params.pathname) ?? [];

  if (!artifactId || !id) {
    return null;
  }

  const row = await deps.artifactsStore().get(artifactId, null);
  const stored = row && (row.visibility !== 'private' || deps.user) ? await deps.assetsBucket.get(AssetsUtils.assetsKey(artifactId, id)) : null;

  if (!stored) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(stored.body, {
    headers: {
      ...ASSETS.serveHeaders,
      'content-type': stored.httpMetadata?.contentType ?? 'application/octet-stream',
      'content-length': String(stored.size),
    },
  });
}
