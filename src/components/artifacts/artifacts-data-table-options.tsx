'use client';

import { cn } from 'cn';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableSearch } from '@/components/ui/data-table';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import type { ArtifactsBlocksDataTableFacet } from '@/types/artifacts-blocks.types';

interface ArtifactsDataTableOptionsProps {
  facet: ArtifactsBlocksDataTableFacet;
  onPick: (values: string[]) => void;
}

export function ArtifactsDataTableOptions({ facet, onPick }: ArtifactsDataTableOptionsProps) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const listed = needle ? facet.options.filter((option) => option.label.toLowerCase().includes(needle)) : facet.options;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex h-7 items-center justify-between gap-2 px-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{facet.label}</span>
        {facet.picked.length > 0 ? (
          <button
            className="cursor-pointer rounded-sm text-xs text-muted-foreground underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            type="button"
            onClick={() => onPick([])}
          >
            Clear
          </button>
        ) : null}
      </div>
      {facet.options.length >= ARTIFACTS_UI.dataTable.searchFrom ? (
        <DataTableSearch
          aria-label={`Search ${facet.label}`}
          className="mb-1 max-w-none sm:ml-0"
          placeholder={`Search ${facet.label.toLowerCase()}`}
          value={query}
          onSearch={setQuery}
        />
      ) : null}
      <div className="flex max-h-64 flex-col overflow-y-auto">
        {listed.map((option) => {
          const Icon = option.icon ? ARTIFACTS_UI.icons[option.icon] : null;
          const checked = facet.picked.includes(option.value);

          return (
            <label
              className={cn(
                'flex min-h-8 cursor-pointer items-center gap-2.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent',
                option.count === 0 && !checked && 'text-muted-foreground',
              )}
              key={option.value}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(next) => onPick(next === true ? [...facet.picked, option.value] : facet.picked.filter((value) => value !== option.value))}
              />
              {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" /> : null}
              {option.emoji ? <span aria-hidden="true">{option.emoji}</span> : null}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{option.count}</span>
            </label>
          );
        })}
        {listed.length === 0 ? <p className="px-2 py-3 text-sm text-muted-foreground">{`No ${facet.label.toLowerCase()} match “${query.trim()}”`}</p> : null}
      </div>
    </div>
  );
}
