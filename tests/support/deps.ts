import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import { testArtifactsNamespaceCreate } from './durable-object';
import { testAssetsBucketCreate } from './r2';
import type { Deps } from '@/types/deps.types';

export function testDepsCreate() {
  const { namespace, sockets } = testArtifactsNamespaceCreate();
  const pages: { path: string; accessToken: string | null }[] = [];
  const { bucket, objects } = testAssetsBucketCreate();

  const deps: Deps = {
    artifactsStore: () => namespace.get(namespace.idFromName(ARTIFACTS.storeName)),
    artifactsPage: async (path, accessToken) => {
      pages.push({ path, accessToken });

      return new Response('<html><head><script type="module">boot()</script><link rel="stylesheet" href="/assets/app.css"></head><body><h1>Plan</h1><img src="/favicon.ico"></body></html>');
    },
    assetsBucket: bucket,
    appOrigin: 'https://artifacts.test',
    user: { login: 'owner@example.com', kind: 'person' },
    userToken: 'owner-token',
  };

  return { deps, sockets, pages, objects, anonymous: { ...deps, user: null, userToken: null } };
}
