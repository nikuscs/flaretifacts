import { cancelFrame, frame } from 'motion/react';
import { CHART } from '@/constants/chart.constants';

export function chartClamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function chartAmount(text: string) {
  return Number((/-?\d+(?:\.\d+)?/.exec(text.replaceAll(',', '').replaceAll('−', '-')))?.[0] ?? Number.NaN);
}

export function chartFixedFormatter(decimals: number) {
  return new Intl.NumberFormat(CHART.locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function chartDecimals(values: number[]) {
  return Math.max(0, ...values.map((value) => Math.min(2, String(value).split('.')[1]?.length ?? 0)));
}

export function chartColor(index: number) {
  return index < CHART.palette.length
    ? CHART.palette[index]
    : `color-mix(in oklab, var(--foreground) ${CHART.neutral[(index - CHART.palette.length) % CHART.neutral.length]}%, var(--surface))`;
}

export function chartSpring({ visualDuration, bounce }: { visualDuration: number; bounce: number }, restDelta = 0.001) {
  const root = (2 * Math.PI) / (visualDuration * 1.2);

  return {
    type: 'spring' as const,
    stiffness: root * root,
    damping: 2 * (1 - bounce) * root,
    restDelta,
    restSpeed: restDelta * 2,
  };
}

export function chartSoon(start: () => { stop: () => void }) {
  let controls: { stop: () => void } | null = null;

  const chartRun = () => {
    controls = start();
  };

  frame.update(chartRun);

  return () => {
    cancelFrame(chartRun);
    controls?.stop();
  };
}

export function chartValueAt(points: [number, number][], x: number) {
  if (points.length === 0) {
    return 0;
  }

  let low = 0;
  let high = points.length - 1;

  if (x <= points[low][0]) {
    return points[low][1];
  }

  if (x >= points[high][0]) {
    return points[high][1];
  }

  while (high - low > 1) {
    const middle = (low + high) >> 1;

    if (points[middle][0] < x) {
      low = middle;
    } else {
      high = middle;
    }
  }

  const [x0, y0] = points[low];
  const [x1, y1] = points[high];

  return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

export function chartTone(change: string) {
  const sign = change.trim().charAt(0);

  if (sign === '+' || sign === '↑') {
    return 'up' as const;
  }

  if (sign === '-' || sign === '−' || sign === '↓') {
    return 'down' as const;
  }

  return undefined;
}

export function chartCurve(values: number[], samples: number) {
  const last = values.length - 1;
  const step = 1 / last;
  const slopes = values.slice(1).map((value, index) => (value - values[index]) / step);

  const tangents = values.map((_, index) => {
    if (index === 0 || index === last) {
      return slopes[0] ?? 0;
    }

    const before = slopes[index - 1];
    const after = slopes[index];

    return (Math.sign(before) + Math.sign(after)) * Math.min(Math.abs(before), Math.abs(after), Math.abs(before + after) / 4) || 0;
  });

  if (last > 1) {
    tangents[0] = (3 * slopes[0] - tangents[1]) / 2;
    tangents[last] = (3 * slopes[last - 1] - tangents[last - 1]) / 2;
  }

  const points: [number, number][] = [];

  for (let index = 0; index < last; index++) {
    const from = values[index];
    const to = values[index + 1];

    for (let sample = 0; sample < samples; sample++) {
      const t = sample / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      const value = (2 * t3 - 3 * t2 + 1) * from + (t3 - 2 * t2 + t) * step * tangents[index] + (3 * t2 - 2 * t3) * to + (t3 - t2) * step * tangents[index + 1];

      points.push([(index + t) * step, chartClamp(value, Math.min(from, to), Math.max(from, to))]);
    }
  }

  points.push([1, values[last]]);

  return points;
}

export function chartMorph(from: [number, number][], target: [number, number][], steps: number) {
  const grid = Array.from({ length: steps + 1 }, (_, index) => index / steps);
  const xs = [...new Set([...grid, ...target.map(([x]) => x)])].sort((a, b) => a - b);
  const start = xs.map((x) => chartValueAt(from, x));
  const goal = xs.map((x) => chartValueAt(target, x));

  return (progress: number) => xs.map((x, at): [number, number] => [x, start[at] + (goal[at] - start[at]) * progress]);
}
