'use client';

import { ArtifactsChartHeader } from '@/components/artifacts/artifacts-chart-header';
import { ActivityHeatmap } from '@/components/ui/activity-heatmap';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { datesRange } from '@/utils/dates.utils';

interface ArtifactsHeatmapProps {
  days: { date: string; value: number }[];
  title?: string;
  caption?: string;
}

export function ArtifactsHeatmap({ days, title, caption }: ArtifactsHeatmapProps) {
  const dates = days.map((day) => day.date).toSorted();
  const first = dates.at(0);
  const last = dates.at(-1);

  const period = first && last ? datesRange(new Date(`${first}T00:00:00Z`), new Date(`${last}T00:00:00Z`)) : 'this period';

  return (
    <div className="grid min-w-0 gap-3">
      <ArtifactsChartHeader title={title} />
      <ActivityHeatmap
        caption={caption}
        days={days.map((day) => ({ date: day.date, count: day.value }))}
        label={title ?? 'Activity'}
        period={period}
        unit={ARTIFACTS_UI.heatmapUnit}
      />
    </div>
  );
}
