'use client';

import { cn } from 'cn';
import { motion, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { MOTION } from '@/constants/motion.constants';

export interface BarChartDatum {
  key: string;
  label: string;
  axisLabel: string;
  values: number[];
}

export interface BarChartSeries {
  label: string;
  color?: string;
}

interface BarChartProps {
  data: BarChartDatum[];
  series: BarChartSeries[];
  label: string;
  formatValue: (value: number) => string;
  formatTick?: (value: number) => string;
  money?: boolean;
  averageLabel?: string;
  rest?: { label: string; value: number };
  height?: number;
  className?: string;
}

const barChartPalette = ['var(--series-1)', 'var(--series-3)', 'var(--series-2)', 'var(--series-4)'];

export function BarChart({ data, series, label, formatValue, formatTick = formatValue, money = false, averageLabel = 'Average', rest, height = 200, className }: BarChartProps) {
  const moneyMark = money ? '' : undefined;
  const reduced = Boolean(useReducedMotion());
  const plot = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useLayoutEffect(() => {
    const node = plot.current;

    if (!node) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const values = data.flatMap((datum) => datum.values);
  const top = Math.max(0, ...values);
  const bottom = Math.min(0, ...values);
  const step = 10 ** Math.floor(Math.log10(Math.max(top - bottom, 1)));
  const ceiling = top > 0 ? Math.ceil(top / step) * step : 0;
  const floor = bottom < 0 ? Math.floor(bottom / step) * step : 0;
  const span = ceiling - floor || 1;
  const yOf = (value: number) => 12 + ((ceiling - value) / span) * (height - 12);
  const slot = data.length ? width / data.length : 0;
  const groupWidth = Math.min(slot * 0.62, 28 * series.length + 4 * (series.length - 1));
  const barWidth = series.length ? (groupWidth - 4 * (series.length - 1)) / series.length : 0;
  const average = data.length ? data.reduce((sum, datum) => sum + (datum.values[0] ?? 0), 0) / data.length : 0;
  const ticks = [ceiling, (ceiling + floor) / 2, floor].filter((tick, index, all) => all.indexOf(tick) === index);
  const shown = active === null ? null : data[active];
  const transition = reduced ? { duration: 0 } : MOTION.spring.smooth;

  return (
    <figure aria-label={label} className={cn('m-0 grid min-w-0 gap-4', className)}>
      <div className="grid min-h-[4.25rem] gap-0.5">
        <span className="text-[13px] text-muted-foreground">{shown?.label ?? rest?.label ?? averageLabel}</span>
        <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-2xl leading-tight font-medium tracking-[-0.03em] tabular-nums">
          {shown
            ? shown.values.map((value, index) => (
              <span className="inline-flex items-baseline gap-1.5" key={series[index]?.label ?? index}>
                {series.length > 1 ? <span aria-hidden="true" className="size-2 self-center rounded-[2px]" style={{ background: series[index]?.color ?? barChartPalette[index] }} /> : null}
                <span data-money={moneyMark}>{formatValue(value)}</span>
              </span>
            ))
            : <span data-money={moneyMark}>{formatValue(rest?.value ?? average)}</span>}
        </span>
        {series.length > 1 ? (
          <span className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {series.map((item, index) => (
              <span className="inline-flex items-center gap-1.5" key={item.label}>
                <span aria-hidden="true" className="size-2 rounded-[2px]" style={{ background: item.color ?? barChartPalette[index] }} />
                {item.label}
              </span>
            ))}
          </span>
        ) : null}
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_56px] grid-rows-[auto_24px]">
        <div
          className="relative min-w-0"
          onPointerLeave={() => setActive(null)}
          onPointerMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();

            setActive(slot ? Math.min(data.length - 1, Math.max(0, Math.floor((event.clientX - box.left) / slot))) : null);
          }}
          ref={plot}
          style={{ height }}
        >
          <svg aria-hidden="true" className="block overflow-visible" height={height} width={width}>
            {ticks.map((tick) => <line className="stroke-border" key={tick} shapeRendering="crispEdges" x1={0} x2={width} y1={yOf(tick)} y2={yOf(tick)} />)}
            {data.map((datum, index) => datum.values.map((value, seriesIndex) => {
              const from = yOf(Math.max(value, 0));
              const size = Math.max(Math.abs(yOf(value) - yOf(0)), value === 0 ? 0 : 1);
              const color = series[seriesIndex]?.color ?? barChartPalette[seriesIndex % barChartPalette.length];

              return (
                <motion.rect
                  animate={{ y: from, height: size, x: index * slot + (slot - groupWidth) / 2 + seriesIndex * (barWidth + 4), width: Math.max(barWidth, 0) }}
                  initial={false}
                  key={`${datum.key}-${series[seriesIndex]?.label ?? seriesIndex}`}
                  rx={Math.max(0, Math.min(4, barWidth / 2))}
                  style={{ fill: `color-mix(in oklab, ${color} ${active === null || active === index ? 78 : 30}%, var(--surface))` }}
                  transition={transition}
                />
              );
            }))}
            {data.length > 1 && !rest ? (
              <motion.line
                animate={{ y1: yOf(average), y2: yOf(average) }}
                className="stroke-muted-foreground"
                initial={false}
                strokeDasharray="3 3"
                transition={transition}
                x1={0}
                x2={width}
              />
            ) : null}
            {floor < 0 ? <line className="stroke-[var(--border-strong)]" shapeRendering="crispEdges" x1={0} x2={width} y1={yOf(0)} y2={yOf(0)} /> : null}
          </svg>
        </div>
        <div aria-hidden="true" className="relative">
          {ticks.map((tick) => (
            <span
              className="absolute left-2.5 -translate-y-1/2 text-xs whitespace-nowrap text-muted-foreground tabular-nums"
              data-money={moneyMark}
              key={tick}
              style={{ top: yOf(tick) }}
            >
              {formatTick(tick)}
            </span>
          ))}
        </div>
        <div aria-hidden="true" className="relative min-w-0 overflow-hidden">
          {data.map((datum, index) => (
            <span
              className={cn('absolute top-2 -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground tabular-nums', active === index && 'text-foreground')}
              key={datum.key}
              style={{ left: index * slot + slot / 2 }}
            >
              {datum.axisLabel}
            </span>
          ))}
        </div>
      </div>
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <tbody>
            {data.map((datum) => (
              <tr key={datum.key}>
                <th scope="row">{datum.label}</th>
                {datum.values.map((value, index) => <td key={series[index]?.label ?? index}>{`${series[index]?.label ?? ''} ${formatValue(value)}`}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
