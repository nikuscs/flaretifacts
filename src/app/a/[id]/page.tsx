import { headers } from 'next/headers';
import { ArtifactsPage } from '@/components/artifacts/artifacts-page';
import { Hydrate } from '@/components/hydrate/hydrate';
import { deps } from '@/core/core.deps';
import { rpcServer } from '@/rpc/rpc.server';
import { OG } from '@/services/og/og.constants';
import { ogSite } from '@/services/og/og.utils';
import { usersOfRequest } from '@/services/users/users.utils';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const requestHeaders = await headers();
  const user = usersOfRequest(requestHeaders);
  const view = await rpcServer.artifacts.view.call({ id }, { context: { user } }).catch(() => null);
  const shown = view?.artifact.visibility === 'public' || user !== null ? view?.artifact : null;
  const title = shown?.title ?? OG.locked.title;
  const description = shown ? OG.subtitle : OG.locked.subtitle;
  const image = `${deps.appOrigin}/a/${id}/og.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${deps.appOrigin}/a/${id}`,
      siteName: ogSite(deps.appOrigin, requestHeaders.get('host')),
      type: 'website',
      images: [{ url: image, width: OG.width, height: OG.height, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = usersOfRequest(await headers());

  return (
    <Hydrate
      prefetch={(queryClient) => [queryClient.prefetchQuery(rpcServer.artifacts.view.queryOptions({
        input: { id },
        context: { user },
        retry: false,
      }))]}
    >
      <ArtifactsPage id={id} />
    </Hydrate>
  );
}
