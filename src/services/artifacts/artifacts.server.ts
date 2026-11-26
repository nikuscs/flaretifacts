import { applyOperation } from 'fast-json-patch';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import * as ArtifactsUtils from '@/services/artifacts/artifacts.utils';
import { assetsRemoveAll } from '@/services/assets/assets.server';
import { artifactsBlocksCatalog, artifactsSpec, artifactsSpecJsonSchema } from '@/types/artifacts.types';
import { errorsCreate, errorsResultOf } from '@/utils/errors.utils';
import artifactsGuideMarkdown from './artifacts-guide.md?raw';
import type * as ArtifactsTypes from '@/types/artifacts.types';
import type { Deps } from '@/types/deps.types';

export async function artifactsList(deps: Deps, params: ArtifactsTypes.ArtifactsListInput) {
  const rows = await deps.artifactsStore().list(ARTIFACTS.listLimit);
  const words = params?.search?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];

  return rows
    .filter((row) => words.every((word) => row.title.toLowerCase().includes(word)))
    .filter((row) => !params?.kind || row.kind === params.kind)
    .filter((row) => !params?.visibility || row.visibility === params.visibility)
    .map((row) => ArtifactsUtils.artifactsSummaryOf(row, deps.appOrigin));
}

export function artifactsGuide() {
  return { markdown: artifactsGuideMarkdown };
}

export function artifactsSchema(params: ArtifactsTypes.ArtifactsSchemaInput) {
  const names = params?.blocks;

  return {
    blocks: names ? Object.fromEntries(Object.entries(artifactsBlocksCatalog).filter(([name]) => names.includes(name))) : artifactsBlocksCatalog,
    spec: artifactsSpecJsonSchema,
  };
}

export function artifactsValidate(params: ArtifactsTypes.ArtifactsValidateInput) {
  const issues = ArtifactsUtils.artifactsSpecIssues(params.spec);

  return { ok: issues.length === 0, issues };
}

export async function artifactsGet(deps: Deps, params: ArtifactsTypes.ArtifactsGetInput) {
  const row = await deps.artifactsStore().get(params.id, params.version ?? null);

  if (row) {
    return ArtifactsUtils.artifactsArtifactOf(row, deps.appOrigin);
  }

  if (params.version !== undefined && (await deps.artifactsStore().exists(params.id)) !== null) {
    throw errorsCreate('ARTIFACT_VERSION_NOT_FOUND', { id: params.id, version: params.version });
  }

  throw errorsCreate('ARTIFACT_NOT_FOUND', { id: params.id });
}

export async function artifactsLayout(deps: Deps, params: ArtifactsTypes.ArtifactsGetInput) {
  const artifact = await artifactsGet(deps, params);
  const { state: _state, ...layout } = artifact.spec;

  return { id: artifact.id, version: artifact.version, kind: artifact.kind, layout };
}

export async function artifactsData(deps: Deps, params: ArtifactsTypes.ArtifactsIdInput) {
  const artifact = await artifactsGet(deps, params);

  return { id: artifact.id, version: artifact.version, state: artifact.spec.state };
}

export async function artifactsLink(deps: Deps, params: ArtifactsTypes.ArtifactsIdInput) {
  const artifact = await artifactsGet(deps, params);

  return { id: artifact.id, title: artifact.title, url: artifact.url, visibility: artifact.visibility };
}

export async function artifactsHtml(deps: Deps, params: ArtifactsTypes.ArtifactsIdInput) {
  const artifact = await artifactsGet(deps, params);
  const response = await deps.artifactsPage(`${ARTIFACTS.viewPath}${artifact.id}`, deps.userToken);

  if (!response.ok) {
    throw errorsCreate('UNEXPECTED_ERROR', { detail: `The page answered ${response.status}.` });
  }

  const html = (await response.text())
    .replaceAll(ARTIFACTS.htmlScripts, '')
    .replaceAll(ARTIFACTS.htmlRelativeLinks, `$1${deps.appOrigin}/`);

  return { id: artifact.id, version: artifact.version, html };
}

export async function artifactsVersions(deps: Deps, params: ArtifactsTypes.ArtifactsVersionsInput) {
  const versions = await deps.artifactsStore().versions(params.id);

  if (versions.length === 0) {
    throw errorsCreate('ARTIFACT_NOT_FOUND', { id: params.id });
  }

  return versions;
}

export async function artifactsCreate(deps: Deps, params: ArtifactsTypes.ArtifactsCreateInput) {
  const issues = ArtifactsUtils.artifactsSpecIssues(params.spec);

  if (issues.length > 0) {
    throw errorsCreate('ARTIFACT_SPEC_INVALID', { issues });
  }

  if (params.visibility === 'passcode' && !params.passcode) {
    throw errorsCreate('ARTIFACT_PASSCODE_MISSING', {});
  }

  const written = await deps.artifactsStore().write({
    id: ArtifactsUtils.artifactsIdCreate(),
    expectedVersion: null,
    title: params.title,
    emoji: params.emoji ?? ARTIFACTS.emojiDefault,
    kind: ArtifactsUtils.artifactsKindOf(params.spec),
    visibility: params.visibility,
    passcodeHash: params.visibility === 'passcode' && params.passcode ? await ArtifactsUtils.artifactsPasscodeHash(params.passcode) : null,
    spec: JSON.stringify(params.spec),
    user: deps.user?.login ?? null,
    now: Date.now(),
  });

  if (!written.ok) {
    throw errorsCreate('UNEXPECTED_ERROR', { detail: 'A new artifact id was already taken.' });
  }

  return ArtifactsUtils.artifactsArtifactOf(written.row, deps.appOrigin);
}

