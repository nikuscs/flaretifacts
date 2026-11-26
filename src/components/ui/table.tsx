'use client';

import { cn } from 'cn';
import * as React from 'react';

function Table({ className, size = 'default', ...props }: React.ComponentProps<'table'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="table-container"
      className="@container relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        data-size={size}
        className={cn('w-full caption-bottom text-[13px] tabular-nums', className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b-0', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, variant = 'default', ...props }: React.ComponentProps<'tr'> & { variant?: 'default' | 'static' | 'group' | 'panel' }) {
  return (
    <tr
      data-slot="table-row"
      data-variant={variant}
      className={cn(
        'border-b border-border/60 transition-colors last:border-b-0',
        variant === 'default' && 'hover:bg-muted/40 has-aria-expanded:border-b-0 has-aria-expanded:bg-muted/40 data-[state=selected]:bg-muted',
        variant === 'group' && 'bg-muted/50 text-xs font-medium [&>td]:h-9',
        variant === 'panel' && 'bg-muted/40',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, variant = 'default', ...props }: React.ComponentProps<'th'> & { variant?: 'default' | 'action' }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-9 border-y px-4 text-left align-middle text-xs font-normal whitespace-nowrap text-muted-foreground in-data-[size=sm]:h-8 in-data-[size=sm]:px-3 has-[[role=checkbox]]:pr-0 max-sm:px-3 [&>[role=checkbox]]:translate-y-[2px]',
        variant === 'action' && 'w-10 pr-1 pl-0 in-data-[size=sm]:pl-0 max-sm:pr-1 max-sm:pl-0',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, variant = 'default', ...props }: React.ComponentProps<'td'> & { variant?: 'default' | 'empty' | 'action' | 'panel' }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'h-11 px-4 align-middle whitespace-nowrap in-data-[size=sm]:h-10 in-data-[size=sm]:px-3 has-[[role=checkbox]]:pr-0 max-sm:px-3 [&>[role=checkbox]]:translate-y-[2px]',
        variant === 'empty' && 'h-24 text-center text-muted-foreground',
        variant === 'action' && 'w-10 pr-1 pl-0 in-data-[size=sm]:pl-0 max-sm:pr-1 max-sm:pl-0',
        variant === 'panel' && 'h-auto p-0 whitespace-normal in-data-[size=sm]:h-auto in-data-[size=sm]:px-0 max-sm:px-0',
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
