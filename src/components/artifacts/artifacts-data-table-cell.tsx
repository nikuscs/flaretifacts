import { cn } from 'cn';
import { match, P } from 'ts-pattern';
import { ArtifactsAvatar } from '@/components/artifacts/artifacts-avatar';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy';
import { TextLink } from '@/components/ui/text-link';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { chartClamp } from '@/utils/chart.utils';
import { dataTableCell, dataTableCopyText, dataTableEmpty, dataTableLink, dataTableParts } from '@/utils/data-table.utils';
import ExternalLink from '~icons/lucide/external-link';
import type { ArtifactsBlocksDataTableColumn, ArtifactsBlocksDataTableRow } from '@/types/artifacts-blocks.types';
import type { ReactNode } from 'react';

interface ArtifactsDataTableCellProps {
  column: ArtifactsBlocksDataTableColumn;
  row: ArtifactsBlocksDataTableRow;
  text: string;
  full?: boolean;
}

export function ArtifactsDataTableCell({ column, row, text, full = false }: ArtifactsDataTableCellProps) {
  const value = dataTableCell(row, column.key);
  const named = dataTableCell(row, column.labelKey);
  const name = column.labelKey && !dataTableEmpty(named) ? dataTableParts(named).join(', ') : null;
  const blank = <span className="text-muted-foreground">–</span>;
  const href = column.urlKey && column.type !== 'link' ? dataTableLink(dataTableCell(row, column.urlKey)) : null;
  const copied = column.copy ? dataTableCopyText(value) : '';
  const linked = (content: ReactNode) => (href && content !== blank ? <span className="inline-flex max-w-full min-w-0"><TextLink href={href}>{content}</TextLink></span> : content);

  const cell = (content: ReactNode) => (copied === '' ? linked(content) : (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1">
      {linked(content)}
      <CopyButton
        className="my-0"
        label={column.label.toLowerCase()}
        value={copied}
      />
    </span>
  ));

  return cell(match({
    type: column.type ?? 'text',
    value,
    empty: dataTableEmpty(value),
  })
    .with({ type: 'avatar', empty: true }, () => name === null, () => blank)
    .with({ type: 'avatar' }, () => (
      <span className="flex min-w-0 items-center gap-2.5">
        <ArtifactsAvatar
          name={name ?? ''}
          size="sm"
          src={match(value).with(P.string.startsWith('https://'), (url) => url).otherwise(() => null)}
        />
        {name === null ? null : <span className="line-clamp-2 max-w-60 min-w-16 font-medium text-pretty whitespace-normal">{name}</span>}
      </span>
    ))
    .with({ empty: true }, () => blank)
    .with({ type: 'badge' }, () => (
      <span className="flex max-w-72 flex-wrap gap-1">
        {(Array.isArray(value) ? dataTableParts(value) : [text]).map((label) => (
          <Badge
            key={label}
            variant={column.tones?.[label] ?? 'neutral'}
          >
            {label}
          </Badge>
        ))}
      </span>
    ))
    .with({ type: 'link', value: P.string.regex(/^https?:\/\//) }, ({ value: url }) => (
      <span className="grid max-w-56 grid-cols-[minmax(6rem,max-content)]">
        <a
          className="group/link flex min-w-0 items-center gap-1 font-medium"
          href={url}
          rel="noreferrer"
          target="_blank"
          title={url}
        >
          <span className="truncate underline decoration-current/30 underline-offset-2 transition-colors group-hover/link:decoration-current">{name ?? text}</span>
          <ExternalLink
            aria-hidden="true"
            className="size-3 shrink-0 text-muted-foreground"
          />
        </a>
      </span>
    ))
    .with({ type: 'progress', value: P.number }, ({ value: amount }) => (
      <span className="flex items-center gap-2.5">
        <span aria-hidden="true" className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full bg-foreground" style={{ width: `${chartClamp(amount, 0, 100)}%` }} />
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">{text}</span>
      </span>
    ))
    .with({ type: 'date' }, () => <span className="text-muted-foreground">{text}</span>)
    .with({ type: 'text' }, () => full, () => <span className="text-pretty whitespace-pre-line">{text}</span>)
    .with({ type: 'text' }, () => (
      <span
        className={cn('line-clamp-2 max-w-72', text.length > ARTIFACTS_UI.dataTable.shortText ? 'min-w-32 text-pretty whitespace-normal' : 'whitespace-nowrap')}
        title={text.length > 40 ? text : undefined}
      >
        {text}
      </span>
    ))
    .otherwise(() => text));
}
