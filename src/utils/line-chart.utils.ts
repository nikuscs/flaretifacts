import { CHART } from '@/constants/chart.constants';
import { chartCurve } from '@/utils/chart.utils';

function lineChartClean(value: number) {
  return Number(value.toPrecision(12));
}

function lineChartNumber(cell: string | number | null | undefined) {
  const value = Number(cell ?? Number.NaN);

  return Number.isFinite(value) ? value : null;
}

function lineChartBridge(cells: (number | null)[]) {
  const known = cells.flatMap((cell, index) => (cell === null ? [] : [{ index, cell }]));

  return cells.map((cell, index) => {
    if (cell !== null) {
      return cell;
    }

    const before = known.findLast((point) => point.index < index);
    const after = known.find((point) => point.index > index);

    if (before && after) {
      return before.cell + ((after.cell - before.cell) * (index - before.index)) / (after.index - before.index);
    }

    return (before ?? after)?.cell ?? 0;
  });
}

export function lineChartModel(data: Record<string, string | number | null>[], x: string, keys: string[]) {
  const labels = data.map((row) => String(row[x] ?? ''));
  const cells = Object.fromEntries(keys.map((key) => [key, data.map((row) => lineChartNumber(row[key]))]));
  const values = Object.fromEntries(keys.map((key) => [key, lineChartBridge(cells[key])]));
  const signature = [keys.join(','), ...labels.map((label, index) => `${label}:${keys.map((key) => cells[key][index]).join(',')}`)].join(';');

  return { labels, cells, values, signature };
}

export function lineChartNiceScale(low: number, high: number) {
  const lo = Math.min(0, low);
  const hi = high > lo ? high : lo + 1;
  const magnitude = 10 ** Math.floor(Math.log10((hi - lo) / CHART.line.rows));

  for (const factor of [1, 2, 2.5, 5, 10]) {
    const step = factor * magnitude;
    const bottom = Math.floor(lo / step) * step;
    const top = Math.ceil(hi / step) * step;

    if ((top - bottom) / step <= CHART.line.rows + 1e-9) {
      const ticks: number[] = [];

      for (let value = bottom; value <= top + step / 2; value += step) {
        ticks.push(lineChartClean(value));
      }

      return { min: lineChartClean(bottom), max: lineChartClean(top), ticks };
    }
  }

  return { min: lo, max: hi, ticks: [lo, hi] };
}

export function lineChartCurves(values: Record<string, number[]>) {
  return new Map(Object.entries(values).map(([key, line]): [string, [number, number][]] => {
    if (line.length < 2) {
      return [key, line.length === 0 ? [] : [[0, line[0]], [1, line[0]]]];
    }

    return [key, chartCurve(line, Math.max(1, Math.min(CHART.line.maxSegmentSamples, Math.round(CHART.line.curveSamples / (line.length - 1)))))];
  }));
}

export function lineChartRange(values: Record<string, number[]>, keys: string[]) {
  const shown = keys.flatMap((key) => values[key] ?? []);

  return shown.length === 0 ? null : lineChartNiceScale(Math.min(...shown), Math.max(...shown));
}

export function lineChartAxisPicks(count: number, width: number) {
  if (!width || count === 0) {
    return [];
  }

  const stride = Math.ceil(count / Math.max(2, Math.floor(width / CHART.line.axisSpacing)));

  return Array.from({ length: count }, (_, index) => count - 1 - index).filter((_, rank) => rank % stride === 0).reverse();
}
