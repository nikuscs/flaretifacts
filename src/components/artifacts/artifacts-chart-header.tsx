import { cn } from 'cn';
import { chartTone } from '@/utils/chart.utils';

interface ArtifactsChartHeaderProps {
  title?: string;
  value?: string;
  unit?: string;
  change?: string;
  caption?: string;
}

export function ArtifactsChartHeader({ title, value, unit, change, caption }: ArtifactsChartHeaderProps) {
  if (!title && !value && !change && !caption) {
    return null;
  }

  const tone = change ? chartTone(change) : undefined;

  return (
    <header className="grid min-w-0 gap-1">
      {title ? <span className="truncate text-sm font-medium">{title}</span> : null}
      {value || change ? (
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          {value ? (
            <span className="text-2xl leading-none font-medium tracking-tight tabular-nums">
              {value}
              {unit ? <span className="ml-1 text-sm font-normal tracking-normal text-muted-foreground">{unit}</span> : null}
            </span>
          ) : null}
          {change ? (
            <small
              className={cn(
                'inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground tabular-nums',
                tone === 'up' && 'border-transparent bg-success/10 text-success',
                tone === 'down' && 'border-transparent bg-destructive/10 text-destructive',
              )}
            >
              {change}
            </small>
          ) : null}
        </span>
      ) : null}
      {caption ? <span className="text-xs text-muted-foreground">{caption}</span> : null}
    </header>
  );
}
