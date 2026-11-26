import { cn } from 'cn';
import { match } from 'ts-pattern';
import Check from '~icons/lucide/check';
import TriangleAlert from '~icons/lucide/triangle-alert';

interface StepperStep {
  title: string;
  description?: string;
  error?: string;
}

interface StepperProps {
  steps: StepperStep[];
  current: number;
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

const stepperStatus = {
  complete: { marker: 'bg-foreground text-background ring-0', title: 'text-(--text-secondary)', spoken: ', done' },
  current: { marker: 'text-foreground ring-2 ring-foreground', title: 'text-foreground', spoken: '' },
  upcoming: { marker: 'text-(--text-muted) ring-1 ring-(--border-strong)', title: 'text-(--text-muted)', spoken: ', not started' },
  error: { marker: 'bg-destructive/10 text-destructive ring-2 ring-destructive', title: 'text-foreground', spoken: ', failed' },
};

function Stepper({ steps, current, orientation = 'horizontal', label = 'Progress' }: StepperProps) {
  const active = Math.min(current, steps.length);
  const now = steps.at(active);
  const vertical = orientation === 'vertical';

  const statusOf = (step: StepperStep, index: number) => match({ failed: Boolean(step.error), place: Math.sign(index - active) })
    .with({ failed: true }, () => 'error' as const)
    .with({ place: -1 }, () => 'complete' as const)
    .with({ place: 0 }, () => 'current' as const)
    .otherwise(() => 'upcoming' as const);

  return (
    <div className="@container/steps min-w-0" data-slot="stepper">
      <ol
        aria-label={label}
        className={cn('m-0 grid list-none p-0', !vertical && '@max-md/steps:hidden')}
        style={vertical ? undefined : { gridTemplateColumns: `repeat(${steps.length - 1}, minmax(0, 1fr)) auto` }}
      >
        {steps.map((step, index) => {
          const status = statusOf(step, index);
          const detail = step.error ?? step.description;

          return (
            <li
              aria-current={status === 'current' ? 'step' : undefined}
              className={cn('relative min-w-0', vertical ? 'grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 not-last:pb-5' : 'grid content-start justify-items-start gap-y-3 not-last:pr-4')}
              key={`${step.title}-${index}`}
            >
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn('absolute overflow-hidden rounded-full bg-border', vertical ? 'top-9 bottom-1.5 left-3.25 w-0.5' : 'top-3.25 right-2 left-9 h-0.5')}
                >
                  <span
                    className={cn(
                      'absolute inset-0 rounded-full bg-foreground transition-transform duration-(--duration-considered) ease-(--ease-standard)',
                      vertical ? 'origin-top' : 'origin-left',
                      index >= active && (vertical ? 'scale-y-0' : 'scale-x-0'),
                    )}
                  />
                </span>
              ) : null}
              <span aria-hidden="true" className="relative grid size-7 shrink-0 place-items-center">
                {status === 'current' ? <span className="absolute -inset-1 rounded-full bg-foreground/8" /> : null}
                <span className={cn('relative grid size-full place-items-center rounded-full bg-card text-xs font-medium tabular-nums ring-inset [&_svg]:size-3.5', stepperStatus[status].marker)}>
                  {match(status)
                    .with('complete', () => <Check />)
                    .with('error', () => <TriangleAlert />)
                    .otherwise(() => index + 1)}
                </span>
              </span>
              <span className={cn('grid min-w-0', vertical && 'pt-1')}>
                <span className={cn('text-sm leading-5 font-medium wrap-break-word', stepperStatus[status].title)}>
                  {step.title}
                  <span className="sr-only">{stepperStatus[status].spoken}</span>
                </span>
                {detail ? <span className={cn('pt-0.5 text-xs text-pretty', step.error ? 'text-destructive' : 'text-muted-foreground')}>{detail}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
      {vertical ? null : (
        <div aria-hidden="true" className="hidden gap-3 @max-md/steps:grid">
          <div className="flex items-center gap-1.5">
            {steps.map((step, index) => (
              <span
                className={cn('h-1.5 flex-1 rounded-full bg-border', index < active && 'bg-foreground', index === active && 'bg-foreground/40', step.error && 'bg-destructive')}
                key={`${step.title}-${index}`}
              />
            ))}
          </div>
          <div className="grid gap-0.5">
            <span className="text-xs text-muted-foreground tabular-nums">{now ? `Step ${active + 1} of ${steps.length}` : `All ${steps.length} steps done`}</span>
            <span className="text-sm font-medium">{now?.title ?? steps.at(-1)?.title}</span>
            {now?.error ?? now?.description ? <span className={cn('text-xs', now.error ? 'text-destructive' : 'text-muted-foreground')}>{now.error ?? now.description}</span> : null}
          </div>
        </div>
      )}
    </div>
  );
}

export { Stepper };
