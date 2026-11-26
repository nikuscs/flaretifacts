import { cn } from 'cn';
import { ArtifactsPager } from '@/components/artifacts/artifacts-pager';
import { Tile } from '@/components/ui/tile';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { dataTableWhere } from '@/utils/data-table.utils';
import ArrowUpRight from '~icons/lucide/arrow-up-right';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsFilesProps {
  block: ArtifactsBlocksProps<'Files'>;
}

export function ArtifactsFiles({ block: { items, columns = '2', where, pageSize } }: ArtifactsFilesProps) {
  return (
    <ArtifactsPager
      items={dataTableWhere(items, where)}
      key={JSON.stringify(where ?? {})}
      pageSize={pageSize}
    >
      {(visible, pager) => (
        <div className="flex min-w-0 flex-col gap-3">
          <ul className={cn('m-0 grid list-none gap-3 p-0', ARTIFACTS_UI.columns[columns])}>
            {visible.map((item, index) => {
              const Icon = ARTIFACTS_UI.fileKinds[item.kind ?? 'link'];

              return (
                <li className="min-w-0" key={`${item.url}-${index}`}>
                  <a
                    className="group/file flex h-full min-w-0 items-start gap-3 rounded-(--radius-control) border bg-card p-3 shadow-(--shadow-resting) transition-colors hover:border-(--border-strong) hover:bg-muted/30"
                    href={item.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Tile size="lg">
                      <Icon />
                    </Tile>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-sm font-medium">
                        <span className="truncate">{item.title}</span>
                        <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/file:opacity-100" />
                      </span>
                      {item.description ? <span className="line-clamp-2 text-xs text-pretty text-muted-foreground">{item.description}</span> : null}
                      <span className="truncate text-xs text-(--text-muted) tabular-nums">
                        {[new URL(item.url).host.replace(/^www\./, ''), item.meta].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
          {pager ? <div className="overflow-hidden rounded-(--radius-control) border bg-card [&>[data-slot=data-table-pagination]]:border-t-0">{pager}</div> : null}
        </div>
      )}
    </ArtifactsPager>
  );
}
