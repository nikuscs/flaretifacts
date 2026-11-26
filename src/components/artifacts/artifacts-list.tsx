import { ArtifactsPager } from '@/components/artifacts/artifacts-pager';
import { ArtifactsRowText } from '@/components/artifacts/artifacts-row-text';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { dataTableWhere } from '@/utils/data-table.utils';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsListProps {
  block: ArtifactsBlocksProps<'List'>;
}

export function ArtifactsList({ block: { items, where, pageSize } }: ArtifactsListProps) {
  const found = dataTableWhere(items, where);

  return (
    <ArtifactsPager
      items={found}
      key={JSON.stringify(where ?? {})}
      pageSize={pageSize}
    >
      {(visible, pager) => (
        <div className="min-w-0 overflow-hidden rounded-(--radius-panel) border bg-card">
          <ul className="m-0 flex min-w-0 list-none flex-col divide-y divide-border/60 p-0">
            {visible.map((item, index) => (
              <li className={ARTIFACTS_UI.row} key={`${item.title}-${index}`}>
                <ArtifactsRowText description={item.description}>
                  {item.url ? (
                    <a
                      className="font-medium underline decoration-current/30 underline-offset-2 transition-colors hover:decoration-current"
                      href={item.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.title}
                    </a>
                  ) : item.title}
                </ArtifactsRowText>
                {item.meta ? <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{item.meta}</span> : null}
              </li>
            ))}
            {visible.length === 0 ? <li className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing matches</li> : null}
          </ul>
          {pager}
        </div>
      )}
    </ArtifactsPager>
  );
}
