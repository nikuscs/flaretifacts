import { cn } from 'cn';
import { match, P } from 'ts-pattern';

interface StatsBandItem {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  context?: string;
}

interface StatsBandProps {
  items: StatsBandItem[];
  formatValue: (value: number) => string;
}

const statsBandColumns = ['grid-cols-1', 'grid-cols-1', 'grid-cols-2', 'grid-cols-2 sm:grid-cols-3', 'grid-cols-2 lg:grid-cols-4', 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5', 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'];

function StatsBand({ items, formatValue }: StatsBandProps) {
  return (
    <dl className={cn('m-0 grid gap-px overflow-hidden rounded-(--radius-panel) border bg-border', statsBandColumns[items.length] ?? statsBandColumns[4])} data-slot="stats-band">
      {items.map((item, index) => (
        <div className="flex min-w-0 flex-col gap-1.5 bg-card px-5 py-4" key={`${item.label}-${index}`}>
          <dt className="truncate text-[13px] text-muted-foreground">{item.label}</dt>
          <dd className="m-0 flex items-baseline gap-0.5 text-[1.75rem] leading-none font-medium tracking-[-0.03em] tabular-nums">
            {item.prefix ? <span className="text-lg text-muted-foreground">{item.prefix}</span> : null}
            <span className="truncate">{match(item.value).with(P.number, (amount) => formatValue(amount)).otherwise((text) => text)}</span>
            {item.suffix ? <span className="ml-0.5 text-base font-normal tracking-normal text-muted-foreground">{item.suffix}</span> : null}
          </dd>
          {item.context ? <dd className="m-0 truncate text-xs text-muted-foreground">{item.context}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

export { StatsBand };
