import { TextLink } from '@/components/ui/text-link';
import { Timeline } from '@/components/ui/timeline';
import Dot from '~icons/lucide/dot';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsTimelineProps {
  block: ArtifactsBlocksProps<'Timeline'>;
}

export function ArtifactsTimeline({ block: { events, label } }: ArtifactsTimelineProps) {
  return (
    <Timeline
      events={events.map(({ url, title, detail, ...event }, index) => ({
        ...event,
        id: String(index),
        icon: <Dot />,
        title: url && !detail ? <span className="text-foreground"><TextLink href={url}>{title}</TextLink></span> : title,
        detail: url && detail ? (
          <span className="flex flex-col gap-1.5">
            {detail}
            <span className="self-start font-medium text-foreground"><TextLink href={url}>Open link</TextLink></span>
          </span>
        ) : detail,
      }))}
      label={label ?? 'Timeline'}
    />
  );
}
