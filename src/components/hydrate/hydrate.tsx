import { ORPCError } from '@orpc/client';
import { HydrationBoundary } from '@tanstack/react-query';
import { rpcDehydrate, rpcQueryClientCreate } from '@/rpc/rpc.client';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

interface HydrateProps {
  records?: (queryClient: QueryClient) => Promise<object>[];
  missing?: ReactNode;
  prefetch?: (queryClient: QueryClient) => Promise<void>[];
  stream?: (queryClient: QueryClient) => Promise<void>[];
  children: ReactNode;
}

export async function Hydrate({ records, missing = null, prefetch, stream, children }: HydrateProps) {
  const queryClient = rpcQueryClientCreate();

  const hydrateRecordFound = async (record: Promise<object>) => {
    try {
      await record;

      return true;
    } catch (error) {
      if (error instanceof ORPCError && (error.code === 'BAD_REQUEST' || String(error.code).endsWith('_NOT_FOUND'))) {
        return false;
      }

      throw error;
    }
  };

  const found = await Promise.all((records?.(queryClient) ?? []).map(hydrateRecordFound));

  if (records && !found.some(Boolean)) {
    return missing;
  }

  void Promise.all(stream?.(queryClient) ?? []);
  await Promise.all(prefetch?.(queryClient) ?? []);

  return <HydrationBoundary state={rpcDehydrate(queryClient)}>{children}</HydrationBoundary>;
}
