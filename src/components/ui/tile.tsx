import { cva } from 'class-variance-authority';
import { cn } from 'cn';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

const tileVariants = cva('grid shrink-0 place-items-center border bg-muted leading-none text-foreground/80 select-none [&_svg]:size-4', {
  variants: {
    round: {
      true: 'rounded-full',
      false: 'rounded-lg',
    },
    lettering: {
      true: 'font-semibold uppercase',
      false: '',
    },
    size: {
      sm: 'size-6 text-xs',
      md: 'size-7 text-sm',
      lg: 'size-8 text-sm',
    },
  },
  compoundVariants: [
    { lettering: true, size: 'sm', className: 'text-[8px] tracking-wide' },
    { lettering: true, size: 'md', className: 'text-[9px] tracking-wide' },
    { lettering: true, size: 'lg', className: 'text-[11px] tracking-wide' },
  ],
  defaultVariants: { round: false, lettering: false, size: 'md' },
});

function Tile({ className, round, lettering, size, ...props }: ComponentProps<'span'> & VariantProps<typeof tileVariants>) {
  return (
    <span
      aria-hidden="true"
      className={cn(tileVariants({
        round,
        lettering,
        size,
      }), className)}
      data-slot="tile"
      {...props}
    />
  );
}

export { Tile };
