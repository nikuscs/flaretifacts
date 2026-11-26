import { testArtifactsNamespaceCreate } from './durable-object';
import { testAssetsBucketCreate } from './r2';

export { DurableObject } from './base-durable-object';

const testSelfFetch: Env['SELF']['fetch'] = async () => new Response('<html><body>page</body></html>');

export const env = {
  ARTIFACTS: testArtifactsNamespaceCreate().namespace,
  // SAFETY: the app calls only fetch on the self binding.
  SELF: { fetch: testSelfFetch } as Env['SELF'],
  // SAFETY: the app reaches the bucket only through the AssetsBucket methods the fake implements.
  ASSETS_BUCKET: testAssetsBucketCreate().bucket as Env['ASSETS_BUCKET'],
  APP_ORIGIN: 'https://artifacts.test',
  ACCESS_APP_AUDIENCE: 'aud',
  ACCESS_TEAM_DOMAIN: 'example.cloudflareaccess.com',
  DEV_USER_EMAIL: 'owner@example.com',
} satisfies Env;
