'use client';

import { cn } from 'cn';
import { useInView, useReducedMotion } from 'motion/react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ActivityHeatmapAxis } from '@/components/ui/activity-heatmap-axis';
import { ActivityHeatmapLegend } from '@/components/ui/activity-heatmap-legend';
import { ActivityHeatmapTip } from '@/components/ui/activity-heatmap-tip';
import { datesDayLong, datesDayShort, datesMonthShort } from '@/utils/dates.utils';
import styles from './activity-heatmap.module.css';
import type { ActivityHeatmapTipContent } from '@/components/ui/activity-heatmap-tip';
import type * as ReactTypes from 'react';

export interface ActivityHeatmapDay {
  date: string;
  count: number;
  tone?: ActivityHeatmapTone | null;
  note?: string | null;
}

export type ActivityHeatmapTone = 'off' | 'holiday' | 'leave' | 'missing';

interface ActivityHeatmapProps {
  days: ActivityHeatmapDay[];
  label: string;
  period: string;
  unit: { one: string; other: string };
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  onSelectRange?: (dates: string[]) => void;
  rangeable?: (date: string) => boolean;
  caption?: ReactTypes.ReactNode;
  tones?: { tone: ActivityHeatmapTone; label: string }[];
  actions?: ReactTypes.ReactNode;
  className?: string;
}

const activityHeatmapDayMs = 86_400_000;
const activityHeatmapLevels = [0, 1, 2, 3, 4];
const activityHeatmapWaveMs = 420;

const activityHeatmapNumber = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

