'use client';

import { cn } from 'cn';
import { animate, AnimatePresence, motion, motionValue, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { match, P } from 'ts-pattern';
import { TextSwap } from '@/components/ui/text-swap';
import { UsageMeterBadge } from '@/components/ui/usage-meter-badge';
import { UsageMeterTicker } from '@/components/ui/usage-meter-ticker';
import { CHART } from '@/constants/chart.constants';
import { MOTION } from '@/constants/motion.constants';
import { chartColor, chartDecimals, chartFixedFormatter, chartSoon, chartSpring } from '@/utils/chart.utils';
import TriangleAlert from '~icons/lucide/triangle-alert';
import type { AnimationPlaybackControls, MotionValue } from 'motion/react';
import type { KeyboardEvent, PointerEvent } from 'react';

interface UsageMeterProps {
  title: string;
  used: number;
  total: number;
  parts: { label: string; value: number }[];
  unit?: string;
  caption?: string;
  className?: string;
}

interface UsageMeterSegmentProps {
  index: number;
  amounts: MotionValue<number>[];
  span: MotionValue<number>;
  width: MotionValue<number>;
  highlight: 'on' | 'off' | undefined;
}

const usageMeterSettle = chartSpring(MOTION.spring.smooth);
const usageMeterReveal = chartSpring(CHART.usageMeter.reveal);

function UsageMeterSegment({ index, amounts, span, width, highlight }: UsageMeterSegmentProps) {
  const x = useTransform(() => (amounts.slice(0, index).reduce((sum, amount) => sum + amount.get(), 0) / span.get()) * width.get());

  const scaleX = useTransform(() => {
    const full = width.get();
    const size = (amounts[index].get() / span.get()) * full;
    const rest = full - x.get() - size;

    return full > 0 ? Math.max(0, size - Math.min(CHART.usageMeter.gap, size, Math.max(0, rest))) / full : 0;
  });

  return (
    <motion.span
      className="absolute inset-0 transition-opacity duration-(--duration-fast) data-[highlight=off]:opacity-30 motion-reduce:transition-none"
      data-highlight={highlight}
      style={{ x, scaleX, originX: 0, background: chartColor(index) }}
    />
  );
}

export function UsageMeter({ title, used, total, parts, unit = '', caption, className }: UsageMeterProps) {
  const reduced = Boolean(useReducedMotion());
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLFieldSetElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.4 });
  const titleId = useId();
  const hatchId = `${titleId.replaceAll(/[^\w-]/g, '')}-hatch`;
  const ready = inView || reduced;

  const limit = total > 0 ? total : 1;
  const formatter = chartFixedFormatter(chartDecimals([used, total, ...parts.map((part) => part.value)]));
  const format = (value: number) => (unit ? `${formatter.format(value)} ${unit}` : formatter.format(value));
  const filled = parts.reduce((sum, part) => sum + part.value, 0);
  const free = Math.max(0, limit - used);
  const over = Math.max(0, used - limit);

  const status = match(used)
    .with(P.number.gt(limit), () => 'over' as const)
    .with(P.number.gte(limit * CHART.usageMeter.warnAt), () => 'near' as const)
    .otherwise(() => 'ok' as const);

  const [store] = useState(() => new Map<number, MotionValue<number>>());

  const amounts = parts.map((_, index) => {
    const amount = store.get(index) ?? motionValue(0);

    store.set(index, amount);

    return amount;
  });

  const shownLimit = useMotionValue(limit);
  const width = useMotionValue(0);
  const shownUsed = useTransform(() => amounts.reduce((sum, amount) => sum + amount.get(), 0));
  const span = useTransform(() => Math.max(shownLimit.get(), shownUsed.get(), 1e-6));
  const limitX = useTransform(() => Math.round((shownLimit.get() / span.get()) * width.get()));
  const overClip = useTransform(() => `inset(0 0 0 ${limitX.get() + CHART.usageMeter.gap}px)`);
  const markerOpacity = useMotionValue(0);

  useEffect(() => {
    let isOver = shownUsed.get() > shownLimit.get();
    let fading: AnimationPlaybackControls | undefined;

    markerOpacity.jump(isOver ? 1 : 0);

    const check = () => {
      const next = shownUsed.get() > shownLimit.get();

      if (next === isOver) {
        return;
      }

      isOver = next;
      fading?.stop();

      if (reduced) {
        markerOpacity.jump(next ? 1 : 0);
      } else {
        fading = animate(markerOpacity, next ? 1 : 0, CHART.usageMeter.marker);
      }
    };

    const stops = [shownUsed.on('change', check), shownLimit.on('change', check)];

    return () => {
      stops.forEach((stop) => stop());
      fading?.stop();
    };
  }, [markerOpacity, reduced, shownLimit, shownUsed]);

  useLayoutEffect(() => {
    const node = trackRef.current;

    if (!node) {
      return;
    }

    width.set(node.clientWidth);

    const observer = new ResizeObserver(() => width.set(node.clientWidth));

    observer.observe(node);

    return () => observer.disconnect();
  }, [width]);

  const values = parts.map((part) => part.value).join('|');
  const revealed = useRef(false);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const first = !revealed.current;

    revealed.current = true;

    const stops = values.split('|').map((text, index) => {
      const amount = store.get(index);
      const target = Number(text);

      if (!amount || amount.get() === target) {
        return null;
      }

      if (reduced) {
        amount.jump(target);

        return null;
      }

      return chartSoon(() => animate(amount, target, first ? { ...usageMeterReveal, delay: index * CHART.usageMeter.stagger } : usageMeterSettle));
    });

    return () => stops.forEach((stop) => stop?.());
  }, [values, ready, reduced, store]);

  useEffect(() => {
    if (shownLimit.get() === limit) {
      return;
    }

    if (reduced) {
      shownLimit.jump(limit);

      return;
    }

    return chartSoon(() => animate(shownLimit, limit, usageMeterSettle));
  }, [limit, reduced, shownLimit]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [roving, setRoving] = useState(0);

  const items = [
    ...parts.map((part, index) => ({ id: String(index), label: part.label, value: part.value, free: false })),
    { id: CHART.usageMeter.free, label: status === 'over' ? 'Over limit' : 'Free', value: status === 'over' ? over : free, free: true },
  ];

  const activeId = hoveredId ?? focusedId ?? pinnedId;
  const activeItem = items.find((item) => item.id === activeId);

  const highlightOf = (id: string) => match(activeId)
    .with(null, () => undefined)
    .with(id, () => 'on' as const)
    .otherwise(() => 'off' as const);

  const idAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();

    if (!rect?.width) {
      return null;
    }

    const at = ((clientX - rect.left) / rect.width) * Math.max(limit, filled);
    let end = 0;

    const part = at > limit ? -1 : parts.findIndex((item) => {
      end += item.value;

      return at <= end;
    });

    return part < 0 ? CHART.usageMeter.free : String(part);
  };

  const onTrackTap = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      return;
    }

    const id = idAt(event.clientX);

    setPinnedId((current) => (current === id ? null : id));
  };

  const onLegendKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      if (pinnedId || focusedId) {
        event.preventDefault();
        setPinnedId(null);
      }

      return;
    }

    const next = match(event.key)
      .with('ArrowRight', 'ArrowDown', () => roving + 1)
      .with('ArrowLeft', 'ArrowUp', () => roving - 1)
      .with('Home', () => 0)
      .with('End', () => items.length - 1)
      .otherwise(() => null);

    if (next === null) {
      return;
    }

    event.preventDefault();

    const index = (next + items.length) % items.length;

    setRoving(index);
    legendRef.current?.querySelectorAll<HTMLButtonElement>('button')[index]?.focus();
  };

  const headline = ready ? activeItem?.value ?? used : 0;
  const usedText = `of ${format(total)} used`;

  const captionText = match(activeItem)
    .with(undefined, () => usedText)
    .with({ free: true }, () => (status === 'over' ? 'over the limit' : 'free'))
    .otherwise((item) => `in ${item.label} · ${Math.round((item.value / limit) * 100)}% of total`);

  const badge = match(status)
    .with('over', () => `${format(over)} over`)
    .with('near', () => 'Almost full')
    .with('ok', () => `${format(free)} free`)
    .exhaustive();

  const summary = `${title}: ${format(used)} of ${format(total)} used. ${parts.map((part) => `${part.label}, ${format(part.value)}`).join(', ')}.`;
  const notice = status === 'over' ? `over:${over}` : status;
  const [announced, setAnnounced] = useState({ notice, message: '' });

  if (announced.notice !== notice) {
    setAnnounced({
      notice,
      message: match(status)
        .with('over', () => `Over the limit by ${format(over)}.`)
        .with('near', () => `Almost full. ${format(free)} free.`)
        .with('ok', () => `Under the limit. ${format(free)} free.`)
        .exhaustive(),
    });
  }

  return (
    <section aria-labelledby={titleId} className={cn('grid min-w-0 gap-4 text-foreground', className)} ref={rootRef}>
      <div className="flex min-h-7 min-w-0 items-center justify-between gap-3">
        <span className="min-w-0 text-sm font-medium text-balance" id={titleId}>{title}</span>
        <UsageMeterBadge reduced={reduced} status={status} text={badge} />
      </div>

      <p className="m-0 flex min-w-0 items-baseline gap-2">
        <span className="sr-only">{usedText}</span>
        <span aria-hidden="true" className="flex-none text-[1.75rem] leading-[1.1] font-medium tracking-[-0.03em]">
          <UsageMeterTicker formatter={formatter} reduced={reduced} value={headline} />
        </span>
        <span aria-hidden="true" className="min-w-0 flex-1 text-[13px] text-muted-foreground">
          <TextSwap className="block truncate" reduced={reduced} text={unit ? `${unit} ${captionText}` : captionText} />
        </span>
      </p>

      <div className="relative py-[5px]">
        <p className="sr-only">{summary}</p>
        <div
          aria-hidden="true"
          className="relative isolate h-3 overflow-hidden rounded-full"
          ref={trackRef}
          style={{ background: CHART.usageMeter.empty }}
          onPointerLeave={() => setHoveredId(null)}
          onPointerMove={(event) => event.pointerType === 'mouse' && setHoveredId(idAt(event.clientX))}
          onPointerUp={onTrackTap}
        >
          {parts.map((part, index) => (
            <UsageMeterSegment amounts={amounts} highlight={highlightOf(String(index))} index={index} key={`${index}-${part.label}`} span={span} width={width} />
          ))}
          <motion.svg
            aria-hidden="true"
            className="group/over pointer-events-none absolute inset-0 size-full"
            data-highlight={highlightOf(CHART.usageMeter.free)}
            focusable="false"
            style={{ clipPath: overClip, opacity: markerOpacity }}
          >
            <defs>
              <pattern height={6} id={hatchId} patternTransform="rotate(45)" patternUnits="userSpaceOnUse" width={6}>
                <rect className="fill-(--surface)" height={6} width={2.5} />
              </pattern>
            </defs>
            <rect className="fill-destructive opacity-0 transition-opacity duration-(--duration-fast) group-data-[highlight=on]/over:opacity-100 motion-reduce:transition-none" height="100%" width="100%" />
            <rect fill={`url(#${hatchId})`} height="100%" width="100%" />
          </motion.svg>
        </div>
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-px w-0.5 rounded-[1px] bg-foreground" style={{ x: limitX, opacity: markerOpacity }} />
      </div>

      <fieldset aria-label={`${title} by part`} className="m-0 -mx-2 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(108px,1fr))] gap-0.5 border-0 p-0" ref={legendRef}>
        {items.map((item, index) => {
          const warning = item.free && status === 'over';

          return (
            <button
              aria-label={`${item.label}, ${format(item.value)}`}
              aria-pressed={pinnedId === item.id}
              className="grid min-w-0 cursor-pointer justify-items-start gap-0.5 rounded-(--radius-control) p-2 text-left transition-[background-color,opacity] duration-(--duration-fast) outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-muted data-[highlight=off]:opacity-45 motion-reduce:transition-none"
              data-highlight={highlightOf(item.id)}
              key={item.id}
              tabIndex={index === roving ? 0 : -1}
              type="button"
              onBlur={() => setFocusedId(null)}
              onClick={() => {
                setRoving(index);
                setPinnedId((current) => (current === item.id ? null : item.id));
              }}
              onFocus={() => {
                setRoving(index);
                setFocusedId(item.id);
              }}
              onKeyDown={onLegendKey}
              onPointerEnter={(event) => event.pointerType === 'mouse' && setHoveredId(item.id)}
              onPointerLeave={(event) => event.pointerType === 'mouse' && setHoveredId(null)}
            >
              <span className="flex max-w-full min-w-0 items-center gap-2 text-xs text-muted-foreground">
                <span aria-hidden="true" className="grid size-3 flex-none place-items-center">
                  <AnimatePresence initial={false} mode="popLayout">
                    {warning ? (
                      <motion.span animate="shown" className="grid place-items-center text-destructive [grid-area:1/1]" exit="gone" initial="hidden" key="alert" variants={reduced ? CHART.usageMeter.fade : CHART.usageMeter.pop}>
                        <TriangleAlert className="size-3" />
                      </motion.span>
                    ) : (
                      <motion.span
                        animate="shown"
                        className={cn('size-2.5 rounded-[3px] [grid-area:1/1]', item.free && 'shadow-[inset_0_0_0_1px_var(--border)]')}
                        exit="gone"
                        initial="hidden"
                        key="swatch"
                        style={{ background: item.free ? CHART.usageMeter.empty : chartColor(index) }}
                        variants={reduced ? CHART.usageMeter.fade : CHART.usageMeter.pop}
                      />
                    )}
                  </AnimatePresence>
                </span>
                <span className="min-w-0 flex-1">
                  <TextSwap className="block truncate" reduced={reduced} text={item.label} />
                </span>
              </span>
              <span className="flex items-baseline gap-1 pl-5 text-sm font-medium text-foreground">
                <UsageMeterTicker formatter={formatter} reduced={reduced} value={item.value} />
                {unit ? <span className="text-xs font-normal text-muted-foreground">{unit}</span> : null}
              </span>
            </button>
          );
        })}
      </fieldset>

      {caption ? <p className="m-0 text-xs text-muted-foreground">{caption}</p> : null}
      <p aria-atomic="true" aria-live="polite" className="sr-only">{announced.message}</p>
    </section>
  );
}
