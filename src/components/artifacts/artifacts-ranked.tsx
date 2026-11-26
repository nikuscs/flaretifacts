import { TextLink } from '@/components/ui/text-link';

interface ArtifactsRankedRow {
  label: string;
  hint?: string;
  value: number;
  url?: string;
}

interface ArtifactsRankedProps {
  rows: ArtifactsRankedRow[];
  formatValue: (value: number) => string;
}

export function ArtifactsRanked({ rows, formatValue }: ArtifactsRankedProps) {
  const ranked = rows.toSorted((left, right) => right.value - left.value);
  const top = Math.max(1, ...ranked.map((row) => row.value));

  return (
    <ol className="m-0 flex list-none flex-col gap-1 p-0">
      {ranked.map((row, index) => (
        <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50" key={`${row.label}-${index}`}>
          <span className="flex min-w-0 flex-col">
            <span className="truncate"><TextLink href={row.url}>{row.label}</TextLink></span>
            {row.hint ? <span className="truncate text-xs text-muted-foreground">{row.hint}</span> : null}
          </span>
          <span className="text-right font-medium tabular-nums">{formatValue(row.value)}</span>
          <span aria-hidden="true" className="col-span-2 h-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-(--series-1)" style={{ width: `${(row.value / top) * 100}%` }} />
          </span>
        </li>
      ))}
    </ol>
  );
}
