'use client';

import { ArtifactsDataTableOptions } from '@/components/artifacts/artifacts-data-table-options';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ChevronDown from '~icons/lucide/chevron-down';
import type { ArtifactsBlocksDataTableFacet } from '@/types/artifacts-blocks.types';

interface ArtifactsDataTableFilterProps {
  facet: ArtifactsBlocksDataTableFacet;
  onPick: (values: string[]) => void;
}

export function ArtifactsDataTableFilter({ facet, onPick }: ArtifactsDataTableFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="lg"
          variant={facet.picked.length > 0 ? 'secondary' : 'outline'}
        >
          {facet.label}
          {facet.picked.length > 0 ? <span className="text-muted-foreground tabular-nums">{`· ${facet.picked.length}`}</span> : null}
          <ChevronDown
            aria-hidden="true"
            className="-mr-1 size-3.5 text-muted-foreground"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-1.5"
      >
        <ArtifactsDataTableOptions
          facet={facet}
          onPick={onPick}
        />
      </PopoverContent>
    </Popover>
  );
}
