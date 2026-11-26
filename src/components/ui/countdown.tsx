'use client';

import { useSyncExternalStore } from 'react';
import CircleCheck from '~icons/lucide/circle-check';

interface CountdownProps {
  to: number;
  caption: string;
  title?: string;
  doneText?: string;
}

function countdownSubscribe(onTick: () => void) {
  const timer = setInterval(onTick, 1000);

  return () => clearInterval(timer);
}

function Countdown({ to, caption, title, doneText = 'It is here' }: CountdownProps) {
  const now = useSyncExternalStore(countdownSubscribe, () => Math.floor(Date.now() / 1000), () => null);
  const left = now === null ? null : Math.max(0, Math.floor(to / 1000) - now);

  const units = [
    { label: 'days', value: left === null ? null : Math.floor(left / 86_400) },
    { label: 'hours', value: left === null ? null : Math.floor(left / 3600) % 24 },
    { label: 'minutes', value: left === null ? null : Math.floor(left / 60) % 60 },
    { label: 'seconds', value: left === null ? null : left % 60 },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-3" data-slot="countdown">
      {title ? <span className="text-sm font-medium">{title}</span> : null}
      {left === 0 ? (
        <span className="flex items-center gap-2 text-2xl font-medium tracking-tight">
          <CircleCheck aria-hidden="true" className="size-6 text-success" />
          {doneText}
        </span>
      ) : (
        <div aria-live="off" className="grid grid-cols-4 gap-2">
          {units.map((unit) => (
            <div className="flex flex-col items-center gap-1 rounded-(--radius-control) border bg-(--surface-raised) px-1 py-3" key={unit.label}>
              <span className="text-[1.75rem] leading-none font-medium tracking-[-0.03em] tabular-nums">{unit.value === null ? '–' : String(unit.value).padStart(2, '0')}</span>
              <span className="text-xs text-muted-foreground">{unit.label}</span>
            </div>
          ))}
        </div>
      )}
      <span className="text-xs text-muted-foreground tabular-nums">{caption}</span>
    </div>
  );
}

export { Countdown };
