'use client';

import { ArtifactsDataTableFilter } from '@/components/artifacts/artifacts-data-table-filter';
import { ArtifactsDataTableOptions } from '@/components/artifacts/artifacts-data-table-options';
import { ArtifactsSegments } from '@/components/artifacts/artifacts-segments';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import ListFilter from '~icons/lucide/list-filter';
import XIcon from '~icons/lucide/x';
import type { ArtifactsBlocksDataTableFacet } from '@/types/artifacts-blocks.types';
import type { ReactNode } from 'react';

interface ArtifactsDataTableToolbarProps {
  facets: ArtifactsBlocksDataTableFacet[];
  found: number;
  search: ReactNode;
  action: ReactNode;
  onPick: (key: string, values: string[]) => void;
  onClear: () => void;
}

export function ArtifactsDataTableToolbar({ facets, found, search, action, onPick, onClear }: ArtifactsDataTableToolbarProps) {
  const grouped = facets.length > ARTIFACTS_UI.dataTable.pillsMax;
  const picks = facets.reduce((sum, facet) => sum + facet.picked.length, 0);
  const rows = `${found} ${found === 1 ? 'row' : 'rows'}`;

  const chips = facets.filter((facet) => !facet.single).flatMap((facet) => facet.picked.map((value) => ({
    facet,
    option: facet.options.find((option) => option.value === value) ?? { value, label: value, count: 0 },
  })));

  return (
    <div className="flex flex-col gap-2.5 px-5 pb-3 first:pt-4" data-slot="data-table-toolbar">
      <div className="flex flex-wrap items-center gap-2">
        {search}
        {facets.filter((facet) => facet.single).map((facet) => (
          <ArtifactsSegments
            key={facet.key}
            label={facet.label}
            options={[{ value: 'all', label: 'All', count: facet.total }, ...facet.options]}
            value={facet.picked[0] ?? 'all'}
            onValue={(next) => onPick(facet.key, next === 'all' ? [] : [next])}
          />
        ))}
        {grouped ? null : facets.filter((facet) => !facet.single).map((facet) => (
          <ArtifactsDataTableFilter
            facet={facet}
            key={facet.key}
            onPick={(values) => onPick(facet.key, values)}
          />
        ))}
        {grouped ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="lg"
                variant={picks > 0 ? 'secondary' : 'outline'}
              >
                <ListFilter
                  aria-hidden="true"
                  className="-ml-1 text-muted-foreground"
                />
                Filters
                {picks > 0 ? <span className="rounded-full bg-primary px-1.5 text-xs leading-5 text-primary-foreground tabular-nums">{picks}</span> : null}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Filters</DialogTitle>
                <DialogDescription>{`${rows} match`}</DialogDescription>
              </DialogHeader>
              <div className="grid items-start gap-x-4 gap-y-3 sm:grid-cols-2">
                {facets.map((facet) => (
                  <div className="min-w-0 rounded-(--radius-control) border p-1.5" key={facet.key}>
                    <ArtifactsDataTableOptions
                      facet={facet}
                      onPick={(values) => onPick(facet.key, values)}
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                {picks > 0 ? (
                  <Button
                    variant="ghost"
                    onClick={onClear}
                  >
                    Clear all
                  </Button>
                ) : null}
                <DialogClose asChild>
                  <Button>{`Show ${rows}`}</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : null}
        {action}
      </div>
      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map(({ facet, option }) => (
            <button
              aria-label={`Remove ${facet.label}: ${option.label}`}
              className="inline-flex h-7 max-w-full cursor-pointer items-center gap-1.5 rounded-full border bg-muted pr-2 pl-2.5 text-xs transition-colors outline-none hover:border-(--border-strong) focus-visible:ring-3 focus-visible:ring-ring/50"
              key={`${facet.key}:${option.value}`}
              type="button"
              onClick={() => onPick(facet.key, facet.picked.filter((value) => value !== option.value))}
            >
              <span className="text-muted-foreground">{facet.label}</span>
              {option.emoji ? <span aria-hidden="true">{option.emoji}</span> : null}
              <span className="truncate">{option.label}</span>
              <XIcon
                aria-hidden="true"
                className="size-3 shrink-0 text-muted-foreground"
              />
            </button>
          ))}
          <button
            className="cursor-pointer rounded-sm px-1 text-xs text-muted-foreground underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            type="button"
            onClick={onClear}
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}
