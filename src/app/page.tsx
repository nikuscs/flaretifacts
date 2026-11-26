import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { Hydrate } from '@/components/hydrate/hydrate';
import { rpcServer } from '@/rpc/rpc.server';

export default function Page() {
  return (
    <Hydrate prefetch={(queryClient) => [queryClient.prefetchQuery(rpcServer.artifacts.list.queryOptions())]}>
      <DashboardPage />
    </Hydrate>
  );
}
