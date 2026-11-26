import { artifactsIdCreate } from '@/services/artifacts/artifacts.utils';
import { ASSETS } from '@/services/assets/assets.constants';
import { assetsMetadata, assetsMimeType } from '@/types/assets.types';
import { errorsCreate } from '@/utils/errors.utils';
import type * as AssetsTypes from '@/types/assets.types';
import type { Deps } from '@/types/deps.types';

function assetsStartsWith(bytes: Uint8Array, offset: number, signature: ArrayLike<number>) {
  return Array.from(signature).every((byte, index) => bytes[offset + index] === byte);
}

function assetsAscii(text: string) {
  return new TextEncoder().encode(text);
}

function assetsMimeTypeOf(bytes: Uint8Array): AssetsTypes.AssetsMimeType | null {
  if (assetsStartsWith(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }

  if (assetsStartsWith(bytes, 0, [0xff, 0xd8, 0xff])) {
    return 'image/jpeg';
  }

  if (assetsStartsWith(bytes, 0, assetsAscii('GIF87a')) || assetsStartsWith(bytes, 0, assetsAscii('GIF89a'))) {
    return 'image/gif';
  }

  if (assetsStartsWith(bytes, 0, assetsAscii('RIFF')) && assetsStartsWith(bytes, 8, assetsAscii('WEBP'))) {
    return 'image/webp';
  }

  if (assetsStartsWith(bytes, 4, assetsAscii('ftypavif')) || assetsStartsWith(bytes, 4, assetsAscii('ftypavis'))) {
    return 'image/avif';
  }

  return ASSETS.svgStart.test(new TextDecoder().decode(bytes.subarray(0, 4096))) ? 'image/svg+xml' : null;
}

function assetsSvgIssue(bytes: Uint8Array): string | null {
  const text = new TextDecoder().decode(bytes);
  const unsafe = ASSETS.svgUnsafe.find((pattern) => pattern.test(text));

  return unsafe ? `The SVG has content that could run code or load other files (${unsafe.source}); send a plain SVG with shapes, text and local gradients only.` : null;
}

export function assetsCheck(bytes: Uint8Array): AssetsTypes.AssetsMimeType {
  if (bytes.length === 0 || bytes.length > ASSETS.bytesMax) {
    throw errorsCreate('ASSET_INVALID', { reason: `The image is ${bytes.length} bytes; it must be 1 to ${ASSETS.bytesMax}.` });
  }

  const mimeType = assetsMimeTypeOf(bytes);

  if (!mimeType) {
    throw errorsCreate('ASSET_INVALID', { reason: 'The file is not a PNG, JPEG, GIF, WebP, AVIF or SVG image.' });
  }

  const svgIssue = mimeType === 'image/svg+xml' ? assetsSvgIssue(bytes) : null;

  if (svgIssue) {
    throw errorsCreate('ASSET_INVALID', { reason: svgIssue });
  }

  return mimeType;
}

export function assetsBase64Decode(base64: string): Uint8Array {
  try {
    return Uint8Array.from(atob(base64.replace(/^data:[^,]*,/, '').replaceAll(/\s/g, '')), (char) => char.codePointAt(0) ?? 0);
  } catch {
    throw errorsCreate('ASSET_INVALID', { reason: 'The base64 does not decode.' });
  }
}

export async function assetsDownload(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(ASSETS.fetchTimeoutMs), headers: { accept: 'image/*' } }).catch(() => null);

  if (!response?.ok) {
    throw errorsCreate('ASSET_INVALID', { reason: `Could not download ${url}${response ? ` (HTTP ${response.status})` : ''}.` });
  }

  if (Number(response.headers.get('content-length') ?? 0) > ASSETS.bytesMax) {
    throw errorsCreate('ASSET_INVALID', { reason: `The image is over ${ASSETS.bytesMax} bytes.` });
  }

  return new Uint8Array(await response.arrayBuffer());
}

export function assetsIdCreate(mimeType: AssetsTypes.AssetsMimeType) {
  return `${artifactsIdCreate(ASSETS.idLength)}.${ASSETS.extensions[mimeType]}`;
}

export function assetsKey(artifactId: string, id: string) {
  return `${artifactId}/${id}`;
}

export function assetsUrl(appOrigin: string, artifactId: string, id: string) {
  return `${appOrigin}/a/${artifactId}${ASSETS.pathPart}${id}`;
}

export async function assetsArtifactCheck(deps: Deps, artifactId: string) {
  if ((await deps.artifactsStore().exists(artifactId)) === null) {
    throw errorsCreate('ARTIFACT_NOT_FOUND', { id: artifactId });
  }
}

export async function assetsStoredAll(deps: Deps, artifactId: string) {
  const page = await deps.assetsBucket.list({
    prefix: `${artifactId}/`,
    include: ['httpMetadata', 'customMetadata'],
  });

  return page.objects;
}

export async function assetsStored(deps: Deps, artifactId: string) {
  return (await assetsStoredAll(deps, artifactId)).filter((stored) => ASSETS.idPattern.test(stored.key.slice(artifactId.length + 1)));
}

export function assetsAssetOf(appOrigin: string, artifactId: string, stored: AssetsTypes.AssetsStored): AssetsTypes.AssetsAsset {
  const id = stored.key.slice(artifactId.length + 1);
  const metadata = assetsMetadata.safeParse(stored.customMetadata);
  const mimeType = assetsMimeType.safeParse(stored.httpMetadata?.contentType);

  return {
    id,
    artifactId,
    url: assetsUrl(appOrigin, artifactId, id),
    name: metadata.success ? metadata.data.name : id,
    mimeType: mimeType.success ? mimeType.data : 'image/png',
    bytes: stored.size,
    uploadedAt: metadata.success ? metadata.data.uploadedAt : 0,
  };
}
