'use client';

import { cn } from 'cn';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';

function ToggleGroup({ className, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      className={cn('inline-flex w-fit max-w-full min-w-0 [scrollbar-width:none] gap-0.5 overflow-x-auto rounded-(--radius-control) border bg-muted p-[3px]', className)}
      data-slot="toggle-group"
      {...props}
    />
  );
}

function ToggleGroupItem({ className, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        'relative inline-flex h-[calc(var(--control-height-sm)-8px)] shrink-0 cursor-pointer items-center gap-1.5 rounded-[calc(var(--radius-control)-4px)] border border-transparent px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-standard) outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40 data-[state=on]:border-border data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-(--shadow-resting) motion-reduce:transition-none [&_svg]:size-3.5 [&_svg]:shrink-0',
        className,
      )}
      data-slot="toggle-group-item"
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
