import { cn } from 'cn';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  size?: 'default' | 'sm';
  className?: string;
}

function EmptyState({ icon, title, description, action, size = 'default', className }: EmptyStateProps) {
  const small = size === 'sm';

  return (
    <div className={cn('flex w-full flex-col items-center px-5 text-center', small ? 'py-5' : 'py-10', className)} data-slot="empty-state">
      <div
        aria-hidden="true"
        className={cn(
          'grid place-items-center rounded-(--radius-panel) border bg-muted text-foreground/80 [&_svg]:stroke-[1.75]',
          small ? 'size-9 [&_svg]:size-4.5' : 'size-12 [&_svg]:size-6',
        )}
      >
        {icon}
      </div>
      <h2 className={cn('leading-tight font-medium', small ? 'mt-3 text-sm' : 'mt-5 text-base')}>{title}</h2>
      <p className={cn('max-w-72 text-sm leading-snug text-balance text-foreground/80', small ? 'mt-1' : 'mt-2')}>{description}</p>
      {action ? <div className={cn('flex flex-wrap justify-center gap-2', small ? 'mt-3' : 'mt-5')}>{action}</div> : null}
    </div>
  );
}

export { EmptyState };
