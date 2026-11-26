import { match, P } from 'ts-pattern';
import { describe, expect, it } from 'vitest';
import { artifactsSpecIssues } from '@/services/artifacts/artifacts.utils';
import { artifactsSpec } from '@/types/artifacts.types';
import { dataTableBound, dataTableRows } from '@/utils/data-table.utils';

const sellers = {
  root: 'page',
  elements: {
    page: { type: 'Stack', children: ['table', 'cards'] },
    table: {
      type: 'DataTable',
      props: {
        columns: [{ key: 'seller', label: 'Seller' }, { key: 'brands', label: 'Brands', show: 'wide' }, { key: 'say', label: 'What people say', show: 'detail' }],
        rows: { $state: '/sellers' },
      },
      children: ['prices', 'said', 'notes', 'orders'],
    },
    prices: { type: 'LineChart', props: { data: { $item: 'prices' }, x: 'day', series: [{ key: 'eur', label: 'Price' }] } },
    said: { type: 'Table', props: { columns: [{ key: 'quote', label: 'Quote' }], rows: { $state: '/mentions' }, where: { seller: { $item: 'seller' } } } },
    notes: { type: 'Notes', props: { label: 'Your notes', value: { $bindItem: 'notes' } } },
    orders: { type: 'DataTable', props: { columns: [{ key: 'item', label: 'Item' }], rows: { $item: 'orders' } }, children: ['orderNote'] },
    orderNote: { type: 'Text', props: { text: { $template: ['Ordered ', '$', '{item}'].join('') } } },
    cards: { type: 'Grid', props: { columns: '2' }, repeat: { statePath: '/sellers', key: 'seller' }, children: ['card'] },
    card: { type: 'Avatar', props: { name: { $item: 'seller' } } },
  },
  state: {
    sellers: [
      { seller: 'North Thread', brands: ['Moncler'], say: 'Fast replies.', prices: [{ day: 'Nov 1', eur: 40 }, { day: 'Nov 8', eur: 42 }], orders: [{ item: 'Jacket' }] },
      { seller: 'Repbox', brands: [], say: null, prices: [{ day: 'Nov 1', eur: 30 }], orders: [] },
    ],
    mentions: [{ seller: 'Repbox', quote: 'Good stitching' }],
  },
};

describe('artifacts rows that open into blocks', () => {
  it('accepts detail and wide columns, panel blocks reading and saving the row, joins, nested tables and repeat', () => {
    expect(artifactsSpecIssues(artifactsSpec.parse(sellers))).toEqual([]);
  });

  it('checks panel blocks against the real rows', () => {
    const issues = artifactsSpecIssues(artifactsSpec.parse({
      ...sellers,
      elements: { ...sellers.elements, prices: { type: 'LineChart', props: { data: { $item: 'pricez' }, x: 'day', series: [{ key: 'eur', label: 'Price' }] } } },
    }));

    expect(issues).toEqual([expect.stringMatching(/^prices \(LineChart\) in row 1: data/)]);
  });

  it('rejects row reads outside a table or repeat, and saving onto rows that are not objects in the page data', () => {
    const issues = artifactsSpecIssues(artifactsSpec.parse({
      ...sellers,
      elements: {
        ...sellers.elements,
        page: { type: 'Stack', children: ['table', 'cards', 'loose'] },
        table: { ...sellers.elements.table, props: { ...sellers.elements.table.props, rows: { keys: ['seller', 'orders'], rows: [['Repbox', []]] } } },
        loose: { type: 'Text', props: { text: { $item: 'seller' } } },
      },
    }));

    expect(issues).toEqual(expect.arrayContaining([expect.stringContaining('notes: { "$bindItem" } saves onto the row'), expect.stringContaining('loose: { "$item" }')]));
  });

  it('rejects a table with every column in the panel', () => {
    const issues = artifactsSpecIssues(artifactsSpec.parse({
      ...sellers,
      elements: { ...sellers.elements, table: { ...sellers.elements.table, props: { ...sellers.elements.table.props, columns: [{ key: 'seller', label: 'Seller', show: 'detail' }] } } },
    }));

    expect(issues).toEqual([expect.stringContaining('Keep at least one column')]);
  });

  it('reads rows given as keys and value lists', () => {
    expect(dataTableRows({ keys: ['seller', 'rating'], rows: [['Repbox', 4.5], ['North Thread']] })).toEqual([{ seller: 'Repbox', rating: 4.5 }, { seller: 'North Thread', rating: null }]);
  });

  it('binds table rows so panel inputs save onto the row', () => {
    const bound = match(artifactsSpec.parse(sellers)).with({ root: P.string }, dataTableBound).otherwise(() => null);

    expect(bound?.elements.table.props.rows).toEqual({ $bindState: '/sellers' });
    expect(bound?.elements.orders.props.rows).toEqual({ $bindItem: 'orders' });
  });
});
