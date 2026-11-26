'use client';

import { cn } from 'cn';
import { animate, cancelFrame, frame, motion, motionValue, useInView, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { MOTION } from '@/constants/motion.constants';
import styles from './donut-chart.module.css';
import type { MotionValue } from 'motion/react';
import type { CSSProperties } from 'react';

export interface DonutChartDatum {
  key: string;
  label: string;
  value: number;
  color?: string;
  hint?: string;
}

interface DonutChartProps {
  data: DonutChartDatum[];
  label: string;
  formatValue: (value: number) => string;
  money?: boolean;
  totalLabel?: string;
  emptyLabel?: string;
  size?: number;
  thickness?: number;
  className?: string;
}

interface DonutChartSegment {
  start: MotionValue<number>;
  end: MotionValue<number>;
  lift: MotionValue<number>;
  off: () => void;
}

const donutChartTau = Math.PI * 2;
const donutChartLift = 4;
const donutChartGrow = 2;
const donutChartMargin = 7;
const donutChartGap = 3;
const donutChartCorner = 4;
const donutChartNeutral = [56, 42, 32];
const donutChartPercent = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 });

function donutChartSpring(visualDuration: number, restDelta = 0.0005) {
  const root = donutChartTau / (visualDuration * 1.2);

  return { type: 'spring' as const, stiffness: root * root, damping: 2 * root, restDelta, restSpeed: restDelta * 2 };
}

function donutChartColor(index: number) {
  return index < 4 ? `var(--series-${index + 1})` : `color-mix(in oklab, var(--foreground) ${donutChartNeutral[(index - 4) % donutChartNeutral.length]}%, var(--surface))`;
}

function donutChartShare(share: number) {
  return share > 0 && share < 0.01 ? '<1%' : donutChartPercent.format(share);
}

function donutChartRound(value: number) {
  return (Math.round(value * 100) / 100).toString();
}

function donutChartSector(c: number, outer: number, inner: number, t0: number, t1: number, corner: number) {
  const turns = t1 - t0;
  const at = (radius: number, angle: number) => `${donutChartRound(c + radius * Math.cos(angle))} ${donutChartRound(c + radius * Math.sin(angle))}`;
  const R = donutChartRound(outer);
  const r = donutChartRound(inner);

  if (turns <= 1e-6) {
    return '';
  }

  if (turns >= 1 - 1e-6) {
    return `M${at(outer, -Math.PI / 2)}A${R} ${R} 0 1 1 ${at(outer, Math.PI / 2)}A${R} ${R} 0 1 1 ${at(outer, -Math.PI / 2)}ZM${at(inner, -Math.PI / 2)}A${r} ${r} 0 1 0 ${at(inner, Math.PI / 2)}A${r} ${r} 0 1 0 ${at(inner, -Math.PI / 2)}Z`;
  }

  const p = Math.min(donutChartGap / 2, ((1 - turns) * donutChartTau * outer) / 2);
  const a0 = t0 * donutChartTau - Math.PI / 2;
  const a1 = t1 * donutChartTau - Math.PI / 2;
  const s = Math.sin(Math.min((a1 - a0) / 2, Math.PI / 2));

  if (s * outer <= p + 1e-6) {
    return '';
  }

  const side = (t: number, angle: number, sign: number) => `${donutChartRound(c + t * Math.cos(angle) - sign * p * Math.sin(angle))} ${donutChartRound(c + t * Math.sin(angle) + sign * p * Math.cos(angle))}`;
  const band = (outer - inner) / 2;
  const whole = s >= 0.9999;
  const ro = Math.max(0, Math.min(corner, band, whole ? Infinity : (s * outer - p) / (1 + s)));
  const dO = Math.asin(Math.min(1, (p + ro) / (outer - ro)));
  const tO = Math.sqrt(Math.max(0, (outer - ro) ** 2 - (p + ro) ** 2));
  const bigO = a1 - a0 - 2 * dO > Math.PI ? 1 : 0;

  const outerPath = [
    `M${side(tO, a0, 1)}`,
    ro > 0.01 ? `A${donutChartRound(ro)} ${donutChartRound(ro)} 0 0 1 ${at(outer, a0 + dO)}` : '',
    `A${R} ${R} 0 ${bigO} 1 ${at(outer, a1 - dO)}`,
    ro > 0.01 ? `A${donutChartRound(ro)} ${donutChartRound(ro)} 0 0 1 ${side(tO, a1, -1)}` : '',
  ];

  if (s * inner <= p + 1e-6 && !whole) {
    return `${outerPath.join('')}L${at(p / s, (a0 + a1) / 2)}Z`;
  }

  const ri = Math.max(0, Math.min(corner, band, whole ? Infinity : (s * inner - p) / (1 - s)));
  const dI = Math.asin(Math.min(1, (p + ri) / (inner + ri)));
  const tI = Math.sqrt(Math.max(0, (inner + ri) ** 2 - (p + ri) ** 2));
  const bigI = a1 - a0 - 2 * dI > Math.PI ? 1 : 0;

  return [
    ...outerPath,
    `L${side(tI, a1, -1)}`,
    ri > 0.01 ? `A${donutChartRound(ri)} ${donutChartRound(ri)} 0 0 1 ${at(inner, a1 - dI)}` : '',
    `A${r} ${r} 0 ${bigI} 0 ${at(inner, a0 + dI)}`,
    ri > 0.01 ? `A${donutChartRound(ri)} ${donutChartRound(ri)} 0 0 1 ${side(tI, a0, 1)}` : '',
    'Z',
  ].join('');
}

