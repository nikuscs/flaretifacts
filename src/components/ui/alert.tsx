import { cn } from 'cn';
import CircleAlert from '~icons/lucide/circle-alert';
import CircleCheck from '~icons/lucide/circle-check';
import Info from '~icons/lucide/info';
import TriangleAlert from '~icons/lucide/triangle-alert';
import X from '~icons/lucide/x';
import type { ReactNode } from 'react';

interface AlertProps {
  tone: 'info' | 'success' | 'warning' | 'danger';
  title: ReactNode;
  children?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

function Alert({ tone, title, children, onDismiss, className }: AlertProps) {
  const icons = {
    info: <Info />,
    success: <CircleCheck />,
    warning: <TriangleAlert />,
    danger: <CircleAlert />,
  };

  return (
    <div
      className={cn('flex min-w-0 items-start gap-3 rounded-(--radius-control) border bg-card p-4 shadow-(--shadow-resting)', className)}
      data-slot="alert"
      data-tone={tone}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-px grid size-4.5 shrink-0 place-items-center [&_svg]:size-4.5',
          tone === 'info' && 'text-info',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'danger' && 'text-destructive',
        )}
      >
        {icons[tone]}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {children ? <div className="mt-1 text-xs text-muted-foreground">{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          aria-label="Dismiss"
          className="-my-1.25 -mr-1.5 grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          type="button"
          onClick={onDismiss}
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

export { Alert };
