import type { ArtifactsStore } from '@/services/artifacts/artifacts-store.server';
import type { AssetsBucket } from '@/types/assets.types';
import type { UsersIdentity } from '@/types/users.types';

export interface Deps {
  artifactsStore: () => DurableObjectStub<ArtifactsStore>;
  artifactsPage: (path: string, accessToken: string | null) => Promise<Response>;
  assetsBucket: AssetsBucket;
  appOrigin: string;
  user: UsersIdentity | null;
  userToken: string | null;
}
