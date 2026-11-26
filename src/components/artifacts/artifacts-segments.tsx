'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import type { ArtifactsBlocksIcon } from '@/types/artifacts-blocks.types';

interface ArtifactsSegmentsOption {
  value: string;
  label: string;
  icon?: ArtifactsBlocksIcon;
  emoji?: string;
  count?: number;
}

interface ArtifactsSegmentsProps {
  label: string;
  value: string;
  options: ArtifactsSegmentsOption[];
  onValue: (value: string) => void;
}

export function ArtifactsSegments({ label, value, options, onValue }: ArtifactsSegmentsProps) {
  return (
    <ToggleGroup
      aria-label={label}
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) {
          onValue(next);
        }
      }}
    >
      {options.map((option) => {
        const Icon = option.icon ? ARTIFACTS_UI.icons[option.icon] : null;

        return (
          <ToggleGroupItem key={option.value} value={option.value}>
            {Icon ? <Icon aria-hidden="true" /> : null}
            {option.emoji ? <span aria-hidden="true">{option.emoji}</span> : null}
            {option.label}
            {option.count === undefined ? null : <span className="rounded-md bg-muted px-1.5 text-xs leading-4.5 font-medium text-muted-foreground tabular-nums">{option.count}</span>}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
