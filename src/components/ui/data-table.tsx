'use client';

import { cn } from 'cn';
import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ArrowDown from '~icons/lucide/arrow-down';
import ArrowUp from '~icons/lucide/arrow-up';
import ChevronDown from '~icons/lucide/chevron-down';
import ChevronLeft from '~icons/lucide/chevron-left';
import ChevronRight from '~icons/lucide/chevron-right';
import ChevronsUpDown from '~icons/lucide/chevrons-up-down';
import Search from '~icons/lucide/search';
import type { ComponentProps, ReactNode } from 'react';

function DataTable({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('relative min-w-0 overflow-hidden rounded-(--radius-panel) border bg-card', className)} data-slot="data-table" {...props} />;
}

interface DataTableHeaderProps {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
}

function DataTableHeader({ title, description, action }: DataTableHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3" data-slot="data-table-header">
      {title || description ? (
        <div className="flex min-w-0 flex-col gap-0.5">
          {title ? <h3 className="text-base font-medium">{title}</h3> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      {action}
    </div>
  );
}

interface DataTableSearchProps extends Omit<ComponentProps<'input'>, 'onChange'> {
  onSearch: (value: string) => void;
}

function DataTableSearch({ className, onSearch, ...props }: DataTableSearchProps) {
  return (
    <label className={cn('flex h-(--control-height-sm) w-full max-w-72 items-center gap-2 rounded-full border border-input bg-card px-3 text-muted-foreground focus-within:text-foreground sm:ml-auto', className)}>
      <Search aria-hidden="true" className="size-4 shrink-0" />
      <input
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        placeholder="Search"
        type="search"
        onChange={(event) => onSearch(event.target.value)}
        {...props}
      />
    </label>
  );
}

interface DataTableSortProps {
  label: string;
  direction: 'asc' | 'desc' | null;
  onSort: () => void;
}

function DataTableSort({ label, direction, onSort }: DataTableSortProps) {
  const Icon = { asc: ArrowUp, desc: ArrowDown, none: ChevronsUpDown }[direction ?? 'none'];

  return (
    <button
      className={cn('group/sort -mx-1.5 inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-1.5 transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50', direction && 'text-foreground')}
      type="button"
      onClick={onSort}
    >
      {label}
      <Icon aria-hidden="true" className={cn('size-3.5 shrink-0 transition-opacity', !direction && 'opacity-0 group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60')} />
    </button>
  );
}

interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  pageSizes: number[];
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}

function DataTablePagination({ page, pageSize, pageSizes, total, onPage, onPageSize }: DataTablePaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  const shown = Array.from({ length: pages }, (_, index) => index + 1).filter((value) => value === 1 || value === pages || Math.abs(value - page) <= 1);
  const sizes = [...new Set([pageSize, ...pageSizes])].toSorted((a, b) => a - b);

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t px-5 py-2.5 text-sm" data-slot="data-table-pagination">
      <div className="flex items-center gap-3">
        <span className="whitespace-nowrap text-muted-foreground tabular-nums">
          <span className="text-foreground">{`${first}–${last}`}</span>
          {` of ${total}`}
        </span>
        {total > (pageSizes[0] ?? 0) ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border border-transparent px-2 text-xs whitespace-nowrap text-muted-foreground tabular-nums transition-colors outline-none hover:border-border hover:text-foreground focus-visible:border-(--border-strong) data-[state=open]:border-(--border-strong) data-[state=open]:text-foreground">
              {`${pageSize} per page`}
              <ChevronDown aria-hidden="true" className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup value={String(pageSize)} onValueChange={(next) => onPageSize(Number(next))}>
                {sizes.map((size) => <DropdownMenuRadioItem className="tabular-nums" key={size} value={String(size)}>{size}</DropdownMenuRadioItem>)}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {pages > 1 ? (
        <nav aria-label="Pages" className="ml-auto flex items-center gap-0.5">
          <Button aria-label="Previous page" disabled={page === 1} size="icon" variant="ghost" onClick={() => onPage(page - 1)}>
            <ChevronLeft />
          </Button>
          {shown.map((value, index) => (
            <Fragment key={value}>
              {index > 0 && value - shown[index - 1] > 1 ? <span aria-hidden="true" className="hidden size-8 place-items-center text-xs text-muted-foreground sm:grid">…</span> : null}
              <button
                aria-current={value === page ? 'page' : undefined}
                className={cn('hidden size-8 cursor-pointer place-items-center rounded-full border border-transparent text-xs tabular-nums transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:grid', value === page ? 'border-border text-foreground' : 'text-foreground/80 hover:bg-accent hover:text-foreground')}
                type="button"
                onClick={() => onPage(value)}
              >
                {value}
              </button>
            </Fragment>
          ))}
          <span className="px-2 text-xs text-muted-foreground tabular-nums sm:hidden">{`${page} / ${pages}`}</span>
          <Button aria-label="Next page" disabled={page === pages} size="icon" variant="ghost" onClick={() => onPage(page + 1)}>
            <ChevronRight />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}

export { DataTable, DataTableHeader, DataTablePagination, DataTableSearch, DataTableSort };