export function DonutChart({ data, label, formatValue, money = false, totalLabel = 'Total', emptyLabel = 'Nothing yet', size = 208, thickness = 24, className }: DonutChartProps) {
  const reduced = Boolean(useReducedMotion());
  const moneyMark = money ? '' : undefined;
  const figure = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const inView = useInView(figure, { once: true, amount: 0.35 });
  const legendId = useId();
  const [hidden, setHidden] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  const slices = data.filter((item) => item.value > 0);
  const visible = slices.filter((item) => !hidden.includes(item.key));
  const total = visible.reduce((sum, item) => sum + item.value, 0);
  const signature = slices.map((item) => `${item.key}:${item.value}:${hidden.includes(item.key)}`).join('|');
  const current = [preview, pinned].find((key) => key !== null && visible.some((item) => item.key === key)) ?? null;
  const active = visible.find((item) => item.key === current);
  const colors = new Map(slices.map((item, index) => [item.key, item.color ?? donutChartColor(index)]));

  const [drawn, setDrawn] = useState(slices);
  const [seen, setSeen] = useState(signature);

  if (seen !== signature) {
    const leaving = drawn.filter((item) => !slices.some((slice) => slice.key === item.key)).map((item) => ({ ...item, value: 0 }));

    setSeen(signature);
    setDrawn(slices.length === 0 ? [] : [...slices, ...leaving]);
  }

  const c = size / 2;
  const outer = c - donutChartMargin;
  const inner = Math.max(8, outer - thickness);
  const corner = Math.min(donutChartCorner, thickness / 4);

  const geometry = useRef({
    c,
    outer,
    inner,
    corner,
  });

  const segments = useRef(new Map<string, DonutChartSegment>());
  const paths = useRef(new Map<string, SVGPathElement>());
  const targets = useRef(new Map<string, { start: number; end: number }>());

  const paint = useCallback(() => {
    const { c: center, outer: radius, inner: hole, corner: round } = geometry.current;

    for (const [key, node] of paths.current) {
      const segment = segments.current.get(key);
      const start = segment?.start.get() ?? 0;
      const end = segment?.end.get() ?? 0;
      const lift = Math.max(0, segment?.lift.get() ?? 0);
      const middle = ((start + end) / 2) * donutChartTau - Math.PI / 2;

      node.setAttribute('d', donutChartSector(center, radius + lift * donutChartGrow, hole - lift * donutChartGrow * 0.5, start, end, round));
      node.setAttribute('transform', `translate(${donutChartRound(Math.cos(middle) * lift * donutChartLift)} ${donutChartRound(Math.sin(middle) * lift * donutChartLift)})`);
    }
  }, []);

  const schedule = useCallback(() => {
    frame.render(paint);
  }, [paint]);

  useLayoutEffect(() => {
    geometry.current = { c, outer, inner, corner };
    paint();
  });

  useEffect(() => {
    const live = segments.current;

    return () => {
      cancelFrame(paint);
      live.forEach((segment) => segment.off());
      live.clear();
    };
  }, [paint]);

  const shown = inView || reduced;

  const latest = useRef({
    drawn,
    slices,
    visible,
    hidden,
  });

  useLayoutEffect(() => {
    latest.current = { drawn, slices, visible, hidden };
  });

  useEffect(() => {
    if (!shown || !signature) {
      return;
    }

    const now = latest.current;
    const first = segments.current.size === 0;
    const sum = now.visible.reduce((acc, item) => acc + item.value, 0) || 1;
    const goal = new Map<string, { start: number; end: number }>();
    let at = 0;

    for (const item of now.drawn) {
      const share = now.hidden.includes(item.key) ? 0 : item.value / sum;

      goal.set(item.key, { start: at, end: at + share });
      at += share;
    }

    targets.current = goal;

    now.drawn.forEach((item, index) => {
      const to = goal.get(item.key) ?? { start: at, end: at };
      const leaving = !now.slices.some((slice) => slice.key === item.key);
      const existing = segments.current.get(item.key);

      const segment = existing ?? {
        start: motionValue(first ? 0 : to.start),
        end: motionValue(first ? 0 : to.start),
        lift: motionValue(0),
        off: () => undefined,
      };

      if (!existing) {
        const offs = [segment.start.on('change', schedule), segment.end.on('change', schedule), segment.lift.on('change', schedule)];

        segment.off = () => {
          offs.forEach((off) => off());
          segment.start.destroy();
          segment.end.destroy();
          segment.lift.destroy();
        };
        segments.current.set(item.key, segment);
      }

      const drop = () => {
        segments.current.get(item.key)?.off();
        segments.current.delete(item.key);
        setDrawn((list) => list.filter((entry) => entry.key !== item.key || entry.value > 0));
      };

      if (reduced) {
        segment.start.jump(to.start);
        segment.end.jump(to.end);

        if (leaving) {
          drop();
        }

        return;
      }

      const spring = donutChartSpring(first ? 0.72 : 0.5);

      animate(segment.start, to.start, spring);
      animate(segment.end, to.end, {
        ...spring,
        delay: first ? 0.04 + index * MOTION.stagger.item : 0,
        onComplete: leaving ? drop : undefined,
      });
    });

    schedule();
  }, [shown, signature, reduced, schedule]);

  useEffect(() => {
    for (const [key, segment] of segments.current) {
      const to = key === current ? 1 : 0;

      if (reduced) {
        segment.lift.jump(to);
      } else if (segment.lift.get() !== to || segment.lift.isAnimating()) {
        animate(segment.lift, to, donutChartSpring(0.26, 0.002));
      }
    }
  }, [current, reduced, drawn, shown]);

  const hit = (event: { clientX: number; clientY: number }) => {
    const box = svg.current?.getBoundingClientRect();

    if (!box?.width) {
      return null;
    }

    const scale = size / box.width;
    const x = (event.clientX - box.left) * scale - c;
    const y = (event.clientY - box.top) * scale - c;
    const radius = Math.hypot(x, y);
    const angle = (Math.atan2(y, x) + Math.PI / 2) / donutChartTau;
    const turn = angle < 0 ? angle + 1 : angle;

    if (radius < inner - 6 || radius > c) {
      return null;
    }

    const under = [...targets.current].find(([key, arc]) => turn >= arc.start && turn < arc.end && visible.some((item) => item.key === key));

    return under?.[0] ?? null;
  };

  const toggle = (key: string) => {
    if (hidden.includes(key)) {
      setHidden(hidden.filter((item) => item !== key));
    } else if (visible.length > 1) {
      setHidden([...hidden, key]);
    }
  };

  const centerLabel = total ? totalLabel : emptyLabel;

  return (
    <figure aria-label={label} className={cn(styles.figure, className)} ref={figure}>
      <div
        className={styles.ring}
        // SAFETY: CSSProperties has no index signature for custom properties; this key is a CSS variable.
        style={{ width: size, '--inner': `${((inner * 2) / size) * 100}%` } as CSSProperties}
      >
        <svg
          aria-hidden="true"
          className={styles.svg}
          data-hovering={current === null ? undefined : true}
          focusable="false"
          onClick={(event) => {
            const key = hit(event);

            setPinned(key === pinned ? null : key);
          }}
          onPointerLeave={() => setPreview(null)}
          onPointerMove={(event) => {
            if (event.pointerType === 'mouse') {
              setPreview(hit(event));
            }
          }}
          ref={svg}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle className={styles.track} cx={c} cy={c} data-idle={!shown || !total || undefined} r={(outer + inner) / 2} strokeWidth={outer - inner} />
          {drawn.map((item) => (
            <path
              className={styles.segment}
              data-active={item.key === current || undefined}
              data-dim={(current !== null && item.key !== current) || undefined}
              key={item.key}
              ref={(node) => {
                if (node) {
                  paths.current.set(item.key, node);
                }

                return () => {
                  paths.current.delete(item.key);
                };
              }}
              // SAFETY: CSSProperties has no index signature for custom properties; this key is a CSS variable.
              style={{ '--slice': colors.get(item.key) ?? donutChartColor(0) } as CSSProperties}
            />
          ))}
        </svg>
        <div aria-hidden="true" className={styles.center}>
          <motion.span
            animate={{ opacity: 1, y: 0 }}
            className={styles.readout}
            initial={reduced ? false : { opacity: 0, y: '0.3em' }}
            key={active?.key ?? 'total'}
            transition={{ duration: MOTION.duration.standard, ease: [...MOTION.ease.enter] }}
          >
            <span className={styles.centerLabel}>{active?.label ?? centerLabel}</span>
            <span className={styles.centerValue} data-money={moneyMark}>{total ? formatValue(active?.value ?? total) : ' '}</span>
            <span className={styles.centerMeta}>{active ? `${donutChartShare(active.value / total)} of ${totalLabel.toLowerCase()}` : ' '}</span>
          </motion.span>
        </div>
      </div>
      {slices.length > 0 ? (
        <ul aria-label={`${label}, segments. Press a segment to show or hide it`} className={styles.legend} id={legendId} onPointerLeave={() => setPreview(null)}>
          {slices.map((item) => {
            const off = hidden.includes(item.key);

            return (
              <li key={item.key}>
                <button
                  aria-pressed={!off}
                  className={styles.row}
                  data-active={item.key === current || undefined}
                  data-hidden={off || undefined}
                  onBlur={() => setPreview(null)}
                  onClick={() => toggle(item.key)}
                  onFocus={() => setPreview(off ? null : item.key)}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') {
                      setPreview(off ? null : item.key);
                    }
                  }}
                  // SAFETY: CSSProperties has no index signature for custom properties; this key is a CSS variable.
                  style={{ '--slice': colors.get(item.key) ?? donutChartColor(0) } as CSSProperties}
                  type="button"
                >
                  <span aria-hidden="true" className={styles.dot} />
                  <span className={styles.rowText}>
                    <span className={styles.rowLabel}>{item.label}</span>
                    {item.hint ? <span className={styles.rowHint}>{item.hint}</span> : null}
                  </span>
                  <span className={styles.rowValue} data-money={moneyMark}>{formatValue(item.value)}</span>
                  <span className={styles.rowShare}>{off || !total ? '–' : donutChartShare(item.value / total)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <p className="sr-only">{total ? `${label}. ${totalLabel} ${formatValue(total)}. ${visible.map((item) => `${item.label}, ${formatValue(item.value)}, ${donutChartShare(item.value / total)}`).join('. ')}.` : `${label}. ${emptyLabel}.`}</p>
    </figure>
  );
}
