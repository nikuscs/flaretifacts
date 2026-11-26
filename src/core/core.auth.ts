import { createRemoteJWKSet, jwtVerify } from 'jose';
import { coreAuthClaims } from '@/types/core.types';
import type { CoreAuthVerifyParams } from '@/types/core.types';
import type { UsersIdentity } from '@/types/users.types';

export async function coreAuthVerify(params: CoreAuthVerifyParams): Promise<UsersIdentity | null> {
  if (!params.token) {
    return null;
  }

  try {
    const issuer = `https://${params.teamDomain}`;
    const keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(params.token, keys, { issuer, audience: params.audience });
    const claims = coreAuthClaims.parse(payload);

    if (claims.email) {
      return { login: claims.email, kind: 'person' };
    }

    return claims.common_name ? { login: claims.common_name, kind: 'service' } : null;
  } catch {
    return null;
  }
}