export function ActivityHeatmap({
  days,
  label,
  period,
  unit,
  selectedDate = null,
  onSelectDate,
  onSelectRange,
  rangeable,
  caption,
  tones,
  actions,
  className,
}: ActivityHeatmapProps) {
  const reduced = Boolean(useReducedMotion());
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(plotRef, { once: true, amount: 0.35 });
  const noun = (count: number) => (count === 1 ? unit.one : unit.other);

  const model = useMemo(() => {
    const times = days.map((day) => Date.parse(`${day.date}T00:00:00Z`)).filter(Number.isFinite);
    const start = times.length > 0 ? Math.min(...times) : Date.parse('2026-01-01T00:00:00Z');
    const length = times.length > 0 ? Math.round((Math.max(...times) - start) / activityHeatmapDayMs) + 1 : 0;
    const counts = Array.from({ length }, () => 0);

    for (const day of days) {
      const index = Math.round((Date.parse(`${day.date}T00:00:00Z`) - start) / activityHeatmapDayMs);

      counts[index] = (counts[index] ?? 0) + Math.max(0, day.count);
    }

    const max = Math.max(0, ...counts);
    const bounds = [Math.max(1, Math.ceil(max * 0.25)), Math.max(2, Math.ceil(max * 0.5)), Math.max(3, Math.ceil(max * 0.75))];
    const levels = counts.map((count) => (count <= 0 ? 0 : 1 + bounds.filter((bound) => count > bound).length));
    const lead = (new Date(start).getUTCDay() + 6) % 7;

    const months = counts
      .map((_, index) => new Date(start + index * activityHeatmapDayMs))
      .flatMap((date, index) => (index === 0 || date.getUTCDate() === 1
        ? [{ key: date.toISOString().slice(0, 7), col: Math.floor((lead + index) / 7), label: datesMonthShort(date) }]
        : []));

    return {
      start,
      length,
      lead,
      weeks: Math.ceil((lead + length) / 7),
      counts,
      levels,
      bounds,
      months: months.length > 1 && months[1].col - months[0].col < 3 ? months.slice(1) : months,
      perLevel: activityHeatmapLevels.map((level) => levels.filter((found) => found === level).length),
      total: counts.reduce((sum, count) => sum + count, 0),
    };
  }, [days]);

  const markByDate = new Map(days.flatMap((day) => (day.tone ? [[day.date, { tone: day.tone, note: day.note ? ` · ${day.note}` : '' }] as const] : [])));
  const isoOf = (index: number) => new Date(model.start + index * activityHeatmapDayMs).toISOString().slice(0, 10);

  const [reveal, setReveal] = useState<'hidden' | 'revealing' | 'done'>('hidden');

  useEffect(() => {
    if (reveal !== 'hidden' || !(inView || reduced)) {
      return undefined;
    }

    const handle = requestAnimationFrame(() => setReveal(reduced ? 'done' : 'revealing'));

    return () => cancelAnimationFrame(handle);
  }, [inView, reduced, reveal]);

  useEffect(() => {
    if (reveal !== 'revealing') {
      return undefined;
    }

    const timer = setTimeout(() => setReveal('done'), activityHeatmapWaveMs + 700);

    return () => clearTimeout(timer);
  }, [reveal]);

  const selectedIndex = selectedDate ? Math.round((Date.parse(`${selectedDate}T00:00:00Z`) - model.start) / activityHeatmapDayMs) : -1;
  const hasSelection = selectedIndex >= 0 && selectedIndex < model.length;
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const tabIndexDay = focusIndex ?? (hasSelection ? selectedIndex : model.length - 1);
  const [pinned, setPinned] = useState<number | null>(null);
  const [tip, setTip] = useState<ActivityHeatmapTipContent | null>(null);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<{ from: number; to: number } | null>(null);
  const rangeAnchor = useRef<number | null>(null);
  const rangeDone = useRef(false);

  const rectangleOf = (from: number, to: number) => {
    const [fromCol, fromRow] = [Math.floor((from + model.lead) / 7), (from + model.lead) % 7];
    const [toCol, toRow] = [Math.floor((to + model.lead) / 7), (to + model.lead) % 7];

    return Array.from({ length: model.length }, (_, index) => index).filter((index) => {
      const col = Math.floor((index + model.lead) / 7);
      const row = (index + model.lead) % 7;

      const inBox = col >= Math.min(fromCol, toCol) && col <= Math.max(fromCol, toCol) && row >= Math.min(fromRow, toRow) && row <= Math.max(fromRow, toRow);

      return inBox && (rangeable?.(isoOf(index)) ?? true);
    });
  };

  const ranged = new Set(range ? rectangleOf(range.from, range.to) : []);

  useEffect(() => {
    if (!range) {
      return undefined;
    }

    const finish = () => {
      const dragged = [...ranged].map(isoOf);

      rangeDone.current = range.from !== range.to;
      setRange(null);
      setOpen(false);

      if (range.from !== range.to && dragged.length > 0) {
        onSelectRange?.(dragged);
      }
    };

    window.addEventListener('pointerup', finish, { once: true });

    return () => window.removeEventListener('pointerup', finish);
  });
  const [preview, setPreview] = useState<number | null>(null);
  const highlight = preview ?? pinned;
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const show = (index: number, anchor: HTMLElement) => {
    const count = model.counts[index] ?? 0;
    const date = isoOf(index);

    clearTimeout(hideTimer.current);
    setTip({
      key: date,
      primary: count > 0 ? `${activityHeatmapNumber.format(count)} ${noun(count)}` : `No ${unit.other}`,
      secondary: `${datesDayShort(new Date(`${date}T00:00:00Z`))}${markByDate.get(date)?.note ?? ''}`,
      anchor,
    });
    setOpen(true);
  };

  const hideSoon = (delay: number) => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setOpen(false), delay);
  };

  const hitOf = (target: EventTarget | null) => {
    const cell = target instanceof Element ? target.closest<HTMLElement>('[data-index]') : null;

    return cell && gridRef.current?.contains(cell) ? { cell, index: Number(cell.dataset.index) } : null;
  };

  const onKeyDown = (event: ReactTypes.KeyboardEvent<HTMLButtonElement>) => {
    const hit = hitOf(event.target);

    if (!hit) {
      return;
    }

    const moves = new Map([
      ['ArrowUp', hit.index - 1],
      ['ArrowDown', hit.index + 1],
      ['ArrowLeft', hit.index - 7],
      ['ArrowRight', hit.index + 7],
      ['Home', 0],
      ['End', model.length - 1],
    ]);

    const move = moves.get(event.key);

    if (move !== undefined) {
      event.preventDefault();
      gridRef.current?.querySelector<HTMLElement>(`[data-index="${Math.min(Math.max(move, 0), model.length - 1)}"]`)?.focus();
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const maxDiagonal = Math.max(1, model.weeks + 5);
  const step = Math.min(12, activityHeatmapWaveMs / maxDiagonal);
  const selectedCol = hasSelection ? Math.floor((selectedIndex + model.lead) / 7) : 0;
  const selectedRow = hasSelection ? (selectedIndex + model.lead) % 7 : 0;
  const ringShown = hasSelection && reveal !== 'hidden';
  // SAFETY: ReactTypes.CSSProperties has no index signature for custom properties; this key is a CSS variable.
  const canvasStyle = { '--weeks': model.weeks } as ReactTypes.CSSProperties;

  return (
    <div className={cn(styles.root, className)} ref={rootRef}>
      <div className={styles.header}>
        <p className={styles.summary}>
          <span className={styles.total}>{`${activityHeatmapNumber.format(model.total)} ${noun(model.total)}`}</span>
          <span className={styles.period}>{`in ${period}`}</span>
        </p>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>

      <div className={styles.scroller} ref={scrollerRef}>
        <div className={styles.canvas} style={canvasStyle}>
          <ActivityHeatmapAxis months={model.months} />
          <div className={styles.plot} ref={plotRef}>
            <table
              aria-describedby={`${id}-legend`}
              aria-label={label}
              className={cn(styles.grid, 'border-collapse')}
              data-highlight={highlight ?? undefined}
              data-reveal={reveal}
              ref={gridRef}
            >
              <tbody className="contents">
                {Array.from({ length: 7 }, (_row, row) => (
                  <tr className={styles.row} key={row}>
                    {Array.from({ length: model.weeks }, (_col, col) => {
                      const index = col * 7 + row - model.lead;
                      // SAFETY: ReactTypes.CSSProperties has no index signature for custom properties; these keys are CSS variables.
                      const wave = { '--wave': `${Math.round((col + row) * step)}ms`, '--wave-back': `${Math.round((maxDiagonal - col - row) * step)}ms` } as ReactTypes.CSSProperties;

                      if (index < 0 || index >= model.length) {
                        return (
                          <td
                            aria-hidden="true"
                            className={cn(styles.cell, 'p-0')}
                            data-empty=""
                            key={col}
                            style={wave}
                          />
                        );
                      }

                      const count = model.counts[index] ?? 0;
                      const date = isoOf(index);

                      return (
                        <td className="p-0" key={col}>
                          <button
                            aria-label={`${count > 0 ? activityHeatmapNumber.format(count) : 'No'} ${noun(count)}, ${datesDayLong(new Date(`${date}T00:00:00Z`))}${markByDate.get(date)?.note ?? ''}`}
                            aria-pressed={onSelectDate ? index === selectedIndex : undefined}
                            className={cn(styles.cell, 'border-0 p-0')}
                            data-index={index}
                            data-level={model.levels[index]}
                            data-range={ranged.has(index) ? '' : undefined}
                            data-tone={markByDate.get(date)?.tone}
                            style={wave}
                            tabIndex={index === tabIndexDay ? 0 : -1}
                            type="button"
                            onBlur={(event) => {
                              if (!(event.relatedTarget instanceof Node && gridRef.current?.contains(event.relatedTarget))) {
                                hideSoon(0);
                              }
                            }}
                            onClick={(event) => {
                              if (rangeDone.current) {
                                rangeDone.current = false;
                              } else if (markByDate.get(date)?.tone === 'off') {
                                rangeAnchor.current = null;
                              } else if (event.shiftKey && onSelectRange && rangeAnchor.current !== null && rangeAnchor.current !== index) {
                                const picked = rectangleOf(rangeAnchor.current, index).map(isoOf);

                                if (picked.length > 0) {
                                  onSelectRange(picked);
                                }
                              } else {
                                rangeAnchor.current = index;
                                onSelectDate?.(date);
                              }
                            }}
                            onFocus={(event) => {
                              setFocusIndex(index);
                              show(index, event.currentTarget);
                            }}
                            onKeyDown={onKeyDown}
                            onPointerDown={(event) => {
                              if (!onSelectRange || event.pointerType === 'touch' || event.button !== 0 || event.shiftKey) {
                                return;
                              }

                              event.preventDefault();
                              setRange({ from: index, to: index });
                            }}
                            onPointerEnter={(event) => {
                              show(index, event.currentTarget);

                              if (range) {
                                setRange({ ...range, to: index });
                              }
                            }}
                            onPointerLeave={(event) => hideSoon(event.pointerType === 'touch' ? 2400 : 110)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <span
              aria-hidden="true"
              className={styles.ring}
              data-shown={ringShown || undefined}
              // SAFETY: ReactTypes.CSSProperties has no index signature for custom properties; these keys are CSS variables.
              style={{ '--col': selectedCol, '--row': selectedRow } as ReactTypes.CSSProperties}
            />
          </div>
        </div>
      </div>

      <ActivityHeatmapLegend
        bounds={model.bounds}
        caption={caption}
        highlight={highlight}
        id={`${id}-legend`}
        perLevel={model.perLevel}
        pinned={pinned}
        reduced={reduced}
        tones={tones}
        unit={unit}
        onPinnedChange={setPinned}
        onPreviewChange={setPreview}
      />

      <ActivityHeatmapTip
        open={open}
        reduced={reduced}
        rootRef={rootRef}
        scrollerRef={scrollerRef}
        tip={tip}
      />
    </div>
  );
}
