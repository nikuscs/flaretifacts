import { cn } from 'cn';
import type { ReactNode } from 'react';

interface AvatarGroupItem {
  key: string;
  label: string;
  avatar: ReactNode;
}

interface AvatarGroupProps {
  items: AvatarGroupItem[];
  max?: number;
  label: string;
  more?: boolean;
  className?: string;
}

function AvatarGroup({ items, max = 4, label, more = true, className }: AvatarGroupProps) {
  const visible = items.slice(0, max);
  const overflow = more ? items.length - visible.length : 0;

  return (
    <span aria-label={label} className={cn('group/avatars inline-flex items-center pl-1.5', className)} data-slot="avatar-group">
      {visible.map((item) => (
        <span className="group/avatar relative -ml-1.5 inline-flex rounded-full ring-2 ring-card transition-transform duration-200 hover:z-10 hover:-translate-y-0.5" key={item.key}>
          {item.avatar}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 hidden -translate-x-1/2 rounded-full bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background transition transition-discrete duration-150 group-hover/avatar:block starting:translate-y-0.5 starting:opacity-0"
          >
            {item.label}
          </span>
        </span>
      ))}
      {overflow > 0 ? (
        <span className="relative -ml-1.5 grid size-6 place-items-center rounded-full border bg-muted text-xs font-medium text-foreground/80 tabular-nums ring-2 ring-card">
          {`+${overflow}`}
        </span>
      ) : null}
    </span>
  );
}

export { AvatarGroup };
export type { AvatarGroupItem };
