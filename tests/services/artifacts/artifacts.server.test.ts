import { describe, expect, it } from 'vitest';
import * as Artifacts from '@/services/artifacts/artifacts.server';
import { errorsResultOf } from '@/utils/errors.utils';
import { testDepsCreate } from '../../support/deps';
import type { TestSocket } from '../../support/durable-object';
import type { ArtifactsSpec } from '@/types/artifacts.types';

const checklist: ArtifactsSpec = {
  root: 'page',
  elements: {
    page: { type: 'Stack', props: {}, children: ['title', 'tasks'] },
    title: { type: 'Heading', props: { text: 'Launch plan' }, children: [] },
    tasks: { type: 'Checklist', props: { items: { $bindState: '/tasks' } }, children: [] },
  },
  state: { tasks: [{ title: 'Write copy', done: false }] },
};

const html: ArtifactsSpec = { html: '<h1>Hello</h1>', state: {} };

async function errorCode(promise: Promise<object>) {
  return promise.then(() => null, (error: Error['cause']) => errorsResultOf(error).code);
}

describe('artifacts', () => {
  it('creates a private blocks artifact with its link, and reads it back', async () => {
    const { deps } = testDepsCreate();

    const created = await Artifacts.artifactsCreate(deps, {
      title: 'Launch plan',
      spec: checklist,
      visibility: 'private',
    });

    expect(created).toMatchObject({
      title: 'Launch plan',
      emoji: '📊',
      kind: 'blocks',
      visibility: 'private',
      version: 1,
      createdBy: 'owner@example.com',
    });
    expect(created.id).toMatch(/^[0-9A-Za-z]{10}$/);
    expect(created.url).toBe(`https://artifacts.test/a/${created.id}`);
    await expect(Artifacts.artifactsGet(deps, { id: created.id })).resolves.toEqual(created);
    await expect(Artifacts.artifactsList(deps, undefined)).resolves.toEqual([expect.objectContaining({ id: created.id, kind: 'blocks' })]);
  });

  it('refuses a spec that does not render', async () => {
    const { deps } = testDepsCreate();

    const unknownBlock = { root: 'page', elements: { page: { type: 'Carousel', props: {}, children: [] } }, state: {} };
    const badProps = { root: 'page', elements: { page: { type: 'Heading', props: { level: '9' }, children: [] } }, state: {} };
    const orphan = { root: 'page', elements: { page: { type: 'Separator', props: {}, children: [] }, lost: { type: 'Separator', props: {}, children: [] } }, state: {} };

    const codes = await Promise.all([unknownBlock, badProps, orphan].map((spec) => errorCode(Artifacts.artifactsCreate(deps, {
      title: 'Bad',
      spec,
      visibility: 'private',
    }))));

    expect(codes).toEqual(['ARTIFACT_SPEC_INVALID', 'ARTIFACT_SPEC_INVALID', 'ARTIFACT_SPEC_INVALID']);
  });

  it('updates as a new version only from the version read, tells open pages, and keeps the last ten', async () => {
    const { deps, sockets } = testDepsCreate();

    const created = await Artifacts.artifactsCreate(deps, {
      title: 'Page',
      spec: html,
      visibility: 'public',
    });

    const viewer: TestSocket = {
      tags: [created.id],
      sent: [],
      closed: null,
    };

    sockets.push(viewer);

    await expect(errorCode(Artifacts.artifactsUpdate(deps, {
      id: created.id,
      version: 2,
      title: 'Stale',
    }))).resolves.toBe('ARTIFACT_VERSION_CONFLICT');

    const version = await Array.from({ length: 11 }, (_, index) => index).reduce(async (previous, index) => {
      const updated = await Artifacts.artifactsUpdate(deps, {
        id: created.id,
        version: await previous,
        title: `Page ${index}`,
      });

      return updated.version;
    }, Promise.resolve(created.version));

    const versions = await Artifacts.artifactsVersions(deps, { id: created.id });

    expect(version).toBe(12);
    expect(versions.map((item) => item.version)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
    await expect(errorCode(Artifacts.artifactsGet(deps, { id: created.id, version: 1 }))).resolves.toBe('ARTIFACT_VERSION_NOT_FOUND');
    expect(viewer.sent).toHaveLength(11);
    expect(JSON.parse(viewer.sent.at(-1) ?? '{}')).toEqual({ type: 'updated', version: 12 });
  });

  it('restores an earlier version as the newest one', async () => {
    const { deps } = testDepsCreate();

    const created = await Artifacts.artifactsCreate(deps, {
      title: 'First',
      spec: html,
      visibility: 'private',
    });

    const updated = await Artifacts.artifactsUpdate(deps, {
      id: created.id,
      version: 1,
      title: 'Second',
      spec: { html: '<p>Two</p>', state: {} },
    });

    const restored = await Artifacts.artifactsRestore(deps, {
      id: created.id,
      version: updated.version,
      fromVersion: 1,
    });

    expect(restored).toMatchObject({
      version: 3,
      title: 'First',
      spec: html,
    });
  });

  it('deletes earlier versions and always keeps the current one', async () => {
    const { deps } = testDepsCreate();

    const created = await Artifacts.artifactsCreate(deps, {
      title: 'First',
      spec: html,
      visibility: 'private',
    });

    await Artifacts.artifactsUpdate(deps, {
      id: created.id,
      version: 1,
      title: 'Second',
    });
    await Artifacts.artifactsUpdate(deps, {
      id: created.id,
      version: 2,
      title: 'Third',
    });

    const left = await Artifacts.artifactsDeleteVersions(deps, { id: created.id, versions: [1, 3] });

    expect(left.map((item) => item.version)).toEqual([3, 2]);
    await expect(errorCode(Artifacts.artifactsGet(deps, { id: created.id, version: 1 }))).resolves.toBe('ARTIFACT_VERSION_NOT_FOUND');
    await expect(Artifacts.artifactsGet(deps, { id: created.id })).resolves.toMatchObject({ version: 3, title: 'Third' });
    await expect(errorCode(Artifacts.artifactsDeleteVersions(deps, { id: 'missing000', versions: [1] }))).resolves.toBe('ARTIFACT_NOT_FOUND');
  });

  it('opens public links for anyone, private links only for the owner, passcode links with the passcode', async () => {
    const { deps, anonymous } = testDepsCreate();

    const open = await Artifacts.artifactsCreate(deps, {
      title: 'Open',
      spec: html,
      visibility: 'public',
    });

    const closed = await Artifacts.artifactsCreate(deps, {
      title: 'Closed',
      spec: html,
      visibility: 'private',
    });

    const coded = await Artifacts.artifactsCreate(deps, {
      title: 'Coded',
      spec: html,
      visibility: 'passcode',
      passcode: 'tangerine',
    });

    await expect(Artifacts.artifactsView(anonymous, { id: open.id })).resolves.toMatchObject({ owner: false, artifact: { title: 'Open' } });
    await expect(errorCode(Artifacts.artifactsView(anonymous, { id: closed.id }))).resolves.toBe('ARTIFACT_SIGN_IN_REQUIRED');
    await expect(Artifacts.artifactsView(deps, { id: closed.id })).resolves.toMatchObject({ owner: true });
    await expect(errorCode(Artifacts.artifactsView(anonymous, { id: coded.id }))).resolves.toBe('ARTIFACT_PASSCODE_REQUIRED');
    await expect(errorCode(Artifacts.artifactsView(anonymous, { id: coded.id, passcode: 'orange' }))).resolves.toBe('ARTIFACT_PASSCODE_WRONG');
    await expect(Artifacts.artifactsView(anonymous, { id: coded.id, passcode: 'tangerine' })).resolves.toMatchObject({ owner: false, artifact: { title: 'Coded' } });
    await expect(errorCode(Artifacts.artifactsCreate(deps, {
      title: 'No code',
      spec: html,
      visibility: 'passcode',
    }))).resolves.toBe('ARTIFACT_PASSCODE_MISSING');
  });

  it('keeps the passcode across updates and drops it when the artifact goes public', async () => {
    const { deps, anonymous } = testDepsCreate();

    const coded = await Artifacts.artifactsCreate(deps, {
      title: 'Coded',
      spec: html,
      visibility: 'passcode',
      passcode: 'tangerine',
    });

    const renamed = await Artifacts.artifactsUpdate(deps, {
      id: coded.id,
      version: 1,
      title: 'Renamed',
    });

    await expect(Artifacts.artifactsView(anonymous, { id: coded.id, passcode: 'tangerine' })).resolves.toMatchObject({ artifact: { title: 'Renamed' } });

    await Artifacts.artifactsUpdate(deps, {
      id: coded.id,
      version: renamed.version,
      visibility: 'public',
    });

    await expect(Artifacts.artifactsView(anonymous, { id: coded.id })).resolves.toMatchObject({ artifact: { visibility: 'public' } });
  });

  it('saves state from the page on the current version without a new one', async () => {
    const { deps, anonymous } = testDepsCreate();

    const created = await Artifacts.artifactsCreate(deps, {
      title: 'Plan',
      spec: checklist,
      visibility: 'public',
    });

    const state = { tasks: [{ title: 'Write copy', done: true }] };

    const saved = await Artifacts.artifactsStateSave(anonymous, {
      id: created.id,
      version: 1,
      state,
    });

    expect(saved.artifact).toMatchObject({ version: 1, spec: { state } });
    await expect(Artifacts.artifactsGet(deps, { id: created.id })).resolves.toMatchObject({ version: 1, spec: { state } });
    await expect(errorCode(Artifacts.artifactsStateSave(anonymous, {
      id: created.id,
      version: 2,
      state,
    }))).resolves.toBe('ARTIFACT_VERSION_CONFLICT');
    await expect(errorCode(Artifacts.artifactsStateSave(anonymous, {
      id: created.id,
      version: 1,
      state: { tasks: [{ title: 'x'.repeat(2_100_000), done: false }] },
    }))).resolves.toBe('ARTIFACT_SPEC_INVALID');

    const updated = await Artifacts.artifactsUpdate(deps, {
      id: created.id,
      version: 1,
      title: 'Plan v2',
    });

    expect(updated.spec.state).toEqual(state);
  });

  it('refuses state saves on a private artifact from someone signed out', async () => {
    const { deps, anonymous } = testDepsCreate();

    const created = await Artifacts.artifactsCreate(deps, {
      title: 'Plan',
      spec: checklist,
      visibility: 'private',
    });

    await expect(errorCode(Artifacts.artifactsStateSave(anonymous, {
      id: created.id,
      version: 1,
      state: {},
    }))).resolves.toBe('ARTIFACT_SIGN_IN_REQUIRED');
  });

  it('deletes artifacts with one result per id', async () => {
    const { deps } = testDepsCreate();

    const created = await Artifacts.artifactsCreate(deps, {
      title: 'Gone',
      spec: html,
      visibility: 'private',
    });

    const missing = 'Missing123';

    await expect(Artifacts.artifactsDelete(deps, { ids: [created.id, missing] })).resolves.toEqual([
      { id: created.id, ok: true, error: null },
      { id: missing, ok: false, error: { code: 'ARTIFACT_NOT_FOUND', data: { id: missing } } },
    ]);
    await expect(Artifacts.artifactsList(deps, undefined)).resolves.toEqual([]);
    await expect(errorCode(Artifacts.artifactsVersions(deps, { id: created.id }))).resolves.toBe('ARTIFACT_NOT_FOUND');
  });

  it('finds artifacts by words in the title, kind and visibility', async () => {
    const { deps } = testDepsCreate();

    const plan = await Artifacts.artifactsCreate(deps, {
      title: 'Launch plan',
      spec: checklist,
      visibility: 'public',
    });

    const notes = await Artifacts.artifactsCreate(deps, {
      title: 'Launch notes',
      spec: html,
      visibility: 'private',
    });

    await expect(Artifacts.artifactsList(deps, { search: 'launch' })).resolves.toHaveLength(2);
    await expect(Artifacts.artifactsList(deps, { search: 'PLAN launch' })).resolves.toEqual([expect.objectContaining({ id: plan.id })]);
    await expect(Artifacts.artifactsList(deps, { kind: 'html' })).resolves.toEqual([expect.objectContaining({ id: notes.id })]);
    await expect(Artifacts.artifactsList(deps, { visibility: 'public' })).resolves.toEqual([expect.objectContaining({ id: plan.id })]);
  });

  it('reads the layout, the data and the link apart', async () => {
    const { deps } = testDepsCreate();

    const created = await Artifacts.artifactsCreate(deps, {
      title: 'Plan',
      spec: checklist,
      visibility: 'passcode',
      passcode: 'tangerine',
    });

    const layout = await Artifacts.artifactsLayout(deps, { id: created.id });

    expect(layout).toMatchObject({
      version: 1,
      kind: 'blocks',
      layout: { root: 'page' },
    });
    expect(layout.layout).not.toHaveProperty('state');
    await expect(Artifacts.artifactsData(deps, { id: created.id })).resolves.toEqual({
      id: created.id,
      version: 1,
      state: checklist.state,
    });
    await expect(Artifacts.artifactsLink(deps, { id: created.id })).resolves.toEqual({
      id: created.id,
      title: 'Plan',
      url: created.url,
      visibility: 'passcode',
    });
  });

  it('renders the page as HTML without scripts and with absolute links, as the caller', async () => {
    const { deps, pages } = testDepsCreate();

    const created = await Artifacts.artifactsCreate(deps, {
      title: 'Plan',
      spec: checklist,
      visibility: 'private',
    });

    const { html: page } = await Artifacts.artifactsHtml(deps, { id: created.id });

    expect(pages).toEqual([{ path: `/a/${created.id}`, accessToken: 'owner-token' }]);
    expect(page).not.toContain('<script');
    expect(page).toContain('href="https://artifacts.test/assets/app.css"');
    expect(page).toContain('src="https://artifacts.test/favicon.ico"');
    expect(page).toContain('<h1>Plan</h1>');
  });

  it('patches values, adds blocks and keeps the change all or nothing', async () => {
    const { deps } = testDepsCreate();

    const created = await Artifacts.artifactsCreate(deps, {
      title: 'Plan',
      spec: checklist,
      visibility: 'private',
    });

    const patched = await Artifacts.artifactsPatch(deps, {
      id: created.id,
      version: 1,
      title: 'Plan v2',
      operations: [
        { op: 'replace', path: '/state/tasks/0/done', value: true },
        { op: 'add', path: '/elements/note', value: { type: 'Text', props: { text: 'Due Friday' }, children: [] } },
        { op: 'add', path: '/elements/page/children/-', value: 'note' },
      ],
    });

    expect(patched).toMatchObject({
      version: 2,
      title: 'Plan v2',
      spec: { state: { tasks: [{ done: true }] }, elements: { note: { type: 'Text' } } },
    });

    const broken = await errorCode(Artifacts.artifactsPatch(deps, {
      id: created.id,
      version: 2,
      operations: [{ op: 'replace', path: '/state/tasks/0/done', value: false }, { op: 'remove', path: '/elements/missing' }],
    }));

    const orphan = await errorCode(Artifacts.artifactsPatch(deps, {
      id: created.id,
      version: 2,
      operations: [{ op: 'add', path: '/elements/lost', value: { type: 'Separator', props: {}, children: [] } }],
    }));

    expect(broken).toBe('ARTIFACT_PATCH_INVALID');
    expect(orphan).toBe('ARTIFACT_SPEC_INVALID');
    await expect(Artifacts.artifactsData(deps, { id: created.id })).resolves.toMatchObject({ version: 2, state: { tasks: [{ done: true }] } });
  });

  it('validates a spec without saving it', () => {
    expect(Artifacts.artifactsValidate({ spec: checklist })).toEqual({ ok: true, issues: [] });
    expect(Artifacts.artifactsValidate({ spec: { root: 'page', elements: {}, state: {} } })).toMatchObject({ ok: false });
  });

  it('takes pages up to two megabytes of data and refuses bigger ones', async () => {
    const { deps } = testDepsCreate();
    const rows = (count: number) => Array.from({ length: count }, (_, index) => ({ seller: `Seller ${index} ${'x'.repeat(480)}`, status: 'Flagged' }));

    const sized = (count: number): ArtifactsSpec => ({
      root: 'page',
      elements: {
        page: {
          type: 'DataTable',
          props: { columns: [{ key: 'seller', label: 'Seller' }, { key: 'status', label: 'Status', type: 'badge' }], rows: { $state: '/rows' } },
          children: [],
        },
      },
      state: { rows: rows(count) },
    });

    const created = await Artifacts.artifactsCreate(deps, {
      title: 'Sellers',
      spec: sized(1200),
      visibility: 'private',
    });

    await expect(Artifacts.artifactsData(deps, { id: created.id })).resolves.toMatchObject({ version: 1 });
    expect(Artifacts.artifactsValidate({ spec: sized(5000) })).toMatchObject({ ok: false, issues: [expect.stringContaining('the most is 2000000')] });
  });

  it('lists only blocks the schema knows when asked for some', () => {
    expect(Object.keys(Artifacts.artifactsSchema({ blocks: ['Metric', 'Nope'] }).blocks)).toEqual(['Metric']);
    expect(Artifacts.artifactsSchema(undefined).blocks.Metric).toMatchObject({ props: { type: 'object' } });
  });

  it('teaches agents the tools in its guide', () => {
    const { markdown } = Artifacts.artifactsGuide();

    expect(markdown).toContain('artifacts_patch');
    expect(markdown).toContain('$state');
  });
});
