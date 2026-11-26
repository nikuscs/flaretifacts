import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';

const statusDotVariants = cva('relative inline-block size-2 shrink-0 rounded-full', {
  variants: {
    variant: {
      default: 'bg-muted-foreground',
      success: 'bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--success)_18%,transparent)]',
      warning: 'bg-warning shadow-[0_0_0_3px_color-mix(in_oklab,var(--warning)_18%,transparent)]',
      destructive: 'bg-destructive shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_18%,transparent)]',
    },
  },
  defaultVariants: { variant: 'default' },
});

interface StatusDotProps extends VariantProps<typeof statusDotVariants> {
  label: string;
}

export function StatusDot({ label, variant }: StatusDotProps) {
  return (
    <span className={statusDotVariants({ variant })} data-slot="status-dot" title={label}>
      <span className="sr-only">{label}</span>
    </span>
  );
}