export async function artifactsUpdate(deps: Deps, params: ArtifactsTypes.ArtifactsUpdateInput) {
  const row = await deps.artifactsStore().get(params.id, null);

  if (!row) {
    throw errorsCreate('ARTIFACT_NOT_FOUND', { id: params.id });
  }

  const current = ArtifactsUtils.artifactsArtifactOf(row, deps.appOrigin);
  const spec = { ...(params.spec ?? current.spec), state: params.state ?? params.spec?.state ?? current.spec.state };
  const visibility = params.visibility ?? current.visibility;
  const issues = ArtifactsUtils.artifactsSpecIssues(spec);

  if (issues.length > 0) {
    throw errorsCreate('ARTIFACT_SPEC_INVALID', { issues });
  }

  if (visibility === 'passcode' && !params.passcode && !row.passcodeHash) {
    throw errorsCreate('ARTIFACT_PASSCODE_MISSING', {});
  }

  const passcodeHash = params.passcode ? await ArtifactsUtils.artifactsPasscodeHash(params.passcode) : row.passcodeHash;

  const written = await deps.artifactsStore().write({
    id: params.id,
    expectedVersion: params.version,
    title: params.title ?? current.title,
    emoji: params.emoji ?? current.emoji,
    kind: ArtifactsUtils.artifactsKindOf(spec),
    visibility,
    passcodeHash: visibility === 'passcode' ? passcodeHash : null,
    spec: JSON.stringify(spec),
    user: deps.user?.login ?? null,
    now: Date.now(),
  });

  if (!written.ok) {
    throw written.conflict === null ? errorsCreate('ARTIFACT_NOT_FOUND', { id: params.id }) : errorsCreate('ARTIFACT_VERSION_CONFLICT', { id: params.id, version: written.conflict });
  }

  return ArtifactsUtils.artifactsArtifactOf(written.row, deps.appOrigin);
}

export async function artifactsPatch(deps: Deps, params: ArtifactsTypes.ArtifactsPatchInput) {
  const current = await artifactsGet(deps, { id: params.id });

  const patched = params.operations.reduce<object>((spec, operation, index) => {
    try {
      return applyOperation(spec, operation, true, true).newDocument;
    } catch (error) {
      throw errorsCreate('ARTIFACT_PATCH_INVALID', { operation: index, detail: error instanceof Error ? error.message : String(error) });
    }
  }, structuredClone(current.spec));

  const spec = artifactsSpec.safeParse(patched);

  if (!spec.success) {
    throw errorsCreate('ARTIFACT_SPEC_INVALID', { issues: spec.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`) });
  }

  return artifactsUpdate(deps, {
    id: params.id,
    version: params.version,
    title: params.title,
    emoji: params.emoji,
    spec: spec.data,
  });
}

export async function artifactsRestore(deps: Deps, params: ArtifactsTypes.ArtifactsRestoreInput) {
  const earlier = await artifactsGet(deps, { id: params.id, version: params.fromVersion });

  return artifactsUpdate(deps, {
    id: params.id,
    version: params.version,
    title: earlier.title,
    spec: earlier.spec,
  });
}

export async function artifactsDeleteVersions(deps: Deps, params: ArtifactsTypes.ArtifactsDeleteVersionsInput) {
  if (!(await deps.artifactsStore().versionsRemove(params.id, params.versions))) {
    throw errorsCreate('ARTIFACT_NOT_FOUND', { id: params.id });
  }

  return artifactsVersions(deps, { id: params.id });
}

export async function artifactsDelete(deps: Deps, params: ArtifactsTypes.ArtifactsDeleteInput) {
  return Promise.all(params.ids.map(async (id) => {
    try {
      if (!(await deps.artifactsStore().remove(id))) {
        throw errorsCreate('ARTIFACT_NOT_FOUND', { id });
      }

      await assetsRemoveAll(deps, { artifactId: id });

      return { id, ok: true, error: null };
    } catch (error) {
      return { id, ok: false, error: errorsResultOf(error) };
    }
  }));
}

export async function artifactsView(deps: Deps, params: ArtifactsTypes.ArtifactsViewInput) {
  const row = await deps.artifactsStore().get(params.id, null);

  if (!row) {
    throw errorsCreate('ARTIFACT_NOT_FOUND', { id: params.id });
  }

  await ArtifactsUtils.artifactsAccessCheck(row, deps.user, params.passcode);

  return { artifact: ArtifactsUtils.artifactsArtifactOf(row, deps.appOrigin), owner: deps.user !== null };
}

export async function artifactsStateSave(deps: Deps, params: ArtifactsTypes.ArtifactsStateSaveInput) {
  const { artifact, owner } = await artifactsView(deps, params);
  const spec = JSON.stringify({ ...artifact.spec, state: params.state });
  const issues = ArtifactsUtils.artifactsSizeIssues(spec);

  if (issues.length > 0) {
    throw errorsCreate('ARTIFACT_SPEC_INVALID', { issues });
  }

  const written = await deps.artifactsStore().stateSave({
    id: params.id,
    version: params.version,
    spec,
    now: Date.now(),
  });

  if (!written.ok) {
    throw written.conflict === null ? errorsCreate('ARTIFACT_NOT_FOUND', { id: params.id }) : errorsCreate('ARTIFACT_VERSION_CONFLICT', { id: params.id, version: written.conflict });
  }

  return { artifact: ArtifactsUtils.artifactsArtifactOf(written.row, deps.appOrigin), owner };
}

export async function artifactsLive(deps: Deps, request: Request) {
  const url = new URL(request.url);

  await artifactsView(deps, { id: url.pathname.slice(ARTIFACTS.livePath.length), passcode: url.searchParams.get('passcode') ?? undefined });

  return deps.artifactsStore().fetch(request);
}
