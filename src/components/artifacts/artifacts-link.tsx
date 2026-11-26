'use client';

import { useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import ExternalLink from '~icons/lucide/external-link';

interface ArtifactsLinkProps {
  id: string;
  title: string;
  url: string;
  open?: boolean;
}

export function ArtifactsLink({ id, title, url, open = false }: ArtifactsLinkProps) {
  const path = `${ARTIFACTS.viewPath}${id}`;
  const link = useSyncExternalStore(() => () => undefined, () => new URL(path, window.location.href).href, () => url);

  return (
    <div className="flex items-center justify-end gap-1">
      <CopyButton
        className="my-0"
        label="link"
        value={link}
      />
      {open ? (
        <Button
          asChild
          size="icon-xs"
          title="Open in a new tab"
          variant="ghost"
        >
          <a
            aria-label={`Open ${title} in a new tab`}
            href={path}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink />
          </a>
        </Button>
      ) : null}
    </div>
  );
}
