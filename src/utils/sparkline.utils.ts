import { CHART } from '@/constants/chart.constants';
import { chartCurve, chartValueAt } from '@/utils/chart.utils';

export function sparklineFormat(value: number) {
  return new Intl.NumberFormat(CHART.locale).format(value);
}

export function sparklineIsNumeric(text: string) {
  return !/\p{L}/u.test(text);
}

export function sparklineChunks(text: string, whole: boolean) {
  if (!text) {
    return [];
  }

  if (whole) {
    return [{ slot: 'all', key: text, text }];
  }

  if (sparklineIsNumeric(text)) {
    const chars = Array.from(text);

    return chars.map((char, index) => ({ slot: `n${chars.length - index}`, key: char, text: char }));
  }

  const words = text.split(/(?<=\s)/);

  return words.map((word, index) => ({ slot: `w${index}`, key: words.slice(0, index + 1).join(''), text: word }));
}

export function sparklineCurve(data: number[]) {
  const min = Math.min(...data);
  const span = Math.max(...data) - min;
  const ys = data.map((value) => (span ? (value - min) / span : 0.5));

  return chartCurve(ys, Math.max(1, Math.min(16, Math.round(128 / (ys.length - 1)))));
}

function sparklineY(y: number, height: number) {
  return CHART.sparkline.inset + (1 - y) * (height - CHART.sparkline.inset * 2);
}

export function sparklineGeometry(curve: [number, number][], width: number, height: number, at: number) {
  const points = curve.map(([x, y]): [number, number] => [x * width, sparklineY(y, height)]);
  const pairs = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`);
  const cx = at * width;
  const cy = sparklineY(chartValueAt(curve, at), height);

  return {
    points,
    line: pairs.join(' '),
    trail: `M${pairs.join('L')}`,
    fill: `M${pairs.join('L')}L${width},${height}L0,${height}Z`,
    dot: `${cx},${cy} ${cx},${cy}`,
    cx,
  };
}

export function sparklineTipAt(points: [number, number][], progress: number) {
  const steps = points.slice(1).map(([x, y], index) => Math.hypot(x - points[index][0], y - points[index][1]));
  let left = progress * steps.reduce((sum, step) => sum + step, 0);

  for (const [index, step] of steps.entries()) {
    const from = points[index][0];

    if (left <= step) {
      return from + (points[index + 1][0] - from) * (step ? left / step : 1);
    }

    left -= step;
  }

  return points.at(-1)?.[0] ?? 0;
}
