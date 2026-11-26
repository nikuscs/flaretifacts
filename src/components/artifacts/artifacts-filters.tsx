'use client';

import { useBoundProp } from '@json-render/react';
import { ArtifactsSegments } from '@/components/artifacts/artifacts-segments';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsFiltersProps {
  block: ArtifactsBlocksProps<'Filters'>;
  binding?: string;
}

export function ArtifactsFilters({ block: { value, options, all = 'All', label = 'Filter' }, binding }: ArtifactsFiltersProps) {
  const [bound, setBound] = useBoundProp(value, binding);

  return (
    <ArtifactsSegments
      label={label}
      options={[{ value: 'all', label: all }, ...options.map((option) => ({ ...option, label: option.label ?? option.value }))]}
      value={bound === undefined || bound === '' ? 'all' : bound}
      onValue={setBound}
    />
  );
}
