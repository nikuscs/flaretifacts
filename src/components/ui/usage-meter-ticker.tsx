'use client';

import { animate, AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { CHART } from '@/constants/chart.constants';
import { MOTION } from '@/constants/motion.constants';
import { chartSoon, chartSpring } from '@/utils/chart.utils';
import type { MotionValue } from 'motion/react';

interface UsageMeterTickerProps {
  value: number;
  formatter: Intl.NumberFormat;
  reduced: boolean;
}

interface UsageMeterTickerColumnProps {
  digit: number;
  direction: number;
  reduced: boolean;
}

const usageMeterTickerTurn = chartSpring(MOTION.spring.smooth);
const usageMeterTickerFit = chartSpring(MOTION.spring.morph, 0.01);

function usageMeterTickerGlyphs(value: number, formatter: Intl.NumberFormat) {
  const parts = formatter.formatToParts(value);
  let place = parts.reduce((count, part) => count + (part.type === 'integer' ? part.value.length : 0), 0);
  let fraction = 0;

  return parts.flatMap((part, index): { key: string; digit: number | null; text: string }[] => {
    if (part.type === 'integer') {
      return part.value.split('').map((char) => {
        place -= 1;

        return { key: `i${place}`, digit: Number(char), text: char };
      });
    }

    if (part.type === 'fraction') {
      return part.value.split('').map((char) => {
        fraction += 1;

        return { key: `f${fraction}`, digit: Number(char), text: char };
      });
    }

    const key = match(part.type)
      .with('group', () => `g${place}`)
      .with('decimal', () => 'd')
      .otherwise(() => `${part.type}${index}`);

    return [{ key, digit: null, text: part.value }];
  });
}

function UsageMeterTickerGlyph({ position, digit }: { position: MotionValue<number>; digit: number }) {
  const offset = useTransform(position, (current) => ((((digit - current) % 10) + 15) % 10) - 5);
  const y = useTransform(offset, (current) => `${current}em`);
  const opacity = useTransform(offset, (current) => Math.max(0, 1 - Math.abs(current)));
  const filter = useTransform(offset, (current) => (Math.abs(current) < 0.02 || Math.abs(current) >= 1 ? 'none' : `blur(${(Math.abs(current) * CHART.usageMeter.blur).toFixed(2)}px)`));

  return <motion.span className="absolute inset-x-0 inset-y-(--feather) text-center" style={{ y, opacity, filter }}>{digit}</motion.span>;
}

function UsageMeterTickerColumn({ digit, direction, reduced }: UsageMeterTickerColumnProps) {
  const position = useMotionValue(digit);
  const wheel = useRef({ digit, target: digit });
  const running = useRef<(() => void) | null>(null);

  useEffect(() => () => running.current?.(), []);

  useEffect(() => {
    const state = wheel.current;

    if (state.digit === digit) {
      return;
    }

    state.target += direction < 0 ? -((state.digit - digit + 10) % 10) : (digit - state.digit + 10) % 10;
    state.digit = digit;
    running.current?.();

    if (reduced) {
      position.jump(state.target);
      running.current = null;

      return;
    }

    const { target } = state;

    running.current = chartSoon(() => animate(position, target, usageMeterTickerTurn));
  }, [digit, direction, position, reduced]);

  return (
    <motion.span
      {...CHART.usageMeter.column}
      className="relative -my-(--feather) inline-block overflow-hidden mask-[linear-gradient(to_bottom,transparent,#000_calc(var(--feather)*1.5),#000_calc(100%-var(--feather)*1.5),transparent)] py-(--feather) [--feather:.16em]"
      transition={reduced ? { duration: 0 } : usageMeterTickerFit}
    >
      <span className="invisible">0</span>
      {CHART.usageMeter.digits.map((item) => <UsageMeterTickerGlyph digit={item} key={item} position={position} />)}
    </motion.span>
  );
}

export function UsageMeterTicker({ value, formatter, reduced }: UsageMeterTickerProps) {
  const [trend, setTrend] = useState({ value, direction: 1 });

  if (trend.value !== value) {
    setTrend({ value, direction: value > trend.value ? 1 : -1 });
  }

  return (
    <span aria-hidden="true" className="relative inline-flex items-start whitespace-nowrap tabular-nums select-none">
      <AnimatePresence initial={false}>
        {usageMeterTickerGlyphs(value, formatter).map((glyph) => (glyph.digit === null ? (
          <motion.span {...CHART.usageMeter.column} className="inline-block overflow-x-clip" key={glyph.key} transition={reduced ? { duration: 0 } : usageMeterTickerFit}>
            {glyph.text}
          </motion.span>
        ) : <UsageMeterTickerColumn digit={glyph.digit} direction={trend.direction} key={glyph.key} reduced={reduced} />))}
      </AnimatePresence>
    </span>
  );
}
