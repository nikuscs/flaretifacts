'use client';

import { cn } from 'cn';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { MOTION } from '@/constants/motion.constants';
import ChevronDown from '~icons/lucide/chevron-down';
import type { ReactNode } from 'react';

interface TimelineEvent {
  id: string;
  day: string;
  time: string;
  title: ReactNode;
  icon: ReactNode;
  actor?: string;
  meta?: string;
  tone?: 'neutral' | 'success' | 'danger';
  detail?: ReactNode;
}

interface TimelineProps {
  events: TimelineEvent[];
  label: string;
  className?: string;
}

function Timeline({ events, label, className }: TimelineProps) {
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState<string[]>([]);
  const days = [...new Set(events.map((event) => event.day))];

  return (
    <div aria-label={label} className={cn('grid min-w-0', className)} data-slot="timeline" role="feed">
      {days.map((day) => {
        const rows = events.filter((event) => event.day === day);

        return (
          <section className="relative" key={day}>
            <h3 className="sticky top-0 z-2 flex items-baseline justify-between gap-3 bg-popover py-2 pr-3 text-sm font-medium">
              {day}
              <span className="text-xs font-normal text-muted-foreground tabular-nums">{rows.length === 1 ? '1 update' : `${rows.length} updates`}</span>
            </h3>
            <ol className="mb-3">
              {rows.map((row, index) => {
                const open = expanded.includes(row.id);
                const Trigger = row.detail ? 'button' : 'div';

                return (
                  <li className="relative pl-9" key={row.id}>
                    <motion.span
                      animate={{ scale: 1, opacity: 1 }}
                      aria-hidden="true"
                      className={cn(
                        'absolute top-2 left-0 z-1 grid size-7 place-items-center rounded-full border bg-card text-muted-foreground [&_svg]:size-3.5 [&_svg]:stroke-2',
                        row.tone === 'success' && 'border-success/20 bg-success/10 text-success',
                        row.tone === 'danger' && 'border-destructive/20 bg-destructive/10 text-destructive',
                      )}
                      initial={reduced ? false : { scale: 0.4, opacity: 0 }}
                      transition={reduced ? { duration: 0 } : { ...MOTION.spring.morph, delay: index * MOTION.stagger.item }}
                    >
                      {row.icon}
                    </motion.span>
                    {index < rows.length - 1 ? <span aria-hidden="true" className="absolute top-10 -bottom-1 left-[13.5px] w-px bg-(--border-strong)" /> : null}
                    <Trigger
                      aria-expanded={row.detail ? open : undefined}
                      className={cn(
                        'grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 rounded-(--radius-control) p-3 text-left transition-colors',
                        row.detail && 'cursor-pointer grid-cols-[minmax(0,1fr)_auto_16px] hover:bg-muted',
                      )}
                      type={row.detail ? 'button' : undefined}
                      onClick={row.detail ? () => setExpanded((current) => (open ? current.filter((id) => id !== row.id) : [...current, row.id])) : undefined}
                    >
                      <span className="grid min-w-0 gap-0.5">
                        <span className="text-sm leading-5 text-muted-foreground">
                          {row.actor ? <span className="font-medium text-foreground">{`${row.actor} `}</span> : null}
                          {row.title}
                        </span>
                        {row.meta ? <span className="truncate text-xs text-muted-foreground">{row.meta}</span> : null}
                      </span>
                      <span className="flex min-w-11 justify-end text-xs leading-5 whitespace-nowrap text-muted-foreground tabular-nums">{row.time}</span>
                      {row.detail ? <ChevronDown aria-hidden="true" className={cn('mt-0.5 size-4 text-muted-foreground transition-transform duration-240', open && 'rotate-180')} /> : null}
                    </Trigger>
                    <AnimatePresence initial={false}>
                      {open ? (
                        <motion.div
                          animate={{ height: 'auto', opacity: 1 }}
                          className="overflow-clip"
                          exit={{ height: 0, opacity: 0 }}
                          initial={{ height: 0, opacity: 0 }}
                          transition={reduced ? { duration: 0 } : MOTION.spring.smooth}
                        >
                          <div className="px-3 pb-4 text-sm text-muted-foreground">{row.detail}</div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

export { Timeline };
