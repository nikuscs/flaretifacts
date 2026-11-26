'use client';

import { cn } from 'cn';
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { TextSwap } from '@/components/ui/text-swap';
import { CHART } from '@/constants/chart.constants';
import { MOTION } from '@/constants/motion.constants';
import { chartClamp, chartDecimals, chartFixedFormatter } from '@/utils/chart.utils';

interface GaugeProps {
  value: number;
  label: string;
  max?: number;
  unit?: string;
  status?: string;
  description?: string;
  tone?: keyof typeof CHART.gauge.tones;
  className?: string;
}

function gaugePoint(angle: number) {
  const radians = (angle * Math.PI) / 180;

  return `${(50 + CHART.gauge.radius * Math.sin(radians)).toFixed(3)} ${(50 - CHART.gauge.radius * Math.cos(radians)).toFixed(3)}`;
}

function gaugeArc(sweep: number) {
  const end = CHART.gauge.start + CHART.gauge.span * chartClamp(sweep, 0, 1);

  return `M ${gaugePoint(CHART.gauge.start)} A ${CHART.gauge.radius} ${CHART.gauge.radius} 0 ${end - CHART.gauge.start > 180 ? 1 : 0} 1 ${gaugePoint(end)}`;
}

export function Gauge({ value, label, max, unit = max === undefined ? '%' : '', status, description, tone = 'default', className }: GaugeProps) {
  const range = max ?? 100;
  const safeMax = range > 0 ? range : 1;
  const clamped = chartClamp(value, 0, safeMax);
  const percentage = clamped / safeMax;
  const formatter = chartFixedFormatter(chartDecimals([value]));
  const shown = formatter.format(clamped);

  const rootRef = useRef<HTMLElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.5 });
  const reduced = Boolean(useReducedMotion());

  const sweep = useMotionValue(0);
  const count = useMotionValue(0);
  const digitsWidth = useMotionValue<number | 'auto'>('auto');
  const path = useTransform(sweep, gaugeArc);
  const arcOpacity = useTransform(sweep, (current) => chartClamp(current / CHART.gauge.capFade, 0, 1));
  const digits = useTransform(count, (current) => formatter.format(chartClamp(current, 0, safeMax)));
  const [filled, setFilled] = useState(false);
  const [moved, setMoved] = useState({ value: clamped, direction: 1 });

  if (moved.value !== clamped) {
    setMoved({ value: clamped, direction: clamped < moved.value ? -1 : 1 });
  }

  useEffect(() => {
    if (reduced) {
      sweep.jump(percentage);
      count.jump(clamped);

      const handle = requestAnimationFrame(() => setFilled(true));

      return () => cancelAnimationFrame(handle);
    }

    if (!inView) {
      return;
    }

    const arc = animate(sweep, percentage, filled ? MOTION.spring.morph : CHART.gauge.reveal);
    const number = animate(count, clamped, { ...(filled ? MOTION.spring.smooth : CHART.gauge.reveal), onComplete: () => setFilled(true) });

    return () => {
      arc.stop();
      number.stop();
    };
  }, [clamped, count, filled, inView, reduced, percentage, sweep]);

  useEffect(() => {
    const node = sizerRef.current;

    if (!node) {
      return;
    }

    let measured: string | null = null;

    const observer = new ResizeObserver(([entry]) => {
      const next = entry.borderBoxSize[0]?.inlineSize ?? node.offsetWidth;

      if (measured !== null && measured !== node.textContent && !reduced) {
        animate(digitsWidth, next, MOTION.spring.smooth);
      } else {
        digitsWidth.jump(next);
      }

      measured = node.textContent;
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [digitsWidth, reduced]);

  return (
    <figure className={cn('m-0 grid min-w-0 justify-items-center gap-2.5 text-center', CHART.gauge.tones[tone], className)} ref={rootRef}>
      <meter
        aria-label={label}
        aria-valuetext={status ? `${shown}${unit}, ${status}` : `${shown}${unit}`}
        className="sr-only"
        max={safeMax}
        min={0}
        value={clamped}
      />
      <div aria-hidden="true" className="relative aspect-100/90 w-[min(100%,176px)]">
        <svg aria-hidden="true" className="block size-full overflow-visible" focusable="false" viewBox="0 0 100 90">
          <path
            className="fill-none stroke-[color-mix(in_oklab,var(--gauge)_12%,var(--muted))] transition-[stroke] duration-(--duration-standard) ease-(--ease-standard) motion-reduce:transition-none"
            d={gaugeArc(1)}
            strokeLinecap="round"
            strokeWidth={CHART.gauge.stroke}
          />
          <motion.path
            className="fill-none stroke-(--gauge) transition-[stroke] duration-(--duration-standard) ease-(--ease-standard) motion-reduce:transition-none"
            d={path}
            strokeLinecap="round"
            strokeWidth={CHART.gauge.stroke}
            style={{ opacity: arcOpacity }}
          />
        </svg>
        <div className="pointer-events-none absolute top-0 left-0 grid aspect-square w-full place-content-center justify-items-center gap-1">
          <span className="relative inline-flex items-baseline text-[2.25rem] leading-none font-medium tracking-[-0.03em] text-foreground tabular-nums">
            <motion.span className="inline-flex justify-end whitespace-nowrap" style={{ width: digitsWidth }}>{digits}</motion.span>
            <span className="ml-px text-[.5em] tracking-normal text-muted-foreground">{unit}</span>
            <span className="pointer-events-none invisible absolute top-0 left-0 whitespace-nowrap" ref={sizerRef}>{shown}</span>
          </span>
          {status ? (
            <span className="min-h-[1.4em] min-w-[100px] text-xs leading-[1.4] font-medium text-(--gauge) transition-colors duration-(--duration-standard) motion-reduce:transition-none">
              <TextSwap direction={moved.direction} reduced={reduced} text={filled ? status : ''} />
            </span>
          ) : null}
        </div>
      </div>
      <figcaption className="grid min-w-0 gap-[3px]">
        <strong className="text-sm font-medium">
          <TextSwap reduced={reduced} text={label} />
        </strong>
        {description ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            <TextSwap direction={moved.direction} reduced={reduced} text={description} />
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
