'use client';

import { ORPCError } from '@orpc/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ArtifactsLink } from '@/components/artifacts/artifacts-link';
import { ArtifactsPasscode } from '@/components/artifacts/artifacts-passcode';
import { ArtifactsSharing } from '@/components/artifacts/artifacts-sharing';
import { ArtifactsVersions } from '@/components/artifacts/artifacts-versions';
import { ArtifactsView } from '@/components/artifacts/artifacts-view';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Page, PageHeader } from '@/components/ui/page';
import { Skeleton } from '@/components/ui/skeleton';
import { useToastStack } from '@/components/ui/toast-stack';
import { rpc } from '@/rpc/rpc.client';
import { artifactsStoreCreate } from '@/services/artifacts/artifacts.client';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import { datesFormatTime } from '@/utils/dates.utils';
import FileX from '~icons/lucide/file-x';
import Lock from '~icons/lucide/lock';

interface ArtifactsPageProps {
  id: string;
}

export function ArtifactsPage({ id }: ArtifactsPageProps) {
  const queryClient = useQueryClient();
  const { toast } = useToastStack();
  const [passcode, setPasscode] = useState<string>();
  const input = { id, passcode };

  const view = useQuery(rpc.artifacts.view.queryOptions({
    input,
    retry: false,
    placeholderData: (previous) => previous,
  }));

  const code = view.error instanceof ORPCError ? String(view.error.code) : null;
  const loaded = view.data !== undefined;

  const store = artifactsStoreCreate({
    queryClient,
    input,
    onError: () => toast({
      type: 'error',
      title: 'Couldn\'t save your change',
      description: 'The page changed meanwhile; it shows the latest now.',
    }),
  });

  useEffect(() => {
    if (!loaded) {
      return;
    }

    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      const url = new URL(`${ARTIFACTS.livePath}${id}`, window.location.href);

      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

      if (passcode) {
        url.searchParams.set('passcode', passcode);
      }

      socket = new WebSocket(url);
      socket.addEventListener('message', () => void queryClient.invalidateQueries({ queryKey: rpc.artifacts.key() }));
      socket.addEventListener('close', (event) => {
        if (event.code !== 4404 && event.code !== 1000) {
          retry = setTimeout(connect, 3000);
        }
      });
    };

    connect();

    return () => {
      clearTimeout(retry);
      socket?.close(1000);
    };
  }, [id, passcode, loaded, queryClient]);

  if (code === 'ARTIFACT_PASSCODE_REQUIRED' || code === 'ARTIFACT_PASSCODE_WRONG' || (passcode && !view.data)) {
    return (
      <Page className="flex-1 justify-center">
        <ArtifactsPasscode
          pending={view.isFetching}
          wrong={code === 'ARTIFACT_PASSCODE_WRONG'}
          onSubmit={setPasscode}
        />
      </Page>
    );
  }

  if (code === 'ARTIFACT_SIGN_IN_REQUIRED') {
    return (
      <Page className="flex-1 justify-center">
        <EmptyState
          action={(
            <Button asChild size="sm">
              <a href="/">Sign in</a>
            </Button>
          )}
          description="Only its owner can open this artifact. Sign in, then open the link again."
          icon={<Lock />}
          title="This artifact is private"
        />
      </Page>
    );
  }

  if (!view.data) {
    return view.isPending ? (
      <Page className="mx-auto w-full max-w-5xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </Page>
    ) : (
      <Page className="flex-1 justify-center">
        <EmptyState
          description="The link may be wrong, or the artifact was deleted."
          icon={<FileX />}
          title="Artifact not found"
        />
      </Page>
    );
  }

  const { artifact, owner } = view.data;

  return (
    <Page className="mx-auto w-full max-w-5xl">
      <PageHeader
        actions={owner ? (
          <>
            <ArtifactsSharing
              id={artifact.id}
              title={artifact.title}
              url={artifact.url}
              version={artifact.version}
              visibility={artifact.visibility}
            />
            <ArtifactsLink
              id={artifact.id}
              title={artifact.title}
              url={artifact.url}
            />
            <ArtifactsVersions id={artifact.id} version={artifact.version} />
          </>
        ) : null}
        description={<span suppressHydrationWarning>{`Updated ${datesFormatTime(artifact.updatedAt)}`}</span>}
        media={<span aria-hidden="true" className="text-2xl">{artifact.emoji}</span>}
        title={artifact.title}
      />
      <ArtifactsView
        spec={artifact.spec}
        store={store}
        title={artifact.title}
      />
    </Page>
  );
}
