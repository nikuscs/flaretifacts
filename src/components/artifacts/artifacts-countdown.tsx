import { Countdown } from '@/components/ui/countdown';
import { datesDayLong, datesParseDay } from '@/utils/dates.utils';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsCountdownProps {
  block: ArtifactsBlocksProps<'Countdown'>;
}

export function ArtifactsCountdown({ block: { to, title, doneText } }: ArtifactsCountdownProps) {
  const written = datesParseDay(to);
  const zone = /(?:Z|[+-]\d{2}:?\d{2})$/.exec(to)?.[0] ?? 'Z';

  return (
    <Countdown
      caption={written ? `${datesDayLong(written.date)}, ${written.time ?? '00:00'} ${['Z', '+00:00', '-00:00'].includes(zone) ? 'UTC' : `UTC${zone}`}` : to}
      doneText={doneText}
      title={title}
      to={Date.parse(to)}
    />
  );
}
