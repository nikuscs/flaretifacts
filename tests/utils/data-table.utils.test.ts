import { describe, expect, it } from 'vitest';
import { dataTableChoices, dataTableCompare, dataTableCopyText, dataTableEmpty, dataTableFacets, dataTableFields, dataTableFilter, dataTableFormRow, dataTableFormValues, dataTableLink, dataTableParts, dataTableText, dataTableWhere } from '@/utils/data-table.utils';

const rows = [
  { name: 'Ana', team: 'Design', level: 2 },
  { name: 'Rui', team: 'Sales', level: 3 },
  { name: 'Marta', team: 'Design', level: 3 },
  { name: 'Liam' },
];

describe('dataTableWhere', () => {
  it('keeps the rows whose keys equal every value, comparing numbers as text', () => {
    expect(dataTableWhere(rows, { team: 'Design' }).map((row) => row.name)).toEqual(['Ana', 'Marta']);
    expect(dataTableWhere(rows, { team: 'Design', level: '3' }).map((row) => row.name)).toEqual(['Marta']);
    expect(dataTableWhere(rows, { level: 3 }).map((row) => row.name)).toEqual(['Rui', 'Marta']);
  });

  it('shows every row for all, an empty value, null or no where', () => {
    expect(dataTableWhere(rows, { team: 'all' })).toEqual(rows);
    expect(dataTableWhere(rows, { team: '' })).toEqual(rows);
    expect(dataTableWhere(rows, { team: null })).toEqual(rows);
    expect(dataTableWhere(rows, undefined)).toEqual(rows);
  });

  it('drops rows that do not have the key', () => {
    expect(dataTableWhere(rows, { team: 'Nobody' })).toEqual([]);
    expect(dataTableWhere(rows, { team: 'Sales' }).map((row) => row.name)).toEqual(['Rui']);
  });
});

const shops = [
  { name: 'North', brands: 'Moncler, CP Company', status: '🟢 Open', rating: 4.5 },
  { name: 'South', brands: ['Stone Island', 'Moncler'], status: '🔒 Closed', rating: null },
  { name: 'East', brands: 'Lacoste (polos, tees)', status: '🟢 Open', rating: 3 },
  { name: 'West', brands: [], status: '', rating: 5 },
];

const columns = [{ key: 'name', label: 'Shop' }, { key: 'brands', label: 'Brands' }, { key: 'status', label: 'Status', type: 'badge' as const }];

describe('dataTableParts and dataTableEmpty', () => {
  it('splits lists and comma-separated text, keeping commas inside parentheses', () => {
    expect(dataTableParts('Moncler, CP Company')).toEqual(['Moncler', 'CP Company']);
    expect(dataTableParts('Lacoste (polos, tees)')).toEqual(['Lacoste (polos, tees)']);
    expect(dataTableParts([' Stone Island ', ''])).toEqual(['Stone Island']);
    expect(dataTableParts(0)).toEqual(['0']);
  });

  it('treats null, missing, blank text and empty lists as empty, and zero as a value', () => {
    expect([null, undefined, '', '  ', [], ['']].map(dataTableEmpty)).toEqual([true, true, true, true, true, true]);
    expect(dataTableEmpty(0)).toBe(false);
  });

  it('shows lists as comma-separated text', () => {
    expect(dataTableText(columns[1], ['Moncler', 'CP Company'], null)).toBe('Moncler, CP Company');
  });
});

describe('dataTableCompare', () => {
  it('keeps empty cells last in both directions', () => {
    const values = [3, null, 1, '', 2, []];

    expect(values.toSorted((left, right) => dataTableCompare(left, right, 'asc'))).toEqual([1, 2, 3, null, '', []]);
    expect(values.toSorted((left, right) => dataTableCompare(left, right, 'desc'))).toEqual([3, 2, 1, null, '', []]);
  });

  it('sorts text naturally', () => {
    expect(['Shop 10', 'shop 2', 'Shop 1'].toSorted((left, right) => dataTableCompare(left, right))).toEqual(['Shop 1', 'shop 2', 'Shop 10']);
  });
});

describe('dataTableFilter', () => {
  it('keeps rows matching any picked value of a key and every key', () => {
    expect(dataTableFilter(shops, { status: ['🟢 Open', '🔒 Closed'] }).map((row) => row.name)).toEqual(['North', 'South', 'East']);
    expect(dataTableFilter(shops, { status: ['🟢 Open'], brands: ['Moncler'] }).map((row) => row.name)).toEqual(['North']);
  });

  it('matches one part of a list or comma-separated cell, or the whole text', () => {
    expect(dataTableFilter(shops, { brands: ['Moncler'] }).map((row) => row.name)).toEqual(['North', 'South']);
    expect(dataTableFilter(shops, { brands: ['Moncler, CP Company'] }).map((row) => row.name)).toEqual(['North']);
  });

  it('ignores keys with nothing picked and the skipped key', () => {
    expect(dataTableFilter(shops, { status: [] })).toEqual(shops);
    expect(dataTableFilter(shops, { status: ['🔒 Closed'] }, 'status')).toEqual(shops);
  });
});

