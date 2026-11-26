import { CopyButton } from '@/components/ui/copy';
import { TextLink } from '@/components/ui/text-link';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { dataTableCopyText } from '@/utils/data-table.utils';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsKeyValueProps {
  items: ArtifactsBlocksProps<'KeyValue'>['items'];
}

export function ArtifactsKeyValue({ items }: ArtifactsKeyValueProps) {
  return (
    <dl className={ARTIFACTS_UI.list}>
      {items.map((item, index) => (
        <div className={ARTIFACTS_UI.row} key={`${item.label}-${index}`}>
          <dt className="max-w-1/2 shrink-0 text-muted-foreground">{item.label}</dt>
          <dd className="flex min-w-0 flex-1 items-center justify-end gap-1 text-right font-medium tabular-nums">
            <span className="min-w-0 text-pretty wrap-break-word"><TextLink href={item.url}>{item.value}</TextLink></span>
            {item.copy ? (
              <CopyButton
                className="my-0"
                label={item.label.toLowerCase()}
                value={dataTableCopyText(item.url ?? item.value)}
              />
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
