import { cn } from 'cn';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsIconProps {
  block: ArtifactsBlocksProps<'Icon'>;
}

export function ArtifactsIcon({ block: { icon, label, description, tone = 'neutral', size = 'md' } }: ArtifactsIconProps) {
  const Icon = ARTIFACTS_UI.icons[icon];
  const sizes = ARTIFACTS_UI.iconBlock.sizes[size];

  return (
    <div className={cn('flex min-w-0 items-center', sizes.gap)}>
      <span
        aria-hidden="true"
        className={cn(
          'grid shrink-0 place-items-center ring-1 ring-inset [&_svg]:shrink-0',
          ARTIFACTS_UI.iconBlock.tones[tone],
          sizes.box,
        )}
      >
        <Icon />
      </span>
      {label || description ? (
        <span className="flex min-w-0 flex-col gap-0.5">
          {label ? <span className={cn('font-medium text-balance', sizes.label)}>{label}</span> : null}
          {description ? <span className={cn('leading-relaxed text-pretty text-muted-foreground', sizes.description)}>{description}</span> : null}
        </span>
      ) : null}
    </div>
  );
}
