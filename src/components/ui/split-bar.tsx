'use client';

import { cn } from 'cn';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { MOTION } from '@/constants/motion.constants';

export interface SplitBarSegment {
  key: string;
  label: string;
  value: number;
  color?: string;
}

interface SplitBarProps {
  segments: SplitBarSegment[];
  formatValue: (value: number) => string;
  money?: boolean;
  title?: string;
  description?: string;
  totalLabel?: string;
  compact?: boolean;
  className?: string;
}

const splitBarPalette = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--text-muted)', 'var(--border-strong)'];
const splitBarPercent = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 1 });

export function SplitBar({ segments, formatValue, money = false, title, description, totalLabel = 'Total', compact = false, className }: SplitBarProps) {
  const moneyMark = money ? '' : undefined;
  const reduced = Boolean(useReducedMotion());
  const [hidden, setHidden] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const parts = segments.filter((segment) => segment.value > 0);
  const shown = parts.filter((segment) => !hidden.includes(segment.key));
  const total = shown.reduce((sum, segment) => sum + segment.value, 0);
  const colorOf = (segment: SplitBarSegment) => segment.color ?? splitBarPalette[parts.indexOf(segment) % splitBarPalette.length];
  const highlighted = shown.find((segment) => segment.key === active);
  const transition = reduced ? { duration: 0 } : MOTION.spring.morph;

  const toggle = (key: string) => {
    if (hidden.includes(key)) {
      setHidden(hidden.filter((item) => item !== key));
    } else if (shown.length > 1) {
      setHidden([...hidden, key]);
    }
  };

  return (
    <figure aria-label={title} className={cn('m-0 grid min-w-0', compact ? 'gap-1.5' : 'gap-3', className)}>
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-4 gap-y-2">
        {title || description ? (
          <div className="grid min-w-0 gap-0.5">
            {title ? <p className="text-sm font-medium">{title}</p> : null}
            {description ? <p className="text-[13px] text-muted-foreground">{description}</p> : null}
          </div>
        ) : null}
        <p aria-live="polite" className={cn('ml-auto flex min-w-0 items-baseline gap-2 whitespace-nowrap', compact ? 'text-xs' : 'text-[13px]')}>
          {highlighted ? (
            <span aria-hidden="true" className="size-2 self-center rounded-[2px]" style={{ background: colorOf(highlighted) }} />
          ) : null}
          <span className="truncate text-muted-foreground">{highlighted?.label ?? totalLabel}</span>
          <span className={cn('leading-tight font-medium tabular-nums', compact ? 'text-sm' : 'text-lg')} data-money={highlighted ? undefined : moneyMark}>{highlighted ? splitBarPercent.format(highlighted.value / total) : formatValue(total)}</span>
          {highlighted ? <span className="text-muted-foreground tabular-nums" data-money={moneyMark}>{formatValue(highlighted.value)}</span> : null}
        </p>
      </div>
      <div className={cn('flex overflow-hidden bg-muted', compact ? 'h-2 rounded-full' : 'h-11 rounded-xl')} onPointerLeave={() => setActive(null)}>
        {parts.map((segment) => {
          const on = !hidden.includes(segment.key);
          const share = on && total ? segment.value / total : 0;
          const isActive = segment.key === active;
          const grow = isActive ? Math.max(share + 0.045, Math.min(share * 1.6, 0.42)) : share;
          const color = colorOf(segment);

          return (
            <motion.button
              animate={{ flexGrow: grow * 1000, opacity: active && !isActive ? 0.5 : 1 }}
              aria-label={`${segment.label}, ${formatValue(segment.value)}, ${splitBarPercent.format(share)}`}
              className={cn('relative flex min-w-0 basis-0 cursor-default items-start overflow-hidden text-left text-xs font-medium whitespace-nowrap tabular-nums', compact ? 'border-r-2' : 'border-r-[3px] pt-3.5 pl-2.5')}
              initial={false}
              key={segment.key}
              onBlur={() => setActive(null)}
              onFocus={() => setActive(segment.key)}
              onPointerEnter={() => setActive(segment.key)}
              style={{ background: compact ? color : `color-mix(in oklab, ${color} ${isActive ? 62 : 42}%, var(--surface))`, borderRightColor: on ? color : 'transparent' }}
              transition={transition}
              type="button"
            >
              {!compact && (share >= 0.14 || (isActive && share > 0)) ? (
                <span className="truncate">
                  {share >= 0.22 || isActive ? <span className="mr-1.5 font-normal">{segment.label}</span> : null}
                  {splitBarPercent.format(share)}
                </span>
              ) : null}
            </motion.button>
          );
        })}
      </div>
      {compact ? null : (
        <ul aria-label={`${title ?? 'Split'} segments`} className="-ml-2 flex min-w-0 flex-wrap gap-x-1 gap-y-0.5">
          {parts.map((segment) => {
            const off = hidden.includes(segment.key);
            const color = colorOf(segment);

            return (
              <li className="min-w-0" key={segment.key}>
                <button
                  aria-pressed={!off}
                  className="inline-flex min-h-8 max-w-full cursor-pointer items-baseline gap-2 rounded-[10px] py-1.5 pr-2.5 pl-2 text-[13px] transition-colors hover:bg-muted data-active:bg-muted"
                  data-active={segment.key === active || undefined}
                  onClick={() => toggle(segment.key)}
                  onPointerEnter={() => setActive(off ? null : segment.key)}
                  onPointerLeave={() => setActive(null)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="size-3 shrink-0 translate-y-px self-center rounded-[3px] border-r-[3px]"
                    style={off ? { boxShadow: 'inset 0 0 0 1.5px var(--border-strong)' } : { background: `color-mix(in oklab, ${color} 42%, var(--surface))`, borderRightColor: color }}
                  />
                  <span className={cn('min-w-0 truncate text-muted-foreground', off && 'line-through')}>{segment.label}</span>
                  <span className="min-w-[2.6em] tabular-nums">{off || !total ? 'off' : splitBarPercent.format(segment.value / total)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </figure>
  );
}
