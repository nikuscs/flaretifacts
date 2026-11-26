'use client';

import { cn } from 'cn';
import { animate, AnimatePresence, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CHART } from '@/constants/chart.constants';
import { MOTION } from '@/constants/motion.constants';
import { chartAmount, chartColor, chartMorph } from '@/utils/chart.utils';
import { sparklineChunks, sparklineCurve, sparklineFormat, sparklineGeometry, sparklineIsNumeric, sparklineTipAt } from '@/utils/sparkline.utils';
import type { KeyboardEvent, PointerEvent } from 'react';

interface SparklineProps {
  data: number[];
  label?: string;
  value?: string;
  change?: string;
  className?: string;
}

interface SparklineRollProps {
  text: string;
  reduced: boolean;
  direction?: number;
  whole?: boolean;
  morph?: boolean;
  tone?: string;
}

function SparklineRoll({ text, reduced, direction, whole = false, morph = false, tone }: SparklineRollProps) {
  const sizerRef = useRef<HTMLSpanElement>(null);
  const width = useMotionValue<number | 'auto'>('auto');
  const [shown, setShown] = useState({ text, direction: 1 });

  if (shown.text !== text) {
    setShown({ text, direction: direction ?? (chartAmount(text) < chartAmount(shown.text) ? -1 : 1) });
  }

  useEffect(() => {
    const node = sizerRef.current;

    if (!node) {
      return;
    }

    let measured: string | null = null;

    const observer = new ResizeObserver(([entry]) => {
      const next = entry.borderBoxSize[0]?.inlineSize ?? node.offsetWidth;

      if (measured !== null && measured !== node.textContent && !reduced) {
        animate(width, next, MOTION.spring.morph);
      } else {
        width.jump(next);
      }

      measured = node.textContent;
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [morph, reduced, width]);

  const numeric = !whole && sparklineIsNumeric(text);
  const variants = reduced ? CHART.textSwap.fade : CHART.textSwap.rise;
  const anchor = numeric ? 'right' : 'left';
  const piece = cn('relative inline-block whitespace-pre', whole && 'max-w-full overflow-hidden align-top text-ellipsis');

  return (
    <motion.span
      className={cn('relative inline-flex max-w-full overflow-x-clip align-top whitespace-pre', numeric && 'justify-end')}
      style={morph ? { width } : undefined}
    >
      {morph ? (
        <span aria-hidden="true" className="pointer-events-none invisible absolute top-0 left-0 whitespace-pre" ref={sizerRef}>
          {text}
        </span>
      ) : null}
      <span className={piece}>
        <AnimatePresence anchorX={anchor} custom={shown.direction} initial={false} mode="popLayout">
          {sparklineChunks(text, whole).map((chunk) => (
            <motion.span animate="shown" className={piece} custom={shown.direction} exit="gone" initial="hidden" key={chunk.slot} variants={variants}>
              <AnimatePresence anchorX={anchor} custom={shown.direction} initial={false} mode="popLayout">
                <motion.span
                  animate="shown"
                  className={cn(piece, tone)}
                  custom={shown.direction}
                  exit="gone"
                  initial="hidden"
                  key={`${tone ?? ''}${chunk.key}`}
                  variants={variants}
                >
                  {chunk.text}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </motion.span>
  );
}

export function Sparkline({ data, label, value, change, className }: SparklineProps) {
  const points = data.length > 1 ? data : [data[0] ?? 0, data[0] ?? 0];
  const last = points.length - 1;
  const key = points.join(',');
  const target = useMemo(() => sparklineCurve(key.split(',').map(Number)), [key]);
  const uid = `sparkline${useId().replaceAll(/[^\w-]/g, '')}`;
  const rootRef = useRef<HTMLElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: CHART.sparkline.inView });
  const reduced = Boolean(useReducedMotion());
  const [box, setBox] = useState<{ w: number; h: number }>({ w: CHART.sparkline.width, h: CHART.sparkline.height });
  const [active, setActive] = useState<number | null>(null);
  const [landed, setLanded] = useState(false);
  const index = active === null ? null : Math.min(active, last);
  const [moved, setMoved] = useState({ index, direction: 1 });

  if (moved.index !== index) {
    setMoved({ index, direction: index === null || moved.index === null ? 1 : Math.sign(index - moved.index) || 1 });
  }

  const [first] = useState(() => sparklineGeometry(target, CHART.sparkline.width, CHART.sparkline.height, 1));
  const curveRef = useRef(target);
  const sizeRef = useRef(box);
  const drawn = useMotionValue(0);
  const cursor = useMotionValue(1);
  const line = useMotionValue(first.line);
  const trail = useMotionValue(first.trail);
  const fill = useMotionValue(first.fill);
  const dot = useMotionValue(first.dot);
  const cursorX = useMotionValue(first.cx);
  const lit = useMotionValue(first.cx + CHART.sparkline.cap + CHART.sparkline.lead);
  const dim = useMotionValue(first.cx + CHART.sparkline.cap);
  const reveal = useMotionValue(0);
  const lineOpacity = useTransform(drawn, (progress) => (progress > 0.001 ? 1 : 0));

  const paint = useCallback(() => {
    const { w, h } = sizeRef.current;
    const progress = drawn.get();
    const next = sparklineGeometry(curveRef.current, w, h, cursor.get());

    line.set(next.line);
    trail.set(next.trail);
    fill.set(next.fill);
    dot.set(next.dot);
    cursorX.set(next.cx);
    lit.set(next.cx + CHART.sparkline.cap + CHART.sparkline.lead);
    dim.set(next.cx + CHART.sparkline.cap);
    reveal.set(progress >= 1 ? w + CHART.sparkline.lead * 2 : sparklineTipAt(next.points, progress) + CHART.sparkline.lead);
  }, [cursor, cursorX, dim, dot, drawn, fill, line, lit, reveal, trail]);

  useMotionValueEvent(cursor, 'change', paint);
  useMotionValueEvent(drawn, 'change', paint);

  useLayoutEffect(() => {
    const node = plotRef.current;

    if (!node) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const w = node.clientWidth;

      if (w) {
        setBox((current) => (Math.abs(current.w - w) < 0.5 ? current : { w, h: (w * CHART.sparkline.height) / CHART.sparkline.width }));
      }
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    sizeRef.current = box;
    paint();
  }, [box, paint]);

  useEffect(() => {
    if (reduced) {
      drawn.jump(1);

      const handle = requestAnimationFrame(() => setLanded(true));

      return () => cancelAnimationFrame(handle);
    }

    if (!inView) {
      return;
    }

    const controls = animate(drawn, 1, { ...CHART.sparkline.draw, onComplete: () => setLanded(true) });

    return () => controls.stop();
  }, [drawn, inView, reduced]);

  useEffect(() => {
    if (curveRef.current === target) {
      return;
    }

    if (reduced) {
      curveRef.current = target;
      paint();

      return;
    }

    const curveAt = chartMorph(curveRef.current, target, CHART.sparkline.grid);

    const controls = animate(0, 1, {
      ...MOTION.spring.smooth,
      onUpdate: (progress) => {
        curveRef.current = curveAt(progress);
        paint();
      },
      onComplete: () => {
        curveRef.current = target;
        paint();
      },
    });

    return () => controls.stop();
  }, [paint, reduced, target]);

  useEffect(() => {
    const to = index === null ? 1 : index / last;

    if (reduced) {
      cursor.jump(to);

      return;
    }

    const controls = animate(cursor, to, MOTION.spring.snappy);

    return () => controls.stop();
  }, [cursor, index, last, reduced]);

  const scrubbing = index !== null;
  const at = index ?? last;
  const point = sparklineFormat(points[at]);
  const headline = value === undefined || !scrubbing ? value : point;
  const scrubbed = value === undefined ? point : `${at + 1} of ${last + 1}`;
  const aside = scrubbing ? scrubbed : change ?? '';
  const readout = scrubbing ? `Point ${at + 1} of ${last + 1}` : 'Latest';
  const dotWidth = scrubbing ? CHART.sparkline.dot.active : CHART.sparkline.dot.rest;
  const description = [label, value ?? sparklineFormat(points[last]), change].filter(Boolean).join(', ');
  const quick = reduced ? { duration: 0 } : CHART.sparkline.quick;

  const pointAt = (clientX: number) => {
    const rect = plotRef.current?.getBoundingClientRect();

    return rect?.width ? Math.max(0, Math.min(last, Math.round(((clientX - rect.left) / rect.width) * last))) : last;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape' || !scrubbing) {
      return;
    }

    event.preventDefault();
    setActive(null);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || event.buttons) {
      setActive(pointAt(event.clientX));
    }
  };

  return (
    <figure aria-label={description} className={cn('m-0 grid min-w-0 gap-3', className)} ref={rootRef} style={{ color: chartColor(0) }}>
      <figcaption className="flex min-h-5 min-w-0 items-baseline gap-2 text-[13px] text-muted-foreground">
        {label ? (
          <span className="min-w-0 overflow-hidden whitespace-nowrap">
            <SparklineRoll whole reduced={reduced} text={label} />
          </span>
        ) : null}
        {headline === undefined ? null : (
          <strong className="ml-auto text-lg font-medium tracking-[-0.02em] text-foreground tabular-nums">
            <SparklineRoll morph reduced={reduced} text={headline} />
          </strong>
        )}
        <small className="flex-none text-xs font-medium text-foreground tabular-nums">
          <SparklineRoll
            morph
            direction={scrubbing ? moved.direction : undefined}
            reduced={reduced}
            text={aside}
            tone={scrubbing ? 'text-muted-foreground' : undefined}
          />
        </small>
      </figcaption>
      <div
        className="relative min-w-0 cursor-default touch-pan-y rounded-md select-none has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
        ref={plotRef}
        onPointerCancel={() => setActive(null)}
        onPointerDown={(event) => setActive(pointAt(event.clientX))}
        onPointerLeave={() => setActive(null)}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => event.pointerType !== 'mouse' && setActive(null)}
      >
        <input
          aria-label={label ? `${label}, explore values` : 'Explore values'}
          aria-valuetext={`${readout}: ${point}`}
          className="sr-only"
          max={last}
          min={0}
          step={1}
          type="range"
          value={at}
          onBlur={() => setActive(null)}
          onChange={(event) => setActive(Number(event.currentTarget.value))}
          onKeyDown={onKeyDown}
        />
        <svg aria-hidden="true" className="block h-auto w-full overflow-visible" focusable="false" viewBox={`0 0 ${box.w} ${box.h}`}>
          <defs>
            <clipPath clipPathUnits="userSpaceOnUse" id={`${uid}-lit`}>
              <motion.rect height={box.h + 32} width={lit} x={-16} y={-16} />
            </clipPath>
            <clipPath clipPathUnits="userSpaceOnUse" id={`${uid}-dim`}>
              <motion.rect height={box.h + 32} width={box.w + 32} x={dim} y={-16} />
            </clipPath>
            <clipPath clipPathUnits="userSpaceOnUse" id={`${uid}-fill`}>
              <motion.rect height={box.h + 32} width={reveal} x={-16} y={-16} />
            </clipPath>
          </defs>
          <motion.path className="fill-[color-mix(in_oklab,currentColor_10%,transparent)] stroke-none" clipPath={`url(#${uid}-fill)`} d={fill} />
          <line className="stroke-border" strokeWidth={1} x1="0" x2={box.w} y1={box.h - 0.5} y2={box.h - 0.5} />
          <motion.path
            animate={{ opacity: scrubbing && landed ? 1 : 0 }}
            className="fill-none stroke-muted-foreground/40"
            clipPath={`url(#${uid}-dim)`}
            d={trail}
            initial={false}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            transition={quick}
          />
          <motion.polyline
            className="fill-none stroke-current"
            clipPath={`url(#${uid}-lit)`}
            points={line}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            style={{ pathLength: drawn, opacity: lineOpacity }}
          />
          <motion.line
            animate={{ opacity: scrubbing ? 1 : 0 }}
            className="stroke-(--border-strong)"
            initial={false}
            strokeWidth={1}
            transition={quick}
            x1={cursorX}
            x2={cursorX}
            y1={0}
            y2={box.h}
          />
          <motion.polyline
            animate={{ opacity: landed ? 1 : 0, strokeWidth: landed ? dotWidth : 0 }}
            className="fill-none stroke-current"
            initial={false}
            points={dot}
            strokeLinecap="round"
            transition={reduced ? { duration: 0 } : { opacity: CHART.sparkline.quick, strokeWidth: MOTION.spring.snappy }}
          />
        </svg>
      </div>
    </figure>
  );
}
