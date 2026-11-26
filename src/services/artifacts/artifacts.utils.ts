import { getByPath, resolveElementProps, resolveRepeatStatePath, validateSpec } from '@json-render/core';
import { match, P } from 'ts-pattern';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import { artifactsBlocksComponents } from '@/types/artifacts-blocks.types';
import { artifactsBinding, artifactsBlockProps, artifactsJsonList, artifactsSpec } from '@/types/artifacts.types';
import { dataTableBound, dataTableRows } from '@/utils/data-table.utils';
import { errorsCreate } from '@/utils/errors.utils';
import type * as ArtifactsTypes from '@/types/artifacts.types';
import type { UsersIdentity } from '@/types/users.types';

export function artifactsKindOf(spec: ArtifactsTypes.ArtifactsSpec): ArtifactsTypes.ArtifactsKind {
  return match(spec)
    .with({ html: P.string }, () => 'html' as const)
    .otherwise(() => 'blocks' as const);
}

export function artifactsSummaryOf(row: ArtifactsTypes.ArtifactsRowSummary, appOrigin: string): ArtifactsTypes.ArtifactsSummary {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    kind: row.kind,
    visibility: row.visibility,
    version: row.version,
    url: `${appOrigin}${ARTIFACTS.viewPath}${row.id}`,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function artifactsArtifactOf(row: ArtifactsTypes.ArtifactsRow, appOrigin: string): ArtifactsTypes.ArtifactsArtifact {
  return { ...artifactsSummaryOf(row, appOrigin), spec: artifactsSpec.parse(JSON.parse(row.spec)) };
}

function artifactsHasTree(spec: ArtifactsTypes.ArtifactsBlocksSpec) {
  const seen = new Set<string>();
  const pending = [{ id: spec.root, depth: 1 }];

  for (let next = pending.pop(); next; next = pending.pop()) {
    if (next.depth > ARTIFACTS.depthMax || seen.has(next.id) || !Object.hasOwn(spec.elements, next.id)) {
      return false;
    }

    seen.add(next.id);
    pending.push(...spec.elements[next.id].children.map((child) => ({ id: child, depth: next.depth + 1 })));
  }

  return seen.size === Object.keys(spec.elements).length;
}

function artifactsScopes(list: ArtifactsTypes.ArtifactsJson[], basePath: string | null): ArtifactsTypes.ArtifactsScope[] {
  return list.slice(0, ARTIFACTS.scopeSamples).map((item, index) => ({ item, index, basePath: basePath === null ? null : `${basePath}/${index}` }));
}

function artifactsRowsPath(rows: ArtifactsTypes.ArtifactsJson | undefined, scope: ArtifactsTypes.ArtifactsScope | null) {
  const bound = artifactsBinding.safeParse(rows).data;
  const field = bound?.$item ?? bound?.$bindItem;

  if (field !== undefined) {
    return scope?.basePath ? `${scope.basePath}${field ? `/${field}` : ''}` : null;
  }

  return bound?.$state ?? bound?.$bindState ?? null;
}

function artifactsElementIssues(spec: ArtifactsTypes.ArtifactsBlocksSpec, key: string, scopes: (ArtifactsTypes.ArtifactsScope | null)[]): string[] {
  const element = spec.elements[key];
  const props = artifactsBlockProps.get(element.type);

  if (!props) {
    return [`${key}: ${element.type} is not a block.`];
  }

  const raw = JSON.stringify(element.props);
  const issues = new Set<string>();
  const inner: (ArtifactsTypes.ArtifactsScope | null)[] = [];

  for (const scope of scopes) {
    if (scope === null && /"\$(?:item|bindItem|index)"/.test(raw)) {
      issues.add(`${key}: { "$item" }, { "$bindItem" } and { "$index" } read the current row, so they only work inside a DataTable's children or an element with repeat.`);
      continue;
    }

    if (scope?.basePath === null && raw.includes('"$bindItem"')) {
      issues.add(`${key}: { "$bindItem" } saves onto the row, so the table's rows must be objects in the page data, bound with rows: { "$state": "/path" }.`);
    }

    const resolved = resolveElementProps(element.props, {
      stateModel: spec.state,
      repeatItem: scope?.item,
      repeatIndex: scope?.index,
      repeatBasePath: scope?.basePath ?? undefined,
    });

    const parsed = props.safeParse(resolved);

    if (!parsed.success && ![...issues].some((issue) => issue.startsWith(`${key} (`))) {
      const where = scope ? ` in row ${scope.index + 1}` : '';

      issues.add(`${key} (${element.type})${where}: ${parsed.error.issues.map((issue) => `${issue.path.join('.') || 'props'} ${issue.message}`).join('; ')}`);
    }

    const repeatPath = element.repeat ? resolveRepeatStatePath(element.repeat.statePath, scope?.basePath) : undefined;

    if (element.repeat) {
      inner.push(...artifactsScopes(artifactsJsonList.parse(repeatPath === undefined ? [] : getByPath(spec.state, repeatPath)), repeatPath ?? null));
    } else if (element.type === 'DataTable') {
      const rows = artifactsBlocksComponents.DataTable.props.shape.rows.catch([]).parse(resolved.rows);
      const rowsPath = Array.isArray(rows) ? artifactsRowsPath(element.props.rows, scope) : null;

      inner.push(...artifactsScopes(dataTableRows(rows), rowsPath));
    } else {
      inner.push(scope);
    }
  }

  return [...[...issues].slice(0, ARTIFACTS.scopeSamples), ...element.children.flatMap((child) => artifactsElementIssues(spec, child, inner))];
}

function artifactsBlocksIssues(spec: ArtifactsTypes.ArtifactsBlocksSpec): string[] {
  if (!artifactsHasTree(spec)) {
    return ['Every element must be reached exactly once from root through children, with no cycles and at most 32 levels deep.'];
  }

  return [
    ...validateSpec(dataTableBound(spec)).issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message),
    ...artifactsElementIssues(spec, spec.root, [null]),
  ];
}

