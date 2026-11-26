import { useRepeatScope } from '@json-render/react';
import { cn } from 'cn';
import { ArtifactsPager } from '@/components/artifacts/artifacts-pager';
import { CopyButton } from '@/components/ui/copy';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TextLink } from '@/components/ui/text-link';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { dataTableCopyText, dataTableEmpty, dataTableLink, dataTableWhere } from '@/utils/data-table.utils';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsTableProps {
  block: ArtifactsBlocksProps<'Table'>;
}

export function ArtifactsTable({ block: { columns, rows, where, pageSize } }: ArtifactsTableProps) {
  const found = dataTableWhere(rows, where);
  const inRow = useRepeatScope() !== null;

  if (inRow && found.length === 0) {
    return null;
  }

  return (
    <ArtifactsPager
      items={found}
      key={JSON.stringify(where ?? {})}
      pageSize={pageSize}
    >
      {(visible, pager) => (
        <div className="min-w-0 overflow-hidden rounded-(--radius-panel) border bg-card [&_[data-slot=table-head]]:border-t-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => <TableHead className={cn(column.align === 'right' && 'text-right')} key={column.key}>{column.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow variant="static">
                  <TableCell colSpan={columns.length} variant="empty">Nothing matches</TableCell>
                </TableRow>
              ) : null}
              {visible.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell className={cn(column.align === 'right' && 'text-right')} key={column.key}>
                      {dataTableEmpty(row[column.key]) ? <span className="text-muted-foreground">–</span> : (
                        <span className={cn(column.copy && 'inline-flex items-center gap-1', column.align === 'right' && 'justify-end')}>
                          <span className={cn('block max-w-80', String(row[column.key]).length > ARTIFACTS_UI.dataTable.shortText ? 'min-w-40 text-pretty whitespace-normal' : 'whitespace-nowrap')}>
                            <TextLink href={column.urlKey ? dataTableLink(row[column.urlKey]) : null}>{row[column.key]}</TextLink>
                          </span>
                          {column.copy ? (
                            <CopyButton
                              className="my-0"
                              label={column.label.toLowerCase()}
                              value={dataTableCopyText(row[column.key])}
                            />
                          ) : null}
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pager}
        </div>
      )}
    </ArtifactsPager>
  );
}
