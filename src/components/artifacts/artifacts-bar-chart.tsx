import { ArtifactsChartHeader } from '@/components/artifacts/artifacts-chart-header';
import { BarChart } from '@/components/ui/bar-chart';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsBarChartProps {
  block: ArtifactsBlocksProps<'BarChart'>;
}

export function ArtifactsBarChart({ block: { data, x, series, average, unit, title, value, change, caption } }: ArtifactsBarChartProps) {
  const suffix = unit ? ` ${unit}` : '';

  const bars = data.map((row, index) => ({
    key: String(index),
    label: String(row[x] ?? ''),
    axisLabel: String(row[x] ?? ''),
    values: series.map((line) => Number(row[line.key] ?? 0) || 0),
  }));

  return (
    <div className="grid min-w-0 gap-4">
      <ArtifactsChartHeader
        caption={caption}
        change={change}
        title={title}
        unit={unit}
        value={value}
      />
      <BarChart
        data={bars}
        formatTick={(tick) => ARTIFACTS_UI.formats.tick.format(tick)}
        formatValue={(amount) => `${ARTIFACTS_UI.formats.number.format(amount)}${suffix}`}
        label={title ?? series.map((line) => line.label).join(', ')}
        rest={average ? undefined : { label: 'Total', value: bars.reduce((sum, bar) => sum + (bar.values[0] ?? 0), 0) }}
        series={series.map((line) => ({ label: line.label }))}
      />
    </div>
  );
}
