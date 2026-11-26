'use client';

import { match, P } from 'ts-pattern';
import { MetricCard } from '@/components/ui/metric-card';
import { CHART } from '@/constants/chart.constants';
import { chartAmount } from '@/utils/chart.utils';

interface ArtifactsMetricProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  change?: string;
  context?: string;
  tone?: 'up' | 'down';
}

export function ArtifactsMetric({ label, value, prefix = '', suffix = '', change, context, tone }: ArtifactsMetricProps) {
  const number = new Intl.NumberFormat(CHART.locale, { maximumFractionDigits: 2 });

  const shown = match(value)
    .with(P.number, (amount) => ({ amount, formatValue: (current: number) => `${prefix}${number.format(current)}${suffix}` }))
    .with(P.string, (text) => ({ amount: Number.isFinite(chartAmount(text)) ? chartAmount(text) : 0, formatValue: () => `${prefix}${text}${suffix}` }))
    .exhaustive();

  return (
    <MetricCard
      change={change}
      context={context}
      formatValue={shown.formatValue}
      label={label}
      tone={tone}
      value={shown.amount}
    />
  );
}
