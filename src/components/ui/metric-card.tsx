'use client';

import { cn } from 'cn';
import { animate, AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { MOTION } from '@/constants/motion.constants';
import type { MotionValue } from 'motion/react';
import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  formatValue: (value: number) => string;
  money?: boolean;
  context?: ReactNode;
  change?: string;
  tone?: 'up' | 'down';
  className?: string;
}

interface MetricCardWheelProps {
  digit: number;
  direction: number;
  armed: boolean;
  delay: number;
  reduced: boolean;
}

const metricCardDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const metricCardPresence = { initial: { width: 0, opacity: 0 }, animate: { width: 'auto', opacity: 1 } };

function MetricCardGlyph({ position, digit }: { position: MotionValue<number>; digit: number }) {
  const offset = useTransform(position, (current) => ((((digit - current) % 10) + 15) % 10) - 5);
  const y = useTransform(offset, (current) => `${current}em`);
  const opacity = useTransform(offset, (current) => Math.max(0, 1 - Math.abs(current)));
  const visibility = useTransform(offset, (current) => (Math.abs(current) >= 1 ? 'hidden' : 'visible'));

  return (
    <motion.span className="absolute inset-x-0 top-[0.16em] text-center" style={{ y, opacity, visibility }}>
      {digit}
    </motion.span>
  );
}

function MetricCardWheel({ digit, direction, armed, delay, reduced }: MetricCardWheelProps) {
  const position = useMotionValue(armed ? 0 : digit);

  const wheel = useRef({
    digit: armed ? 0 : digit,
    target: armed ? 0 : digit,
    revealed: !armed,
  });

  useEffect(() => {
    const state = wheel.current;

    if (armed || state.digit === digit) {
      state.revealed ||= !armed;

      return;
    }

    const forward = (digit - state.digit + 10) % 10;
    const backward = (state.digit - digit + 10) % 10;

    state.target += direction < 0 && state.revealed ? -backward : forward;
    state.digit = digit;

    if (reduced) {
      position.jump(state.target);
    } else {
      animate(position, state.target, state.revealed ? MOTION.spring.smooth : { ...MOTION.spring.smooth, visualDuration: MOTION.duration.considered, delay });
    }

    state.revealed = true;
  }, [armed, delay, digit, direction, position, reduced]);

  return (
    <motion.span
      className="relative -my-[0.16em] inline-block overflow-hidden mask-[linear-gradient(to_bottom,transparent,#000_0.24em,#000_calc(100%-0.24em),transparent)] py-[0.16em]"
      {...metricCardPresence}
      transition={reduced ? { duration: 0 } : MOTION.spring.morph}
    >
      <span className="invisible">0</span>
      {metricCardDigits.map((item) => <MetricCardGlyph digit={item} key={item} position={position} />)}
    </motion.span>
  );
}

export function MetricCard({ label, value, formatValue, money = false, context, change, tone, className }: MetricCardProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = Boolean(useReducedMotion());
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState(1);
  const text = formatValue(value);
  const armed = !inView && !reduced;
  const digits = text.replaceAll(/\D/g, '').length;

  if (value !== previous) {
    setPrevious(value);
    setDirection(value > previous ? 1 : -1);
  }

  const parts = text.split('').map((char, index) => {
    const order = text.slice(0, index + 1).replaceAll(/\D/g, '').length;
    const place = digits - order;

    return /\d/.test(char) ? { key: `d${place}`, char, digit: Number(char), order } : { key: `s${place}-${text.length - index}`, char, digit: null, order };
  });

  return (
    <article className={cn('flex min-w-0 flex-col rounded-(--radius-panel) border bg-card p-5 shadow-(--shadow-resting)', className)}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
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
      </div>
      <span
        className="text-[1.75rem] leading-none font-medium tracking-[-0.03em] tabular-nums"
        data-money={money ? '' : undefined}
        ref={ref}
      >
        <span className="sr-only">{text}</span>
        <span aria-hidden="true" className="inline-flex items-start whitespace-nowrap select-none">
          <AnimatePresence initial={false}>
            {parts.map((part) => (part.digit !== null ? (
              <MetricCardWheel
                armed={armed}
                delay={Math.min(part.order * MOTION.stagger.item, 0.25)}
                digit={part.digit}
                direction={direction}
                key={part.key}
                reduced={reduced}
              />
            ) : (
              <motion.span className="inline-block overflow-x-clip whitespace-pre" key={part.key} {...metricCardPresence} transition={reduced ? { duration: 0 } : MOTION.spring.morph}>
                {part.char}
              </motion.span>
            )))}
          </AnimatePresence>
        </span>
      </span>
      {context ? <p className="mt-4 text-sm leading-snug text-muted-foreground">{context}</p> : null}
    </article>
  );
}
