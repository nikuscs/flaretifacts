'use client';

import { cn } from 'cn';
import { animate, AnimatePresence, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { CHART } from '@/constants/chart.constants';
import { MOTION } from '@/constants/motion.constants';
import { chartClamp, chartColor, chartMorph, chartSpring, chartValueAt } from '@/utils/chart.utils';
import { lineChartAxisPicks, lineChartCurves, lineChartModel, lineChartNiceScale, lineChartRange } from '@/utils/line-chart.utils';
import type { MotionValue } from 'motion/react';
import type { CSSProperties, PointerEvent } from 'react';

interface LineChartProps {
  data: Record<string, string | number | null>[];
  x: string;
  series: { key: string; label: string }[];
  label: string;
  area?: boolean;
  className?: string;
}

interface LineChartTrack {
  points: [number, number][];
  presence: number;
  fade: { stop: () => void } | null;
}

interface LineChartScale {
  min: MotionValue<number>;
  max: MotionValue<number>;
}

const { height: lineChartHeight, top: lineChartTop, gap: lineChartGap } = CHART.line;
const lineChartSettle = chartSpring(MOTION.spring.smooth);
const lineChartGlide = chartSpring(MOTION.spring.snappy, 0.0001);
const lineChartFollow = { stiffness: lineChartGlide.stiffness, damping: lineChartGlide.damping, restDelta: 0.01 };
const lineChartDraw = { duration: MOTION.duration.considered * 1.75, ease: MOTION.ease.inOut };
const lineChartFade = { duration: MOTION.duration.standard, ease: MOTION.ease.standard };
const lineChartFadeFast = { duration: MOTION.duration.instant, ease: MOTION.ease.standard };

function lineChartSeriesStyle(index: number): CSSProperties & Record<'--series', string> {
  return { '--series': chartColor(index) };
}

function lineChartPatch(tracks: Map<string, LineChartTrack>, key: string, next: Partial<LineChartTrack>) {
  const track = tracks.get(key);

  if (track) {
    tracks.set(key, { ...track, ...next });
  }
}

function useLineChartRowY(value: number, scale: LineChartScale) {
  return useTransform(() => {
    const span = scale.max.get() - scale.min.get() || 1;

    return Math.round(lineChartTop + (1 - (value - scale.min.get()) / span) * (lineChartHeight - lineChartTop)) + 0.5;
  });
}

function LineChartGridline({ value, scale }: { value: number; scale: LineChartScale }) {
  const y = useLineChartRowY(value, scale);

  return (
    <motion.line
      animate={{ opacity: 1 }}
      className="stroke-border [shape-rendering:crispEdges]"
      exit={{ opacity: 0, transition: lineChartFadeFast }}
      initial={{ opacity: 0 }}
      transition={lineChartFade}
      x1={0}
      x2="100%"
      y1={y}
      y2={y}
    />
  );
}

function LineChartTick({ value, label, scale }: { value: number; label: string; scale: LineChartScale }) {
  const y = useLineChartRowY(value, scale);

  return (
    <motion.span
      animate={{ opacity: 1 }}
      className="pointer-events-none absolute top-0 left-2.5 block h-0 whitespace-nowrap"
      exit={{ opacity: 0, transition: lineChartFadeFast }}
      initial={{ opacity: 0 }}
      style={{ y }}
      transition={lineChartFade}
    >
      <span className="block -translate-y-1/2 text-xs leading-none text-muted-foreground tabular-nums">{label}</span>
    </motion.span>
  );
}

export function LineChart({ data, x, series, label, area = false, className }: LineChartProps) {
  const reduced = Boolean(useReducedMotion());
  const figureRef = useRef<HTMLElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<SVGRectElement>(null);
  const crosshairRef = useRef<SVGLineElement>(null);
  const linesRef = useRef(new Map<string, SVGPathElement>());
  const areasRef = useRef(new Map<string, SVGPathElement>());
  const dotsRef = useRef(new Map<string, SVGCircleElement>());
  const groupsRef = useRef(new Map<string, SVGGElement>());
  const inView = useInView(figureRef, { once: true, amount: 0.3 });
  const uid = `line${useId().replaceAll(/[^\w-]/g, '')}`;

  const model = lineChartModel(data, x, series.map((line) => line.key));
  const valueFormat = new Intl.NumberFormat(CHART.locale, { maximumFractionDigits: 2 });
  const tickFormat = new Intl.NumberFormat(CHART.locale, { notation: 'compact', maximumFractionDigits: 2 });
  const last = data.length - 1;
  const empty = data.length === 0;

  const [hidden, setHidden] = useState<string[]>([]);
  const visible = series.filter((line) => !hidden.includes(line.key));
  const allHidden = !empty && visible.length === 0;

  const [targets, setTargets] = useState(() => ({ signature: model.signature, curves: lineChartCurves(model.values) }));
  const [active, setActive] = useState<number | null>(null);

  if (targets.signature !== model.signature) {
    setTargets({ signature: model.signature, curves: lineChartCurves(model.values) });
    setActive(null);
  }

  const range = lineChartRange(model.values, visible.map((line) => line.key));
  const [steady, setSteady] = useState(() => range ?? lineChartNiceScale(0, 100));

  if (range && range.ticks.join() !== steady.ticks.join()) {
    setSteady(range);
  }

  const scaleMin = useMotionValue(steady.min);
  const scaleMax = useMotionValue(steady.max);
  const scale = { min: scaleMin, max: scaleMax };
  const index = active === null || empty ? null : Math.min(active, last);
  const scrubbing = index !== null;

  const widthRef = useRef(0);
  const [plotWidth, setPlotWidth] = useState(0);
  const tipSizeRef = useRef({ w: 0, h: 0 });
  const tracksRef = useRef(new Map<string, LineChartTrack>());
  const drawn = useMotionValue(0);
  const cursor = useMotionValue(1);
  const tipTargetX = useMotionValue(0);
  const tipTargetY = useMotionValue(0);
  const tipSpringX = useSpring(tipTargetX, lineChartFollow);
  const tipSpringY = useSpring(tipTargetY, lineChartFollow);
  const liveRef = useRef({ series, hidden });

  useLayoutEffect(() => {
    liveRef.current = { series, hidden };
  });

  const paint = useCallback(() => {
    const width = widthRef.current;

    if (!width) {
      return;
    }

    const low = scaleMin.get();
    const span = scaleMax.get() - low || 1;
    const toY = (point: number) => lineChartTop + (1 - (point - low) / span) * (lineChartHeight - lineChartTop);
    const at = cursor.get();
    const dotYs: number[] = [];

    for (const line of liveRef.current.series) {
      const track = tracksRef.current.get(line.key);

      if (!track) {
        continue;
      }

      const presence = track.presence;
      const y = (point: number) => toY(low + (point - low) * presence);
      const path = track.points.length > 0 ? `M${track.points.map(([px, point]) => `${(px * width).toFixed(1)},${y(point).toFixed(1)}`).join('L')}` : '';

      linesRef.current.get(line.key)?.setAttribute('d', path);
      areasRef.current.get(line.key)?.setAttribute('d', path ? `${path}L${width},${lineChartHeight}L0,${lineChartHeight}Z` : '');

      const group = groupsRef.current.get(line.key);

      if (group) {
        group.style.opacity = String(presence);
      }

      const dot = dotsRef.current.get(line.key);

      if (dot && track.points.length > 0) {
        const cy = y(chartValueAt(track.points, at));

        dot.setAttribute('cx', (at * width).toFixed(1));
        dot.setAttribute('cy', cy.toFixed(1));

        if (presence > 0.5) {
          dotYs.push(cy);
        }
      }
    }

    clipRef.current?.setAttribute('width', String(drawn.get() * (width + 16)));

    const cx = Math.round(at * width) + 0.5;

    crosshairRef.current?.setAttribute('x1', String(cx));
    crosshairRef.current?.setAttribute('x2', String(cx));

    const { w: tipWidth, h: tipHeight } = tipSizeRef.current;
    const right = cx + lineChartGap;
    const left = right + tipWidth > width ? cx - lineChartGap - tipWidth : right;
    const middle = dotYs.length > 0 ? dotYs.reduce((sum, point) => sum + point, 0) / dotYs.length : lineChartHeight / 2;

    tipTargetX.set(chartClamp(left, 0, Math.max(0, width - tipWidth)));
    tipTargetY.set(chartClamp(middle - tipHeight / 2, 0, Math.max(0, lineChartHeight - tipHeight)));
  }, [cursor, drawn, scaleMax, scaleMin, tipTargetX, tipTargetY]);

  useMotionValueEvent(cursor, 'change', paint);
  useMotionValueEvent(drawn, 'change', paint);
  useMotionValueEvent(scaleMin, 'change', paint);
  useMotionValueEvent(scaleMax, 'change', paint);
  useLayoutEffect(paint);

  useLayoutEffect(() => {
    const node = plotRef.current;
    const bubble = tipRef.current;

    if (!node) {
      return;
    }

    const read = () => {
      widthRef.current = node.clientWidth;
      setPlotWidth(node.clientWidth);

      if (bubble) {
        tipSizeRef.current = { w: bubble.offsetWidth, h: bubble.offsetHeight };
      }

      paint();
    };

    read();

    const observer = new ResizeObserver(read);

    observer.observe(node);

    if (bubble) {
      observer.observe(bubble);
    }

    return () => observer.disconnect();
  }, [paint]);

  useEffect(() => {
    const moves: { key: string; target: [number, number][]; at: (progress: number) => [number, number][] }[] = [];

    for (const [key, target] of targets.curves) {
      const track = tracksRef.current.get(key);

      if (!track) {
        tracksRef.current.set(key, {
          points: target,
          presence: liveRef.current.hidden.includes(key) ? 0 : 1,
          fade: null,
        });
        continue;
      }

      if (track.points.length === 0 || target.length === 0 || reduced) {
        lineChartPatch(tracksRef.current, key, { points: target });
        continue;
      }

      moves.push({
        key,
        target,
        at: chartMorph(track.points, target, CHART.line.morphSteps),
      });
    }

    if (moves.length === 0) {
      paint();

      return;
    }

    const controls = animate(0, 1, {
      ...lineChartSettle,
      restDelta: 0.0005,
      onUpdate: (progress) => {
        for (const move of moves) {
          lineChartPatch(tracksRef.current, move.key, { points: move.at(progress) });
        }

        paint();
      },
      onComplete: () => {
        for (const move of moves) {
          lineChartPatch(tracksRef.current, move.key, { points: move.target });
        }

        paint();
      },
    });

    return () => controls.stop();
  }, [reduced, paint, targets]);

  useEffect(() => {
    for (const [key, track] of tracksRef.current) {
      const to = hidden.includes(key) ? 0 : 1;

      if (track.presence === to) {
        continue;
      }

      track.fade?.stop();

      if (reduced) {
        lineChartPatch(tracksRef.current, key, { presence: to });
        continue;
      }

      lineChartPatch(tracksRef.current, key, {
        fade: animate(track.presence, to, {
          ...lineChartSettle,
          onUpdate: (presence) => {
            lineChartPatch(tracksRef.current, key, { presence });
            paint();
          },
        }),
      });
    }

    paint();
  }, [hidden, reduced, paint]);

  useEffect(() => {
    if (reduced) {
      scaleMin.jump(steady.min);
      scaleMax.jump(steady.max);

      return;
    }

    const controls = [animate(scaleMin, steady.min, lineChartSettle), animate(scaleMax, steady.max, lineChartSettle)];

    return () => {
      for (const control of controls) {
        control.stop();
      }
    };
  }, [reduced, scaleMax, scaleMin, steady]);

  useEffect(() => {
    if (empty) {
      return;
    }

    if (reduced) {
      drawn.jump(1);

      return;
    }

    if (!inView || drawn.get() >= 1) {
      return;
    }

    const controls = animate(drawn, 1, lineChartDraw);

    return () => controls.stop();
  }, [drawn, empty, inView, reduced]);

  const wasScrubbingRef = useRef(false);

  useEffect(() => {
    if (index === null) {
      wasScrubbingRef.current = false;

      return;
    }

    const to = last > 0 ? index / last : 0.5;

    if (reduced || !wasScrubbingRef.current) {
      cursor.jump(to);
      tipSpringX.jump(tipTargetX.get());
      tipSpringY.jump(tipTargetY.get());
    }

    wasScrubbingRef.current = true;

    if (reduced) {
      return;
    }

    const controls = animate(cursor, to, lineChartGlide);

    return () => controls.stop();
  }, [cursor, index, reduced, last, tipSpringX, tipSpringY, tipTargetX, tipTargetY]);

  const pointAt = (clientX: number) => {
    const rect = plotRef.current?.getBoundingClientRect();

    if (!rect?.width || last < 1) {
      return Math.max(0, last);
    }

    return chartClamp(Math.round(((clientX - rect.left) / rect.width) * last), 0, last);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (empty) {
      return;
    }

    if (event.pointerType !== 'mouse') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setActive(pointAt(event.clientX));
  };

  const reading = index ?? last;

  const valueOf = (key: string, row: number) => {
    const cell = model.cells[key][row];

    return cell === null ? '' : valueFormat.format(cell);
  };

  const valueText = empty ? 'No data to show' : `${model.labels[reading]}: ${visible.map((line) => `${line.label} ${valueOf(line.key, reading)}`).join(', ')}`;
  const picks = lineChartAxisPicks(data.length, plotWidth);

  return (
    <figure aria-label={label} className={cn('m-0 grid min-w-0 gap-4 text-foreground', className)} ref={figureRef}>
      {series.length > 1 ? (
        <fieldset aria-label="Series" className="-mx-2 flex min-w-0 flex-wrap gap-x-1 gap-y-0.5">
          {series.map((line, at) => (
            <button
              aria-pressed={!hidden.includes(line.key)}
              className="group/toggle inline-flex min-h-7 cursor-pointer items-center gap-2 rounded-full pr-2.5 pl-2 text-xs text-muted-foreground transition-[color,background-color,scale] duration-(--duration-fast) ease-(--ease-standard) select-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none active:scale-97 aria-[pressed=false]:text-muted-foreground/80 motion-reduce:transition-none"
              key={line.key}
              style={lineChartSeriesStyle(at)}
              type="button"
              onClick={() => setHidden((current) => (current.includes(line.key) ? current.filter((item) => item !== line.key) : [...current, line.key]))}
            >
              <span aria-hidden="true" className="size-2 flex-none rounded-[2px] bg-(--series) transition-[scale,opacity] duration-(--duration-standard) ease-(--ease-standard) group-aria-[pressed=false]/toggle:scale-75 group-aria-[pressed=false]/toggle:opacity-40 motion-reduce:transition-none" />
              <span className="whitespace-nowrap transition-opacity duration-(--duration-fast) group-aria-[pressed=false]/toggle:line-through group-aria-[pressed=false]/toggle:decoration-current/55 group-aria-[pressed=false]/toggle:opacity-70 motion-reduce:transition-none">
                {line.label}
              </span>
            </button>
          ))}
        </fieldset>
      ) : null}
      <div className="relative grid min-w-0 grid-cols-[minmax(0,1fr)_56px] grid-rows-[auto_24px]">
        <div
          className="relative col-start-1 row-start-1 min-w-0 touch-pan-y select-none"
          ref={plotRef}
          style={{ height: lineChartHeight }}
          onPointerCancel={() => setActive(null)}
          onPointerDown={onPointerDown}
          onPointerLeave={(event) => event.pointerType === 'mouse' && setActive(null)}
          onPointerMove={(event) => !empty && (event.pointerType === 'mouse' || event.buttons) && setActive(pointAt(event.clientX))}
          onPointerUp={(event) => event.pointerType !== 'mouse' && setActive(null)}
        >
          <input
            aria-label={label}
            aria-valuetext={valueText}
            className="sr-only"
            disabled={empty}
            max={Math.max(0, last)}
            min={0}
            step={1}
            type="range"
            value={Math.max(0, reading)}
            onBlur={() => setActive(null)}
            onChange={(event) => setActive(Number(event.currentTarget.value))}
            onFocus={(event) => event.currentTarget.matches(':focus-visible') && setActive((current) => current ?? last)}
            onKeyDown={(event) => {
              if (event.key !== 'Escape' || !scrubbing) {
                return;
              }

              event.preventDefault();
              setActive(null);
            }}
          />
          <svg aria-hidden="true" className="block overflow-visible" focusable="false" height={lineChartHeight} width="100%">
            <defs>
              <clipPath clipPathUnits="userSpaceOnUse" id={`${uid}-draw`}>
                <rect height={lineChartHeight + 32} ref={clipRef} width={0} x={-8} y={-16} />
              </clipPath>
            </defs>
            <AnimatePresence initial={false}>
              {steady.ticks.slice(1).map((tick) => <LineChartGridline key={tick} scale={scale} value={tick} />)}
            </AnimatePresence>
            <line className="stroke-(--border-strong) [shape-rendering:crispEdges]" x1={0} x2="100%" y1={lineChartHeight - 0.5} y2={lineChartHeight - 0.5} />
            <line
              className={cn('stroke-(--border-strong) opacity-0 transition-opacity duration-(--duration-instant) [shape-rendering:crispEdges] motion-reduce:transition-none', scrubbing && 'opacity-100')}
              ref={crosshairRef}
              y1={lineChartTop - 4}
              y2={lineChartHeight}
            />
            <g clipPath={`url(#${uid}-draw)`}>
              {series.map((line, at) => (
                <g
                  key={line.key}
                  ref={(node) => {
                    if (node) {
                      groupsRef.current.set(line.key, node);
                    } else {
                      groupsRef.current.delete(line.key);
                    }
                  }}
                  style={lineChartSeriesStyle(at)}
                >
                  {area || at === 0 ? (
                    <path
                      className={cn('stroke-none', area ? 'fill-[color-mix(in_oklab,var(--series)_14%,transparent)]' : 'fill-[color-mix(in_oklab,var(--series)_8%,transparent)]')}
                      ref={(node) => {
                        if (node) {
                          areasRef.current.set(line.key, node);
                        } else {
                          areasRef.current.delete(line.key);
                        }
                      }}
                    />
                  ) : null}
                  <path
                    className="fill-none stroke-(--series) [stroke-linecap:round] [stroke-linejoin:round]"
                    ref={(node) => {
                      if (node) {
                        linesRef.current.set(line.key, node);
                      } else {
                        linesRef.current.delete(line.key);
                      }
                    }}
                    strokeWidth={2}
                  />
                </g>
              ))}
            </g>
            {series.map((line, at) => (
              <circle
                className={cn('fill-(--series) stroke-(--surface) opacity-0 transition-opacity duration-(--duration-instant) motion-reduce:transition-none', scrubbing && !hidden.includes(line.key) && 'opacity-100')}
                key={line.key}
                r={CHART.line.dotRadius}
                ref={(node) => {
                  if (node) {
                    dotsRef.current.set(line.key, node);
                  } else {
                    dotsRef.current.delete(line.key);
                  }
                }}
                strokeWidth={2}
                style={lineChartSeriesStyle(at)}
              />
            ))}
          </svg>
          <motion.div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-0 left-0 z-10 grid max-w-[min(220px,100%)] min-w-36 scale-96 gap-1 rounded-(--radius-control) border bg-(--surface-raised) px-3 py-2.5 text-popover-foreground opacity-0 shadow-(--shadow-floating) transition-[opacity,scale] duration-(--duration-fast) ease-(--ease-standard) motion-reduce:transition-none',
              scrubbing && 'scale-100 opacity-100',
            )}
            ref={tipRef}
            style={{ x: reduced ? tipTargetX : tipSpringX, y: reduced ? tipTargetY : tipSpringY }}
          >
            <p className="m-0 mb-0.5 text-xs whitespace-nowrap text-muted-foreground tabular-nums">{model.labels[reading] ?? ''}</p>
            {visible.map((line) => (
              <p className="m-0 flex min-w-0 items-center gap-2 text-[13px]" key={line.key} style={lineChartSeriesStyle(series.indexOf(line))}>
                <span className="size-2 flex-none rounded-[2px] bg-(--series)" />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{line.label}</span>
                <span className="ml-2 flex-none font-medium whitespace-nowrap tabular-nums">{empty ? '' : valueOf(line.key, reading)}</span>
              </p>
            ))}
          </motion.div>
          <AnimatePresence initial={false}>
            {empty || allHidden ? (
              <motion.p
                animate={{ opacity: 1 }}
                className="pointer-events-none absolute inset-0 m-0 grid place-items-center text-sm text-muted-foreground"
                exit={{ opacity: 0, transition: lineChartFadeFast }}
                initial={{ opacity: 0 }}
                key={empty ? 'empty' : 'hidden'}
              >
                {empty ? 'No data to show' : 'Choose a series to show'}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
        <div aria-hidden="true" className="relative col-start-2 row-start-1 min-w-0">
          <AnimatePresence initial={false}>
            {steady.ticks.map((tick) => <LineChartTick key={tick} label={tickFormat.format(tick)} scale={scale} value={tick} />)}
          </AnimatePresence>
        </div>
        <div aria-hidden="true" className="relative col-start-1 row-start-2 min-w-0">
          <AnimatePresence initial={false}>
            {picks.map((at) => {
              const share = last > 0 ? at / last : 0.5;

              return (
                <motion.span
                  animate={{ opacity: 1 }}
                  className={cn('absolute top-2 text-xs leading-none whitespace-nowrap text-muted-foreground tabular-nums', index === at && 'text-foreground')}
                  exit={{ opacity: 0, transition: lineChartFadeFast }}
                  initial={{ opacity: 0 }}
                  key={`${at}:${model.labels[at]}`}
                  style={{ left: `${share * 100}%`, translateX: `${-share * 100}%` }}
                  transition={lineChartFade}
                >
                  {model.labels[at]}
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      {empty ? null : (
        <div className="sr-only">
          <table>
            <caption>{label}</caption>
            <thead>
              <tr>
                <th scope="col">{x}</th>
                {series.map((line) => <th key={line.key} scope="col">{line.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {model.labels.map((text, row) => (
                <tr key={`${row}:${text}`}>
                  <th scope="row">{text}</th>
                  {series.map((line) => <td key={line.key}>{valueOf(line.key, row)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
