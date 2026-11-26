import { createORPCClient, ORPCError } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createHydrationOptions, createTanstackQueryUtils } from '@orpc/tanstack-query';
import { defaultShouldDehydrateQuery, dehydrate, QueryClient } from '@tanstack/react-query';
import type { rpcContract } from '@/types/rpc.types';
import type { ContractRouterClient } from '@orpc/contract';

export const rpc = createTanstackQueryUtils<ContractRouterClient<typeof rpcContract>>(createORPCClient(new RPCLink({
  url: '/rpc',
  origin: () => window.location.origin,
})));

export function rpcQueryClientCreate() {
  const hydration = createHydrationOptions();

  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
      dehydrate: {
        ...hydration.dehydrate,
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === 'pending' || query.state.status === 'error',
      },
      hydrate: hydration.hydrate,
    },
  });
}

function rpcErrorPlain(error: Error) {
  const json = error instanceof ORPCError ? error.toJSON() : { defined: false, code: 'UNEXPECTED_ERROR', message: error.message, data: {} };

  return { name: 'ORPCError', ...json };
}

export function rpcDehydrate(queryClient: QueryClient) {
  const state = dehydrate(queryClient);

  return {
    ...state,
    queries: state.queries.map((query) => (query.state.error ? { ...query, state: { ...query.state, error: rpcErrorPlain(query.state.error) } } : query)),
  };
}
