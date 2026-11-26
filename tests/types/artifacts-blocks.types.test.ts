import { describe, expect, it } from 'vitest';
import { artifactsSpecIssues } from '@/services/artifacts/artifacts.utils';
import { artifactsSpec } from '@/types/artifacts.types';

const picture = 'https://example.com/a/AbCdEfGh12/assets/ana.png';

const people = {
  root: 'page',
  elements: {
    page: { type: 'Stack', children: ['team', 'directory', 'shifts', 'birthdays', 'board', 'ana', 'crew', 'links'] },
    team: { type: 'Filters', props: { value: { $bindState: '/team' }, options: [{ value: 'Design', emoji: '🎨', count: 1 }, { value: 'Sales', icon: 'briefcase' }] } },
    directory: {
      type: 'DataTable',
      props: {
        columns: [{ key: 'photo', label: 'Name', type: 'avatar', labelKey: 'name' }, { key: 'team', label: 'Team', type: 'badge' }, { key: 'city', label: 'City' }],
        rows: [{ photo: picture, name: 'Ana', team: 'Design', city: 'Lisbon' }, { photo: null, name: 'Rui', team: 'Sales', city: 'Porto' }],
        filters: [{ key: 'city' }, { key: 'team', label: 'Team', type: 'dropdown', options: ['Design', 'Sales'] }],
        where: { team: { $state: '/team' } },
        pageSize: 10,
      },
    },
    shifts: { type: 'Table', props: { columns: [{ key: 'who', label: 'Who' }], rows: [{ who: 'Ana', team: 'Design' }], where: { team: { $state: '/team' } }, pageSize: 5 } },
    birthdays: { type: 'List', props: { items: [{ title: '🎈 Ana', meta: '3 Dec', team: 'Design' }], where: { team: { $state: '/team' } }, pageSize: 5 } },
    board: { type: 'Kanban', props: { columns: [{ title: 'To do', cards: [{ title: 'Logo', assignee: 'Ana', team: 'Design' }] }], where: { team: { $state: '/team' } } } },
    ana: { type: 'Avatar', props: { name: 'Ana Silva', src: picture, description: 'Designer', size: 'lg', tone: 'success' } },
    crew: { type: 'AvatarGroup', props: { max: 3, people: [{ name: 'Ana', src: 'https://api.dicebear.com/9.x/notionists/svg?seed=Ana' }, { name: 'Bot', emoji: '🤖' }, { name: 'Rui' }] } },
    links: { type: 'Dropdown', props: { label: 'Handbook', emoji: '📚', items: [{ label: 'Onboarding', url: 'https://example.com/onboarding', icon: 'rocket', description: 'First two weeks' }] } },
  },
  state: { team: 'all' },
};

describe('artifacts blocks for people, filters and links', () => {
  it('accepts avatars, filters bound to state and where on several blocks', () => {
    expect(artifactsSpecIssues(artifactsSpec.parse(people))).toEqual([]);
  });

  it('rejects a picture that is not https, an unknown filter type and an empty menu', () => {
    const issues = artifactsSpecIssues(artifactsSpec.parse({
      ...people,
      elements: {
        ...people.elements,
        ana: { type: 'Avatar', props: { name: 'Ana', src: 'http://example.com/ana.png' } },
        directory: { type: 'DataTable', props: { columns: [{ key: 'name', label: 'Name' }], rows: [], filters: [{ key: 'name', type: 'chips' }] } },
        links: { type: 'Dropdown', props: { label: 'Handbook', items: [] } },
      },
    }));

    expect(issues).toEqual([
      expect.stringContaining('directory (DataTable): filters.0.type'),
      expect.stringContaining('ana (Avatar): src'),
      expect.stringContaining('links (Dropdown): items'),
    ]);
  });

  it('says when where reads a state path that is missing', () => {
    expect(artifactsSpecIssues(artifactsSpec.parse({ ...people, state: {} }))).toEqual(expect.arrayContaining([expect.stringContaining('directory (DataTable): where.team')]));
  });
});

const tableOf = (filters: object[], rows: object[] = []) => ({
  root: 'table',
  elements: { table: { type: 'DataTable', props: { columns: [{ key: 'brands', label: 'Brands' }, { key: 'status', label: 'Status', type: 'badge' }], rows, filters } } },
  state: {},
});

