'use client';

import { useBoundProp, useRepeatScope } from '@json-render/react';
import { cn } from 'cn';
import { Children, Fragment, useState } from 'react';
import { match, P } from 'ts-pattern';
import { ArtifactsDataTableForm } from '@/components/artifacts/artifacts-data-table-form';
import { ArtifactsDataTableRow } from '@/components/artifacts/artifacts-data-table-row';
import { ArtifactsDataTableToolbar } from '@/components/artifacts/artifacts-data-table-toolbar';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableHeader, DataTablePagination, DataTableSearch, DataTableSort } from '@/components/ui/data-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import {
  dataTableCell,
  dataTableCompare,
  dataTableFacets,
  dataTableFilter,
  dataTableFormatter,
  dataTableNumeric,
  dataTableRows,
  dataTableSum,
  dataTableText,
  dataTableWhere,
} from '@/utils/data-table.utils';
import Pencil from '~icons/lucide/pencil';
import Plus from '~icons/lucide/plus';
import type { ArtifactsBlocksDataTableColumn, ArtifactsBlocksDataTableRow, ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';
import type { ReactNode } from 'react';

interface ArtifactsDataTableProps {
  block: ArtifactsBlocksProps<'DataTable'>;
  rowsPath?: string;
  children?: ReactNode;
}

export function ArtifactsDataTable({ block, rowsPath, children }: ArtifactsDataTableProps) {
  const { title, description, columns, rows, pageSize, search = true, sort: initialSort, groupBy, filters = [], where, editable = false } = block;
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize ?? ARTIFACTS_UI.dataTable.pageSize);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const inRow = useRepeatScope() !== null;
  const formats = columns.map(dataTableFormatter);
  const all = dataTableRows(rows);
  const indexOf = new Map(all.map((row, index) => [row, index]));
  const writable = rowsPath !== undefined && match(rows).with(P.array(), () => true).otherwise(() => false);
  const [, setRows] = useBoundProp<ArtifactsBlocksDataTableRow[]>(all, writable ? rowsPath : undefined);
  const editing = editable && writable;
  const tableColumns = columns.filter((column) => column.show !== 'detail');
  const summedFrom = tableColumns.findIndex((column, at) => at > 0 && (column.type === 'money' || column.type === 'number'));
  const blocks = Children.count(children) > 0 || editing;

  const opens = match({ wide: blocks || columns.some((column) => column.show === 'detail'), phone: columns.some((column) => column.show === 'wide') })
    .with({ wide: true }, () => 'always' as const)
    .with({ phone: true }, () => 'phone' as const)
    .otherwise(() => 'never' as const);

  const needle = query.trim().toLowerCase();
  const shown = (row: ArtifactsBlocksDataTableRow, column: ArtifactsBlocksDataTableColumn) => dataTableCell(row, column.type === 'avatar' && column.labelKey ? column.labelKey : column.key);
  const text = (row: ArtifactsBlocksDataTableRow) => columns.map((column, at) => dataTableText(column, shown(row, column), formats[at]));
  const matches = (row: ArtifactsBlocksDataTableRow) => text(row).join('\n').toLowerCase().includes(needle);
  const scoped = dataTableWhere(all, where);
  const searched = needle ? scoped.filter(matches) : scoped;
  const facets = dataTableFacets(filters, columns, scoped, searched, picked);
  const found = dataTableFilter(searched, picked);
  const sortColumn = columns.find((column) => column.key === sort?.key);

  const sorted = sort && sortColumn
    ? found.toSorted((left, right) => dataTableCompare(shown(left, sortColumn), shown(right, sortColumn), sort.direction))
    : found;

  const empty = match({ needle, filtered: Object.values(picked).some((values) => values.length > 0) })
    .with({ needle: P.string.minLength(1) }, () => `No rows match “${query.trim()}”`)
    .with({ filtered: true }, () => 'No rows match these filters')
    .otherwise(() => 'No rows yet');

  const groups = new Map<string, ArtifactsBlocksDataTableRow[]>();
  const groupOf = (row: ArtifactsBlocksDataTableRow) => (groupBy ? dataTableText({ key: groupBy, label: '' }, dataTableCell(row, groupBy), null) : '');

  for (const row of sorted) {
    const key = groupOf(row);

    groups.set(key, groups.get(key) ?? []);
    groups.get(key)?.push(row);
  }

  if (inRow && scoped.length === 0) {
    return null;
  }

  const ordered = [...groups.values()].flat();
  const pages = Math.max(1, Math.ceil(ordered.length / size));
  const current = Math.min(page, pages);
  const first = (current - 1) * size;
  const visible = ordered.slice(first, first + size);

  return (
    <DataTable>
      {title || description ? (
        <DataTableHeader
          description={description}
          title={title}
        />
      ) : null}
      {search || facets.length > 0 || editing ? (
        <ArtifactsDataTableToolbar
          action={editing ? (
            <ArtifactsDataTableForm
              columns={columns}
              filters={filters}
              row={null}
              rows={all}
              trigger={(
                <Button
                  className="sm:ml-auto"
                  size="lg"
                >
                  <Plus aria-hidden="true" className="-ml-1" />
                  Add row
                </Button>
              )}
              onSave={(added) => setRows([...all, added])}
            />
          ) : null}
          facets={facets}
          found={found.length}
          search={search ? (
            <DataTableSearch
              aria-label={title ? `Search ${title}` : 'Search the table'}
              className="max-w-none sm:ml-0 sm:w-64"
              value={query}
              onSearch={(value) => {
                setQuery(value);
                setPage(1);
              }}
            />
          ) : null}
          onClear={() => {
            setPicked({});
            setPage(1);
          }}
          onPick={(key, values) => {
            setPicked({ ...picked, [key]: values });
            setPage(1);
          }}
        />
      ) : null}
      <Table>
        <TableHeader>
          <TableRow variant="static">
            {tableColumns.map((column) => {
              const direction = sort?.key === column.key ? sort.direction : null;

              return (
                <TableHead
                  aria-sort={direction ? ({ asc: 'ascending', desc: 'descending' } as const)[direction] : undefined}
                  className={cn(dataTableNumeric.has(column.type ?? 'text') && 'text-right', column.show === 'wide' && 'max-sm:hidden')}
                  key={column.key}
                >
                  <DataTableSort
                    direction={direction}
                    label={column.label}
                    onSort={() => {
                      setPage(1);
                      setSort(direction === 'desc' ? null : { key: column.key, direction: direction === 'asc' ? 'desc' : 'asc' });
                    }}
                  />
                </TableHead>
              );
            })}
            {opens === 'never' ? null : <TableHead className={cn(opens === 'phone' && 'sm:hidden')} variant="action"><span className="sr-only">Details</span></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.length === 0 ? (
            <TableRow variant="static">
              <TableCell colSpan={tableColumns.length + 1} variant="empty">{empty}</TableCell>
            </TableRow>
          ) : null}
          {visible.map((row, index) => {
            const group = groupOf(row);
            const members = groups.get(group) ?? [];
            const heading = groupBy !== undefined && (index === 0 || groupOf(visible[index - 1]) !== group);
            const source = indexOf.get(row) ?? first + index;

            return (
              <Fragment key={source}>
                {heading ? (
                  <TableRow variant="group">
                    <TableCell colSpan={summedFrom === -1 ? tableColumns.length + 1 : summedFrom}>
                      <span className="flex items-center gap-2 whitespace-normal">
                        {group || 'None'}
                        <span className="rounded-md bg-card px-1.5 leading-5 text-muted-foreground tabular-nums">{members.length}</span>
                      </span>
                    </TableCell>
                    {summedFrom === -1 ? null : tableColumns.slice(summedFrom).map((column) => (
                      <TableCell className={cn(dataTableNumeric.has(column.type ?? 'text') && 'text-right', column.show === 'wide' && 'max-sm:hidden')} key={column.key}>
                        {column.type === 'money' || column.type === 'number' ? dataTableText(column, dataTableSum(members, column.key), formats[columns.indexOf(column)]) : null}
                      </TableCell>
                    ))}
                    {summedFrom === -1 || opens === 'never' ? null : <TableCell className={cn(opens === 'phone' && 'sm:hidden')} variant="action" />}
                  </TableRow>
                ) : null}
                <ArtifactsDataTableRow
                  basePath={writable ? `${rowsPath}/${source}` : null}
                  columns={columns}
                  formats={formats}
                  index={source}
                  label={dataTableText(tableColumns[0], shown(row, tableColumns[0]), formats[columns.indexOf(tableColumns[0])]) || 'this row'}
                  opens={opens}
                  row={row}
                >
                  {editing ? (
                    <ArtifactsDataTableForm
                      columns={columns}
                      filters={filters}
                      row={row}
                      rows={all}
                      trigger={(
                        <Button
                          className="justify-self-start"
                          size="sm"
                          variant="outline"
                        >
                          <Pencil aria-hidden="true" />
                          Edit row
                        </Button>
                      )}
                      onRemove={() => setRows(all.filter((_, at) => at !== source))}
                      onSave={(changed) => setRows(all.map((entry, at) => (at === source ? changed : entry)))}
                    />
                  ) : null}
                  {Children.count(children) > 0 ? children : null}
                </ArtifactsDataTableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
      <DataTablePagination
        page={current}
        pageSize={size}
        pageSizes={[...ARTIFACTS_UI.dataTable.pageSizes]}
        total={ordered.length}
        onPage={setPage}
        onPageSize={(next) => {
          setSize(next);
          setPage(1);
        }}
      />
    </DataTable>
  );
}
