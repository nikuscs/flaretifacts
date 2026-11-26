'use client';

import { cn } from 'cn';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { MOTION } from '@/constants/motion.constants';

export interface WaffleChartDatum {
  key: string;
  label: string;
  value: number;
  color?: string;
}

interface WaffleChartProps {
  data: WaffleChartDatum[];
  label: string;
  formatValue: (value: number) => string;
  money?: boolean;
  className?: string;
}

const waffleChartPalette = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];
const waffleChartNeutral = [56, 42, 32];

export function WaffleChart({ data, label, formatValue, money = false, className }: WaffleChartProps) {
  const moneyMark = money ? '' : undefined;
  const reduced = Boolean(useReducedMotion());
  const [active, setActive] = useState<string | null>(null);
  const parts = data.filter((item) => item.value > 0);
  const total = parts.reduce((sum, item) => sum + item.value, 0);
  const exact = parts.map((item) => (total ? (item.value / total) * 100 : 0));
  const floors = exact.map(Math.floor);
  const left = 100 - floors.reduce((sum, cells) => sum + cells, 0);
  const remainders = exact.map((share, index) => ({ index, rest: share - Math.floor(share) })).sort((a, b) => b.rest - a.rest);
  const extra = new Set(remainders.slice(0, total ? left : 0).map((item) => item.index));
  const counts = floors.map((cells, index) => cells + (extra.has(index) ? 1 : 0));

  const colorOf = (index: number) => parts[index]?.color ?? (index < 4
    ? waffleChartPalette[index]
    : `color-mix(in oklab, var(--foreground) ${waffleChartNeutral[(index - 4) % waffleChartNeutral.length]}%, var(--surface))`);

  const cells = counts.flatMap((count, index) => Array.from({ length: count }, () => index));

  return (
    <figure aria-label={label} className={cn('m-0 flex min-w-0 flex-wrap items-center justify-center gap-x-8 gap-y-6', className)}>
      <div aria-hidden="true" className="grid w-[232px] shrink-0 grid-flow-col grid-cols-10 grid-rows-10 gap-1">
        {Array.from({ length: 100 }, (_, cell) => {
          const index = cells.at(cell);
          const owner = index === undefined ? undefined : parts[index];
          const dim = active !== null && owner?.key !== active;

          return (
            <motion.span
              animate={{ opacity: dim ? 0.3 : 1, scale: owner && owner.key === active ? 0.9 : 1 }}
              className="aspect-square rounded-[5px] transition-[background-color] duration-300"
              initial={false}
              key={cell}
              style={{ background: index === undefined ? 'var(--muted)' : colorOf(index) }}
              transition={reduced ? { duration: 0 } : { ...MOTION.spring.smooth, delay: (cell % 10) * 0.008 }}
            />
          );
        })}
      </div>
      <ul className="m-0 grid min-w-56 flex-1 list-none gap-0.5 p-0" onPointerLeave={() => setActive(null)}>
        {parts.map((item, index) => (
          <li key={item.key}>
            <button
              className="grid min-h-9 w-full cursor-default grid-cols-[10px_minmax(0,1fr)_auto_3em] items-center gap-x-2.5 rounded-xl px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-foreground/5 data-active:bg-foreground/5"
              data-active={item.key === active || undefined}
              onBlur={() => setActive(null)}
              onFocus={() => setActive(item.key)}
              onPointerEnter={() => setActive(item.key)}
              type="button"
            >
              <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ background: colorOf(index) }} />
              <span className="truncate">{item.label}</span>
              <span className="text-muted-foreground tabular-nums" data-money={moneyMark}>{formatValue(item.value)}</span>
              <span className="text-right font-medium tabular-nums">{`${counts[index] ?? 0}%`}</span>
            </button>
          </li>
        ))}
      </ul>
    </figure>
  );
}
