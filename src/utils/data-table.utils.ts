import { match, P } from 'ts-pattern';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { CHART } from '@/constants/chart.constants';
import { artifactsBlocksDataTableValue } from '@/types/artifacts-blocks.types';
import { datesDayMedium, datesParseDay } from '@/utils/dates.utils';
import type * as Blocks from '@/types/artifacts-blocks.types';
import type { ArtifactsBlocksSpec } from '@/types/artifacts.types';
import type { Spec, VisibilityCondition } from '@json-render/core';

const dataTableCollator = new Intl.Collator(CHART.locale, { numeric: true, sensitivity: 'base' });

export const dataTableNumeric = new Set(['number', 'money', 'percent']);

export function dataTableFormatter(column: Blocks.ArtifactsBlocksDataTableColumn) {
  const fixed = column.decimals === undefined ? null : { minimumFractionDigits: column.decimals, maximumFractionDigits: column.decimals };

  return match(column.type ?? 'text')
    .with('number', 'progress', () => new Intl.NumberFormat(CHART.locale, fixed ?? { maximumFractionDigits: 2 }))
    .with('percent', () => new Intl.NumberFormat(CHART.locale, fixed ?? { maximumFractionDigits: 1 }))
    .with('money', () => new Intl.NumberFormat(CHART.locale, {
      style: 'currency',
      currency: column.currency ?? ARTIFACTS_UI.dataTable.money,
      currencyDisplay: 'narrowSymbol',
      ...fixed,
    }))
    .otherwise(() => null);
}

export function dataTableParts(value: Blocks.ArtifactsBlocksDataTableCell | undefined) {
  return match(value)
    .with(P.nullish, () => [])
    .with(P.number, (amount) => [String(amount)])
    .with(P.string, (text) => text.split(/,(?![^()]*\))/))
    .with(P.array(P.string), (list) => list)
    .exhaustive()
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

export function dataTableEmpty(value: Blocks.ArtifactsBlocksDataTableCell | undefined) {
  return dataTableParts(value).length === 0;
}

export function dataTableCell(row: Blocks.ArtifactsBlocksDataTableRow | undefined, key: string | undefined): Blocks.ArtifactsBlocksDataTableCell | undefined {
  return key === undefined ? undefined : artifactsBlocksDataTableValue.safeParse(row?.[key]).data;
}

export function dataTableRows(rows: Blocks.ArtifactsBlocksDataTableRows): Blocks.ArtifactsBlocksDataTableRow[] {
  return match(rows)
    .with(P.array(), (list) => list)
    .otherwise(({ keys, rows: values }) => values.map((value) => Object.fromEntries(keys.map((key, at) => [key, value[at] ?? null]))));
}

export function dataTableCopyText(value: Blocks.ArtifactsBlocksDataTableCell | undefined) {
  const text = match(value)
    .with(P.nullish, () => '')
    .with(P.array(P.string), (list) => dataTableParts(list).join(', '))
    .otherwise(String);

  return text.replace(/^(?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*)\s+/u, '').trim();
}

