import type { ReactNode } from 'react';

interface ArtifactsRowTextProps {
  description?: string;
  children: ReactNode;
}

export function ArtifactsRowText({ description, children }: ArtifactsRowTextProps) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="wrap-break-word">{children}</span>
      {description ? <span className="text-xs text-pretty text-muted-foreground">{description}</span> : null}
    </span>
  );
}
