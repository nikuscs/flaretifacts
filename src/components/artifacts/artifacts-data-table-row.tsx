'use client';

import { RepeatScopeProvider } from '@json-render/react';
import { cn } from 'cn';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';
import { ArtifactsDataTableCell } from '@/components/artifacts/artifacts-data-table-cell';
import { TableCell, TableRow } from '@/components/ui/table';
import { MOTION } from '@/constants/motion.constants';
import { dataTableCell, dataTableEmpty, dataTableNumeric, dataTableText } from '@/utils/data-table.utils';
import ChevronDown from '~icons/lucide/chevron-down';
import type { ArtifactsBlocksDataTableColumn, ArtifactsBlocksDataTableRow } from '@/types/artifacts-blocks.types';
import type { MouseEvent, ReactNode } from 'react';

interface ArtifactsDataTableRowProps {
  row: ArtifactsBlocksDataTableRow;
  index: number;
  columns: ArtifactsBlocksDataTableColumn[];
  formats: (Intl.NumberFormat | null)[];
  basePath: string | null;
  opens: 'never' | 'phone' | 'always';
  label: string;
  children?: ReactNode;
}

export function ArtifactsDataTableRow({ row, index, columns, formats, basePath, opens, label, children }: ArtifactsDataTableRowProps) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const text = (at: number) => dataTableText(columns[at], dataTableCell(row, columns[at].key), formats[at]);
  const placed = columns.map((column, at) => ({ column, at }));
  const fields = placed.filter(({ column }) => column.show === 'detail' || column.show === 'wide').filter(({ column }) => !dataTableEmpty(dataTableCell(row, column.key)));

  const toggle = (event: MouseEvent<HTMLTableRowElement>) => {
    const target = event.target instanceof Element ? event.target : null;
    const control = target?.closest('a, button, input, select, textarea, label');

    const wideScreen = opens === 'phone' && globalThis.matchMedia('(min-width: 40rem)').matches;

    if (opens === 'never' || wideScreen || (control && !control.hasAttribute('data-row-toggle')) || globalThis.getSelection()?.toString()) {
      return;
    }

    setOpen(!open);
  };

  return (
    <>
      <TableRow className={cn(opens === 'always' && 'cursor-pointer', opens === 'phone' && 'max-sm:cursor-pointer')} onClick={toggle}>
        {placed.filter(({ column }) => column.show !== 'detail').map(({ column, at }) => (
          <TableCell className={cn(dataTableNumeric.has(column.type ?? 'text') && 'text-right', column.show === 'wide' && 'max-sm:hidden')} key={column.key}>
            <ArtifactsDataTableCell
              column={column}
              row={row}
              text={text(at)}
            />
          </TableCell>
        ))}
        {opens === 'never' ? null : (
          <TableCell className={cn(opens === 'phone' && 'sm:hidden')} variant="action">
            <button
              aria-controls={open ? panelId : undefined}
              aria-expanded={open}
              aria-label={`${open ? 'Hide' : 'Show'} details for ${label}`}
              className="grid size-8 cursor-pointer place-items-center rounded-(--radius-control) text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              data-row-toggle=""
              type="button"
            >
              <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform duration-240', open && 'rotate-180')} />
            </button>
          </TableCell>
        )}
      </TableRow>
      <AnimatePresence initial={false}>
        {open ? (
          <TableRow
            className={cn(opens === 'phone' && 'sm:hidden')}
            key="panel"
            variant="panel"
          >
            <TableCell colSpan={columns.length + 1} variant="panel">
              <motion.div
                animate={{ height: 'auto', opacity: 1 }}
                className="overflow-clip"
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
                transition={reduced ? { duration: 0 } : MOTION.spring.smooth}
              >
                <section
                  aria-label={`${label} details`}
                  className="sticky left-0 grid w-[100cqw] min-w-0 gap-4 px-4 pt-1 pb-5 max-sm:px-3"
                  id={panelId}
                >
                  {fields.length > 0 ? (
                    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {fields.map(({ column, at }) => (
                        <div className={cn('grid min-w-0 content-start gap-1', column.show === 'wide' && 'sm:hidden', (column.type ?? 'text') === 'text' && text(at).length > 60 && 'sm:col-span-2')} key={column.key}>
                          <dt className="text-xs text-muted-foreground">{column.label}</dt>
                          <dd className="min-w-0 text-sm">
                            <ArtifactsDataTableCell
                              full
                              column={column}
                              row={row}
                              text={text(at)}
                            />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  {children ? (
                    <RepeatScopeProvider
                      basePath={basePath ?? ''}
                      index={index}
                      item={row}
                    >
                      <div className="grid min-w-0 gap-4">{children}</div>
                    </RepeatScopeProvider>
                  ) : null}
                </section>
              </motion.div>
            </TableCell>
          </TableRow>
        ) : null}
      </AnimatePresence>
    </>
  );
}