export function artifactsSizeIssues(json: string): string[] {
  const bytes = new TextEncoder().encode(json).length;

  return bytes > ARTIFACTS.specBytesMax ? [`The spec is ${bytes} bytes; the most is ${ARTIFACTS.specBytesMax}.`] : [];
}

export function artifactsSpecIssues(spec: ArtifactsTypes.ArtifactsSpec): string[] {
  const sizeIssues = artifactsSizeIssues(JSON.stringify(spec));

  if (sizeIssues.length > 0) {
    return sizeIssues;
  }

  return match(spec)
    .with({ html: P.string }, () => [])
    .otherwise(artifactsBlocksIssues);
}

function artifactsBase64(bytes: ArrayBuffer | Uint8Array<ArrayBuffer>) {
  return btoa(String.fromCodePoint(...new Uint8Array(bytes)));
}

async function artifactsPasscodeDerive(passcode: string, salt: Uint8Array<ArrayBuffer>) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(passcode), 'PBKDF2', false, ['deriveBits']);

  return crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt,
    iterations: ARTIFACTS.passcodeIterations,
  }, key, 256);
}

export async function artifactsPasscodeHash(passcode: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  return `${artifactsBase64(salt)}:${artifactsBase64(await artifactsPasscodeDerive(passcode, salt))}`;
}

export async function artifactsAccessCheck(row: ArtifactsTypes.ArtifactsRowSummary, user: UsersIdentity | null, passcode: string | undefined) {
  if (user || row.visibility === 'public') {
    return;
  }

  if (row.visibility === 'private') {
    throw errorsCreate('ARTIFACT_SIGN_IN_REQUIRED', { id: row.id });
  }

  if (!passcode) {
    throw errorsCreate('ARTIFACT_PASSCODE_REQUIRED', { id: row.id });
  }

  const [salt = '', expected = ''] = (row.passcodeHash ?? '').split(':');
  const actual = artifactsBase64(await artifactsPasscodeDerive(passcode, Uint8Array.from(atob(salt), (char) => char.codePointAt(0) ?? 0)));
  let difference = actual.length ^ expected.length;

  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }

  if (!row.passcodeHash || difference !== 0) {
    throw errorsCreate('ARTIFACT_PASSCODE_WRONG', { id: row.id });
  }
}

export function artifactsIdCreate(length: number = ARTIFACTS.idLength): string {
  const alphabet = ARTIFACTS.idAlphabet;
  const limit = 256 - (256 % alphabet.length);
  const bytes = [...crypto.getRandomValues(new Uint8Array(length * 2))].filter((byte) => byte < limit);

  return bytes.length < length
    ? artifactsIdCreate(length)
    : bytes.slice(0, length).map((byte) => alphabet[byte % alphabet.length]).join('');
}
