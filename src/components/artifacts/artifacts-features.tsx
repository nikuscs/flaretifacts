import { cn } from 'cn';
import { TextLink } from '@/components/ui/text-link';
import { Tile } from '@/components/ui/tile';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsFeaturesProps {
  block: ArtifactsBlocksProps<'Features'>;
}

export function ArtifactsFeatures({ block: { items, columns = '3' } }: ArtifactsFeaturesProps) {
  return (
    <ul className={cn('m-0 grid list-none gap-3 p-0', ARTIFACTS_UI.columns[columns])}>
      {items.map((item, index) => {
        const Icon = ARTIFACTS_UI.icons[item.icon];

        return (
          <li className="flex min-w-0 flex-col gap-3 rounded-(--radius-control) border bg-card p-4 shadow-(--shadow-resting)" key={`${item.title}-${index}`}>
            <Tile size="lg">
              <Icon />
            </Tile>
            <span className="flex flex-col gap-1">
              <span className="text-sm font-medium text-balance"><TextLink href={item.url}>{item.title}</TextLink></span>
              {item.text ? <span className="text-xs leading-relaxed text-pretty text-muted-foreground">{item.text}</span> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
