import { env } from 'cloudflare:workers';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import type { Deps } from '@/types/deps.types';

export const deps: Deps = {
  artifactsStore: () => env.ARTIFACTS.get(env.ARTIFACTS.idFromName(ARTIFACTS.storeName)),
  artifactsPage: (path, accessToken) => env.SELF.fetch(new Request(new URL(path, ARTIFACTS.selfOrigin), { headers: accessToken ? { 'cf-access-jwt-assertion': accessToken } : {} })),
  assetsBucket: env.ASSETS_BUCKET,
  appOrigin: env.APP_ORIGIN,
  user: null,
  userToken: null,
};