describe('artifacts DataTable filters', () => {
  it('accepts select filters by default, dropdown as an alias, option objects and list cells', () => {
    const filters = [
      { key: 'brands' },
      { key: 'status', type: 'select', options: ['Open', { value: 'Closed', label: 'Shut', emoji: '🔒' }, { value: 'Paused', icon: 'clock' }] },
      { key: 'brands', type: 'dropdown' },
      { key: 'status', type: 'buttons' },
    ];

    expect(artifactsSpecIssues(artifactsSpec.parse(tableOf(filters, [{ brands: ['Moncler', 'Stone Island'], status: null }, { brands: [], status: 'Open' }])))).toEqual([]);
  });

  it('takes up to 8 filters and rejects options without a value or with an unknown icon', () => {
    expect(artifactsSpecIssues(artifactsSpec.parse(tableOf(Array.from({ length: 8 }, () => ({ key: 'brands' })))))).toEqual([]);
    expect(artifactsSpecIssues(artifactsSpec.parse(tableOf(Array.from({ length: 9 }, () => ({ key: 'brands' })))))).toEqual([expect.stringContaining('table (DataTable): filters')]);
    expect(artifactsSpecIssues(artifactsSpec.parse(tableOf([{ key: 'status', options: [{ label: 'Open' }, { value: 'Closed', icon: 'unicorn' }] }])))).toEqual([
      expect.stringMatching(/filters\.0\.options\.0.*filters\.0\.options\.1/),
    ]);
  });
});

const icons = {
  root: 'page',
  elements: {
    page: { type: 'Grid', props: { columns: '3' }, children: ['party', 'care', 'plain'] },
    party: { type: 'Icon', props: { icon: 'party-popper', label: 'Launch party', description: 'Friday at six', tone: 'success', size: 'lg' } },
    care: { type: 'Icon', props: { icon: 'stethoscope', label: 'Check-up', tone: 'danger', size: 'sm' } },
    plain: { type: 'Icon', props: { icon: 'gamepad-2' } },
  },
  state: {},
};

describe('artifacts Icon block', () => {
  it('accepts an icon with a label, description, tone and size, or the icon alone', () => {
    expect(artifactsSpecIssues(artifactsSpec.parse(icons))).toEqual([]);
  });

  it('rejects an icon name outside the list, an unknown tone and an unknown size', () => {
    const issues = artifactsSpecIssues(artifactsSpec.parse({
      ...icons,
      elements: {
        ...icons.elements,
        party: { type: 'Icon', props: { icon: 'unicorn' } },
        care: { type: 'Icon', props: { icon: 'pizza', tone: 'purple' } },
        plain: { type: 'Icon', props: { icon: 'tv', size: 'xl' } },
      },
    }));

    expect(issues).toEqual([
      expect.stringContaining('party (Icon): icon'),
      expect.stringContaining('care (Icon): tone'),
      expect.stringContaining('plain (Icon): size'),
    ]);
  });
});

describe('artifacts blocks with links and custom HTML', () => {
  const linked = {
    root: 'page',
    elements: {
      page: { type: 'Stack', children: ['brands', 'sellers', 'top', 'plan', 'calc'] },
      brands: { type: 'People', props: { layout: 'grid', people: [{ name: 'Moncler', role: '🥇 Repbox', url: 'https://example.com/moncler', roleUrl: 'https://example.com/repbox', status: '23 live' }] } },
      sellers: { type: 'DataTable', props: { columns: [{ key: 'seller', label: 'Seller', urlKey: 'store' }], rows: [{ seller: 'Repbox', store: 'https://example.com/repbox' }] } },
      top: { type: 'RankedList', props: { rows: [{ label: 'Repbox', value: 23, url: 'https://example.com/repbox' }] } },
      plan: { type: 'Checklist', props: { items: [{ title: 'Read the brief', done: false, url: 'https://example.com/brief' }] } },
      calc: { type: 'Html', props: { title: 'Calculator', html: '<p id="out"></p><script>out.textContent = eval("6 * 7")</script>' } },
    },
  };

  it('accepts links on names, role lines, table cells, rows and tasks, and an Html block', () => {
    expect(artifactsSpecIssues(artifactsSpec.parse(linked))).toEqual([]);
  });

  it('rejects a link that is not http or https and an empty Html block', () => {
    const issues = artifactsSpecIssues(artifactsSpec.parse({
      ...linked,
      elements: {
        ...linked.elements,
        top: { type: 'RankedList', props: { rows: [{ label: 'Repbox', value: 23, url: 'ftp://example.com/file' }] } },
        calc: { type: 'Html', props: { html: ' ' } },
      },
    }));

    expect(issues).toEqual(expect.arrayContaining([expect.stringContaining('top'), expect.stringContaining('calc')]));
  });
});
