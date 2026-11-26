import { ArtifactsChartHeader } from '@/components/artifacts/artifacts-chart-header';
import { LineChart } from '@/components/ui/line-chart';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsLineChartProps extends ArtifactsBlocksProps<'LineChart'> {
  area?: boolean;
}

export function ArtifactsLineChart({ area = false, data, x, series, title, value, change, caption }: ArtifactsLineChartProps) {
  return (
    <div className="grid min-w-0 gap-4">
      <ArtifactsChartHeader
        caption={caption}
        change={change}
        title={title}
        value={value}
      />
      <LineChart
        area={area}
        data={data}
        label={title ?? series.map((line) => line.label).join(', ')}
        series={series}
        x={x}
      />
    </div>
  );
}