export function dataTableLink(value: Blocks.ArtifactsBlocksDataTableCell | undefined) {
  return match(value).with(P.string.regex(/^https?:\/\//), (url) => url).otherwise(() => null);
}

export function dataTableText(
  column: Blocks.ArtifactsBlocksDataTableColumn,
  value: Blocks.ArtifactsBlocksDataTableCell | undefined,
  format: Intl.NumberFormat | null,
) {
  return match({ value, type: column.type ?? 'text' })
    .with({ value: P.nullish }, { value: '' }, () => '')
    .with({ value: P.array(P.string) }, ({ value: list }) => dataTableParts(list).join(', '))
    .with({ value: P.number, type: P.union('percent', 'progress') }, ({ value: amount }) => `${format?.format(amount) ?? amount}%`)
    .with({ value: P.number }, ({ value: amount }) => format?.format(amount) ?? String(amount))
    .with({ value: P.string, type: 'date' }, ({ value: text }) => {
      const day = datesParseDay(text);

      return day ? `${datesDayMedium(day.date)}${day.time ? `, ${day.time}` : ''}` : text;
    })
    .with({ value: P.string, type: 'link' }, ({ value: text }) => (URL.canParse(text) ? new URL(text).host.replace(/^www\./, '') : text))
    .with({ value: P.string }, ({ value: text }) => text)
    .exhaustive();
}

export function dataTableCompare(left: Blocks.ArtifactsBlocksDataTableCell | undefined, right: Blocks.ArtifactsBlocksDataTableCell | undefined, direction: 'asc' | 'desc' = 'asc') {
  const order = direction === 'desc' ? -1 : 1;

  return match([dataTableEmpty(left), dataTableEmpty(right)])
    .with([true, true], () => 0)
    .with([true, false], () => 1)
    .with([false, true], () => -1)
    .otherwise(() => order * match([left, right])
      .with([P.number, P.number], ([a, b]) => a - b)
      .otherwise(([a, b]) => dataTableCollator.compare(String(a), String(b))));
}

function dataTableHas(value: Blocks.ArtifactsBlocksDataTableCell | undefined, wanted: string[]) {
  const parts = dataTableParts(value);
  const whole = match(value).with(P.string, (text) => text.trim()).otherwise(() => null);

  return wanted.some((one) => parts.includes(one) || whole === one);
}

export function dataTableFilter<Row extends Blocks.ArtifactsBlocksDataTableRow>(rows: Row[], picked: Record<string, string[]>, skip?: string) {
  const active = Object.entries(picked).filter(([key, values]) => key !== skip && values.length > 0);

  return active.length === 0 ? rows : rows.filter((row) => active.every(([key, values]) => dataTableHas(dataTableCell(row, key), values)));
}

export function dataTableFacets(
  filters: Blocks.ArtifactsBlocksDataTableFilter[],
  columns: Blocks.ArtifactsBlocksDataTableColumn[],
  scoped: Blocks.ArtifactsBlocksDataTableRow[],
  searched: Blocks.ArtifactsBlocksDataTableRow[],
  picked: Record<string, string[]>,
): Blocks.ArtifactsBlocksDataTableFacet[] {
  return filters.map((filter) => {
    const pool = dataTableFilter(searched, picked, filter.key);
    const values = [...new Set(scoped.flatMap((row) => dataTableParts(dataTableCell(row, filter.key))))].toSorted(dataTableCollator.compare);
    const given = filter.options ?? values;

    const options = given.map((option) => {
      const { value, label, icon, emoji } = match(option)
        .with(P.string, (text) => ({ value: text, label: text, icon: undefined, emoji: undefined }))
        .otherwise((choice) => choice);

      return { value, label: label ?? value, icon, emoji, count: pool.filter((row) => dataTableHas(dataTableCell(row, filter.key), [value])).length };
    });

    return {
      key: filter.key,
      label: filter.label ?? columns.find((column) => column.key === filter.key)?.label ?? filter.key,
      single: filters.length === 1 && filter.type === 'buttons' && options.length >= 2 && options.length <= ARTIFACTS_UI.dataTable.buttonsMax,
      picked: picked[filter.key] ?? [],
      total: pool.length,
      options,
    };
  });
}

export function dataTableSum(rows: Blocks.ArtifactsBlocksDataTableRow[], key: string) {
  return rows.reduce((sum, row) => sum + match(dataTableCell(row, key)).with(P.number, (amount) => amount).otherwise(() => 0), 0);
}

export function dataTableWhere<Row extends object>(rows: Row[], where: Record<string, Blocks.ArtifactsBlocksDataTableCell> | undefined) {
  const wanted = Object.entries(where ?? {}).filter(([, value]) => value !== null && value !== '' && value !== 'all');

  return wanted.length === 0 ? rows : rows.filter((row) => {
    const cells = new Map(Object.entries(row));

    return wanted.every(([key, value]) => String(cells.get(key) ?? '') === String(value));
  });
}

export function dataTableBound(spec: ArtifactsBlocksSpec): Spec {
  const elements = Object.entries(spec.elements).map(([key, element]) => {
    const rows = match({ type: element.type, rows: element.props.rows })
      .with({ type: 'DataTable', rows: { $state: P.string } }, ({ rows: bound }) => ({ rows: { $bindState: bound.$state } }))
      .with({ type: 'DataTable', rows: { $item: P.string } }, ({ rows: bound }) => ({ rows: { $bindItem: bound.$item } }))
      .otherwise(() => ({}));

    // SAFETY: validateSpec checks every visible condition against json-render's strict schema before a spec is saved or rendered.
    const visible = element.visible as VisibilityCondition | undefined;

    return [key, { ...element, props: { ...element.props, ...rows }, visible }] as const;
  });

  return { ...spec, elements: Object.fromEntries(elements) };
}

export function dataTableChoices(
  column: Blocks.ArtifactsBlocksDataTableColumn,
  filters: Blocks.ArtifactsBlocksDataTableFilter[],
  rows: Blocks.ArtifactsBlocksDataTableRow[],
) {
  const options = filters.find((filter) => filter.key === column.key)?.options ?? [];
  const given = options.map((option) => match(option).with(P.string, (text) => text).otherwise(({ value }) => value));
  const seen = rows.flatMap((row) => dataTableParts(dataTableCell(row, column.key)));

  return [...new Set([...given, ...Object.keys(column.tones ?? {}), ...seen])];
}

export function dataTableFormValues(columns: Blocks.ArtifactsBlocksDataTableColumn[], row: Blocks.ArtifactsBlocksDataTableRow | null) {
  return Object.fromEntries(columns.map((column) => [column.key, match(dataTableCell(row ?? {}, column.key))
    .with(P.nullish, () => (row ? '' : column.default ?? ''))
    .with(P.array(P.string), (list) => list.join(', '))
    .otherwise(String)]));
}

export function dataTableFormRow(
  columns: Blocks.ArtifactsBlocksDataTableColumn[],
  values: Record<string, string>,
  row: Blocks.ArtifactsBlocksDataTableRow | null,
): Blocks.ArtifactsBlocksDataTableRow {
  const keys = new Set(columns.map((column) => column.key));
  const kept = Object.entries(row ?? {}).filter(([key]) => !keys.has(key));

  const typed = columns.flatMap((column) => {
    const text = (values[column.key] ?? '').trim();
    const amount = Number(text.replace(',', '.'));
    const numeric = dataTableNumeric.has(column.type ?? 'text') || column.type === 'progress';

    const list = Array.isArray(row?.[column.key]);

    const value = match({
      text,
      numeric,
      list,
    })
      .with({ text: '' }, () => null)
      .with({ numeric: true }, () => (Number.isFinite(amount) ? amount : text))
      .with({ list: true }, () => dataTableParts(text))
      .otherwise(() => text);

    return value === null ? [] : [[column.key, value] as const];
  });

  return Object.fromEntries([...kept, ...typed]);
}

export function dataTableFields(columns: Blocks.ArtifactsBlocksDataTableColumn[]): Blocks.ArtifactsBlocksDataTableColumn[] {
  const own = new Set(columns.map((column) => column.key));

  return columns.filter((column) => column.form !== false).flatMap((column) => [
    ...(column.labelKey && !own.has(column.labelKey) ? [{ key: column.labelKey, label: column.type === 'avatar' ? column.label : `${column.label} label` }] : []),
    column.type === 'avatar' ? { ...column, label: `${column.label} picture` } : column,
    ...(column.urlKey && !own.has(column.urlKey) ? [{ key: column.urlKey, label: `${column.label} link`, type: 'link' as const }] : []),
  ]).filter((field, at, all) => all.findIndex((other) => other.key === field.key) === at);
}