describe('dataTableFacets', () => {
  it('offers the distinct parts of a column with counts that follow the other filters', () => {
    const [brands, status] = dataTableFacets([{ key: 'brands' }, { key: 'status', label: 'State' }], columns, shops, shops, { status: ['🟢 Open'] });

    expect(brands).toMatchObject({
      key: 'brands',
      label: 'Brands',
      single: false,
      picked: [],
      total: 2,
    });
    expect(brands.options.map(({ value, count }) => [value, count])).toEqual([['CP Company', 1], ['Lacoste (polos, tees)', 1], ['Moncler', 1], ['Stone Island', 0]]);
    expect(status).toMatchObject({
      label: 'State',
      picked: ['🟢 Open'],
      total: 4,
    });
    expect(status.options.map(({ value, count }) => [value, count])).toEqual([['🔒 Closed', 1], ['🟢 Open', 2]]);
  });

  it('uses given options as text or with a label, emoji and icon', () => {
    const [status] = dataTableFacets([{ key: 'status', options: ['🟢 Open', { value: '🔒 Closed', label: 'Shut', icon: 'lock' }] }], columns, shops, shops, {});

    expect(status.options).toEqual([
      { value: '🟢 Open', label: '🟢 Open', icon: undefined, emoji: undefined, count: 2 },
      { value: '🔒 Closed', label: 'Shut', icon: 'lock', emoji: undefined, count: 1 },
    ]);
  });

  it('shows buttons only for a single filter of 2 to 5 values', () => {
    expect(dataTableFacets([{ key: 'status', type: 'buttons' }], columns, shops, shops, {})[0].single).toBe(true);
    expect(dataTableFacets([{ key: 'brands', type: 'buttons' }, { key: 'status', type: 'buttons' }], columns, shops, shops, {}).map((facet) => facet.single)).toEqual([false, false]);
    expect(dataTableFacets([{ key: 'name', type: 'buttons' }], columns, shops, shops, {})[0].single).toBe(true);
    expect(dataTableFacets([{ key: 'name', type: 'buttons', options: ['North'] }], columns, shops, shops, {})[0].single).toBe(false);
  });
});

describe('dataTableLink', () => {
  it('keeps http and https links and drops anything else', () => {
    expect(['https://example.com/a', 'http://example.com', 'ftp://example.com/file', 'example.com', 3, null, ['https://example.com']].map(dataTableLink))
      .toEqual(['https://example.com/a', 'http://example.com', null, null, null, null, null]);
  });
});

describe('dataTableCopyText', () => {
  it('copies the value ready to paste, without the leading emoji', () => {
    expect(dataTableCopyText('🔑 147258')).toBe('147258');
    expect(dataTableCopyText('🇵🇹 PT50 0035 0000')).toBe('PT50 0035 0000');
    expect(dataTableCopyText('👩‍💻 Ana Silva')).toBe('Ana Silva');
    expect(dataTableCopyText('https://shop.example/a?b=1')).toBe('https://shop.example/a?b=1');
    expect(dataTableCopyText(['Moncler', 'Stone Island'])).toBe('Moncler, Stone Island');
    expect(dataTableCopyText(42.5)).toBe('42.5');
    expect(dataTableCopyText('SAVE10')).toBe('SAVE10');
    expect(dataTableCopyText(null)).toBe('');
  });
});

describe('dataTableFields', () => {
  it('adds the name of an avatar and the link of a urlKey column, once each', () => {
    const fields = dataTableFields([
      { key: 'logo', label: 'Seller', type: 'avatar', labelKey: 'seller' },
      { key: 'item', label: 'Item', urlKey: 'shop' },
      { key: 'shop', label: 'Shop', type: 'link' },
      { key: 'chest', label: 'Chest', form: false },
    ]);

    expect(fields.map((field) => [field.key, field.label])).toEqual([['seller', 'Seller'], ['logo', 'Seller picture'], ['item', 'Item'], ['shop', 'Shop']]);
  });
});

describe('dataTableChoices', () => {
  it('offers filter options, then tones, then values already in the column', () => {
    const column = { key: 'status', label: 'Status', type: 'badge' as const, tones: { '🟢 Open': 'success' as const, '🟡 Soon': 'warning' as const } };

    expect(dataTableChoices(column, [{ key: 'status', options: [{ value: '🔒 Closed' }] }], shops)).toEqual(['🔒 Closed', '🟢 Open', '🟡 Soon']);
  });
});

describe('dataTableFormValues and dataTableFormRow', () => {
  const fields = [{ key: 'name', label: 'Shop' }, { key: 'brands', label: 'Brands' }, { key: 'rating', label: 'Rating', type: 'number' as const }];

  it('turns a row into texts and back, keeping lists and keys the form does not show', () => {
    const row = { name: 'South', brands: ['Stone Island', 'Moncler'], rating: 4, notes: 'kept' };
    const values = dataTableFormValues(fields, row);

    const expected = {
      notes: 'kept',
      name: 'South',
      brands: ['Stone Island', 'Moncler'],
      rating: 4.5,
    };

    expect(values).toEqual({
      name: 'South',
      brands: 'Stone Island, Moncler',
      rating: '4',
    });
    expect(dataTableFormRow(fields, { ...values, rating: '4,5' }, row)).toEqual(expected);
  });

  it('starts a new row from column defaults', () => {
    expect(dataTableFormValues([{ key: 'status', label: 'Status', default: 'Open' }], null)).toEqual({ status: 'Open' });
    expect(dataTableFormValues([{ key: 'status', label: 'Status', default: 'Open' }], { name: 'South' })).toEqual({ status: '' });
  });

  it('drops empty fields and builds a new row', () => {
    const empty = {
      name: ' North ',
      brands: '',
      rating: '',
    };

    expect(dataTableFormRow(fields, empty, null)).toEqual({ name: 'North' });
    expect(dataTableFormRow(fields, { name: 'South', rating: '' }, { name: 'South', rating: 3 })).toEqual({ name: 'South' });
  });
});
