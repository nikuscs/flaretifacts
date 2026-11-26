import { cn } from 'cn';
import { match, P } from 'ts-pattern';
import { Badge } from '@/components/ui/badge';
import { TextLink } from '@/components/ui/text-link';
import Check from '~icons/lucide/check';
import Minus from '~icons/lucide/minus';

interface ComparisonTableOption {
  name: string;
  price?: string;
  period?: string;
  description?: string;
  highlight?: boolean;
  url?: string;
}

interface ComparisonTableRow {
  label: string;
  hint?: string;
  values: (boolean | string | number | null)[];
}

interface ComparisonTableProps {
  options: ComparisonTableOption[];
  rows: ComparisonTableRow[];
  label?: string;
}

function ComparisonTable({ options, rows, label = 'Comparison' }: ComparisonTableProps) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-(--radius-panel) border bg-card" data-slot="comparison-table">
      <table aria-label={label} className="w-full min-w-[34rem] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-1 w-[28%] bg-card p-4 text-left align-bottom text-xs font-normal text-muted-foreground max-sm:w-32" scope="col">
              <span className="sr-only">Feature</span>
            </th>
            {options.map((option) => (
              <th className={cn('p-4 text-left align-top font-normal', option.highlight && 'bg-muted/60')} key={option.name} scope="col">
                <span className="flex flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <TextLink href={option.url}>{option.name}</TextLink>
                    {option.highlight ? <Badge variant="info">Pick</Badge> : null}
                  </span>
                  {option.price ? (
                    <span className="text-xl leading-tight font-medium tracking-tight tabular-nums">
                      {option.price}
                      {option.period ? <span className="ml-0.5 text-xs font-normal tracking-normal text-muted-foreground">{option.period}</span> : null}
                    </span>
                  ) : null}
                  {option.description ? <span className="text-xs text-pretty text-muted-foreground">{option.description}</span> : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-t border-border/60" key={`${row.label}-${index}`}>
              <th className="sticky left-0 z-1 bg-card px-4 py-3 text-left align-top font-normal" scope="row">
                <span className="block">{row.label}</span>
                {row.hint ? <span className="block text-xs text-muted-foreground">{row.hint}</span> : null}
              </th>
              {options.map((option, at) => (
                <td className={cn('px-4 py-3 align-top tabular-nums', option.highlight && 'bg-muted/60')} key={option.name}>
                  {match(row.values.at(at) ?? null)
                    .with(true, () => (
                      <span className="inline-grid size-5 place-items-center rounded-full bg-success/12 text-success">
                        <Check aria-label="Yes" className="size-3.5" />
                      </span>
                    ))
                    .with(P.union(false, null, ''), () => <Minus aria-label="No" className="size-4 text-(--text-muted)" />)
                    .otherwise((value) => String(value))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { ComparisonTable };
