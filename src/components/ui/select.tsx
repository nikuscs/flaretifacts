'use client';

import { cva } from 'class-variance-authority';
import { cn } from 'cn';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Select as SelectPrimitive } from 'radix-ui';
import { useState } from 'react';
import { MOTION } from '@/constants/motion.constants';
import Check from '~icons/lucide/check';
import ChevronDown from '~icons/lucide/chevron-down';
import ChevronUp from '~icons/lucide/chevron-up';
import type { VariantProps } from 'class-variance-authority';
import type { Variants } from 'motion/react';

interface SelectOption<Value extends string> {
  value: Value;
  label: string;
  disabled?: boolean;
}

const selectTriggerVariants = cva(
  'group/select relative flex w-full min-w-0 cursor-pointer items-center justify-between text-left transition-colors outline-none aria-invalid:border-destructive/60 data-disabled:cursor-not-allowed data-disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'h-(--control-height-sm) gap-3 rounded-(--radius-control) border bg-card px-3 text-sm hover:border-(--border-strong) hover:bg-muted focus-visible:border-(--border-strong) data-[state=open]:border-(--border-strong) data-[state=open]:bg-muted',
        field: 'h-8 gap-2 rounded-lg border border-transparent bg-foreground/4 px-2 text-sm hover:border-border hover:bg-card focus-visible:border-(--border-strong) focus-visible:bg-card data-disabled:bg-transparent data-disabled:opacity-100 data-[state=open]:border-(--border-strong) data-[state=open]:bg-card',
        cell: 'h-7 gap-1 rounded-md border border-transparent px-1.5 text-xs hover:border-border focus-visible:border-(--border-strong) data-disabled:opacity-100 data-[state=open]:border-(--border-strong) data-[state=open]:bg-card',
        segment: 'h-[calc(var(--control-height-sm)-2px)] w-auto gap-2 px-3.5 text-sm font-medium first:rounded-l-(--radius-control) last:rounded-r-(--radius-control) hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring/50 data-[state=open]:bg-muted',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

interface SelectProps<Value extends string> extends VariantProps<typeof selectTriggerVariants> {
  options: SelectOption<Value>[];
  value: Value | null;
  onValueChange: (value: Value) => void;
  label: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
}

const selectValueRoll: Variants = {
  enter: (direction: number) => ({ opacity: 0, y: `${direction * 0.35}em`, filter: `blur(${MOTION.blur.soft}px)` }),
  center: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: MOTION.duration.standard, ease: [...MOTION.ease.enter] } },
  exit: (direction: number) => ({ opacity: 0, y: `${direction * -0.3}em`, filter: `blur(${MOTION.blur.subtle}px)`, transition: { duration: MOTION.duration.fast, ease: [...MOTION.ease.standard] } }),
};

const selectValueFade: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: MOTION.duration.instant } },
  exit: { opacity: 0, transition: { duration: MOTION.duration.instant } },
};

function Select<Value extends string>({ options, value, onValueChange, label, id, placeholder = 'Choose', disabled, invalid, variant }: SelectProps<Value>) {
  const reduced = useReducedMotion();
  const index = options.findIndex((option) => option.value === value);
  const shown = options[index]?.label ?? placeholder;
  const [previous, setPrevious] = useState({ index, direction: 1 });

  if (previous.index !== index) {
    setPrevious({ index, direction: index > previous.index ? 1 : -1 });
  }

  return (
    <SelectPrimitive.Root
      disabled={disabled}
      value={value ?? ''}
      onValueChange={(next) => {
        const option = options.find((candidate) => candidate.value === next);

        if (option) {
          onValueChange(option.value);
        }
      }}
    >
      <SelectPrimitive.Trigger
        aria-invalid={invalid ? true : undefined}
        aria-label={label}
        className={cn(selectTriggerVariants({ variant }))}
        data-slot="select-trigger"
        id={id}
      >
        <span className="sr-only">
          <SelectPrimitive.Value placeholder={placeholder} />
        </span>
        <span aria-hidden="true" className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)]">
          <AnimatePresence custom={previous.direction} initial={false}>
            <motion.span
              animate="center"
              className={cn('col-start-1 row-start-1 truncate', index === -1 && 'text-muted-foreground')}
              custom={previous.direction}
              exit="exit"
              initial="enter"
              key={value ?? 'placeholder'}
              variants={reduced ? selectValueFade : selectValueRoll}
            >
              {shown}
            </motion.span>
          </AnimatePresence>
        </span>
        <SelectPrimitive.Icon className="inline-flex shrink-0 text-muted-foreground transition-transform duration-240 group-data-disabled/select:invisible group-data-[state=open]/select:rotate-180">
          <ChevronDown className="size-4 [&_g]:stroke-[1.75]" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-50 max-h-(--radix-select-content-available-height) w-max max-w-[min(24rem,calc(100vw-20px))] min-w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin) overflow-hidden rounded-[calc(var(--radius-control)+2px)] border bg-(--surface-raised) p-1.5 text-popover-foreground shadow-2xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-98 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-97"
          collisionPadding={12}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.ScrollUpButton className="grid h-7 place-items-center text-muted-foreground">
            <ChevronUp className="size-4 [&_g]:stroke-[1.75]" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="py-0.5">
            {options.map((option) => (
              <SelectPrimitive.Item
                className="relative flex min-h-9 cursor-default items-center rounded-[calc(var(--radius-control)-4px)] pr-8.5 pl-3 text-sm whitespace-nowrap outline-none select-none data-disabled:opacity-45 data-highlighted:bg-muted"
                disabled={option.disabled}
                key={option.value}
                value={option.value}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5 inline-flex items-center">
                  <Check className="size-4 [&_g]:stroke-[1.75]" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="grid h-7 place-items-center text-muted-foreground">
            <ChevronDown className="size-4 [&_g]:stroke-[1.75]" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { Select };
