import { resolveElementProps } from '@json-render/core';
import { match, P } from 'ts-pattern';
import { describe, expect, it } from 'vitest';
import { artifactsSpecIssues } from '@/services/artifacts/artifacts.utils';
import * as Examples from '@/services/examples/examples.server';
import { artifactsBlocksComponents } from '@/types/artifacts-blocks.types';
import { artifactsBlocksCatalog } from '@/types/artifacts.types';
import { dataTableRows } from '@/utils/data-table.utils';

function examplesTables(name: string) {
  return match(Examples.examplesGet({ name }).spec)
    .with({ root: P.string }, ({ elements, state }) => Object.values(elements)
      .filter((element) => element.type === 'DataTable' && !JSON.stringify(element.props).includes('"$item"'))
      .map((element) => artifactsBlocksComponents.DataTable.props.parse(resolveElementProps(element.props, { stateModel: state })))
      .map((table) => ({ ...table, rows: dataTableRows(table.rows) })))
    .otherwise(() => []);
}

describe('examples', () => {
  it('lists every example with the blocks it uses and no spec', () => {
    const examples = Examples.examplesList();

    expect(examples.map((example) => example.name)).toEqual(expect.arrayContaining(['dashboard', 'project-plan', 'weekly-report', 'habit-tracker', 'html-page', 'team-directory', 'seller-directory']));
    expect(examples.find((example) => example.name === 'dashboard')).toMatchObject({ kind: 'blocks', blocks: expect.arrayContaining(['Metric', 'AreaChart']) });
    expect(examples.find((example) => example.name === 'html-page')).toMatchObject({ kind: 'html', blocks: [] });
    expect(examples.every((example) => !Object.hasOwn(example, 'spec'))).toBe(true);
  });

  it('gets one example whole by name, and says when there is none', () => {
    expect(Examples.examplesGet({ name: 'dashboard' })).toMatchObject({ name: 'dashboard', spec: { root: 'page' } });
    expect(() => Examples.examplesGet({ name: 'nope' })).toThrow('There is no example with that name');
  });

  it('shows every block on the every-block page', () => {
    expect(Examples.examplesGet({ name: 'every-block' }).blocks).toEqual(Object.keys(artifactsBlocksCatalog).toSorted());
  });

  it('renders every example with blocks the schema lists', () => {
    const pages = Examples.examplesList().map(({ name }) => Examples.examplesGet({ name }));

    expect(pages.map((page) => artifactsSpecIssues(page.spec))).toEqual(pages.map(() => []));
    expect(pages.flatMap((page) => page.blocks).filter((block) => !Object.hasOwn(artifactsBlocksCatalog, block))).toEqual([]);
  });

  it('shows a big seller table with select filters, links, lists and empty cells', () => {
    const [table] = examplesTables('seller-directory');

    expect(Examples.examplesGet({ name: 'seller-directory' }).blocks).toEqual(expect.arrayContaining(['DataTable', 'KeyNumbers']));
    expect(table.pageSize).toBe(20);
    expect(table.columns).toEqual(expect.arrayContaining([{ key: 'store', label: 'Store', type: 'link', show: 'detail', copy: true }, expect.objectContaining({ key: 'brands', show: 'wide' })]));
    expect(table.filters?.length).toBeGreaterThanOrEqual(3);
    expect(table.filters?.every((filter) => filter.type === undefined || filter.type === 'select')).toBe(true);
    expect(table.rows.length).toBeGreaterThanOrEqual(30);
    expect(table.rows.some((row) => Array.isArray(row.brands) && row.brands.length > 1)).toBe(true);
    expect(table.rows.some((row) => row.rating === null || row.goodAt === null)).toBe(true);
  });

  it('keeps example data small: each record stored once, inputs start empty', () => {
    const pages = Examples.examplesList().filter(({ name }) => name !== 'every-block').map(({ name }) => Examples.examplesGet({ name }));

    const copied = pages.flatMap(({ name, spec }) => {
      const places = new Map<string, Set<string>>();

      const blocks = match(spec)
        .with({ root: P.string }, ({ elements, state }) => [
          ...Object.entries(state),
          ...Object.entries(elements).map(([key, element]) => [key, element.props] as const),
        ])
        .otherwise(() => []);

      for (const [place, value] of blocks) {
        for (const text of JSON.stringify(value).match(/"[^"]{25,}"/g) ?? []) {
          places.set(text, (places.get(text) ?? new Set()).add(place));
        }
      }

      return [...places].filter(([, where]) => where.size > 1).map(([text]) => `${name}: ${text}`);
    });

    expect(copied).toEqual([]);
    expect(pages.filter(({ spec }) => JSON.stringify(spec).includes('"done":false')).map(({ name }) => name)).toEqual([]);
  });

  it('uses select filters, never buttons beside other filters', () => {
    const filters = Examples.examplesList().flatMap(({ name }) => examplesTables(name)).map((table) => table.filters ?? []);

    expect(filters.filter((list) => list.length > 1 && list.some((filter) => filter.type === 'buttons'))).toEqual([]);
  });
});
