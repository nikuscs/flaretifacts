import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { coreAuthVerify } from '@/core/core.auth';
import type { JWTPayload } from 'jose';

describe('core auth', () => {
  const access = { teamDomain: 'example.cloudflareaccess.com', audience: 'aud' };

  const tokenOf = async (payload: JWTPayload) => {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const jwk = { ...(await exportJWK(publicKey)), kid: 'key', alg: 'RS256' };

    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ keys: [jwk] })));

    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid: 'key' })
      .setIssuer(`https://${access.teamDomain}`)
      .setAudience(access.audience)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects a request without an Access token', async () => {
    await expect(coreAuthVerify({ ...access, token: null })).resolves.toBeNull();
  });

  it('rejects a token that is not a JWT', async () => {
    await expect(coreAuthVerify({ ...access, token: 'not-a-jwt' })).resolves.toBeNull();
  });

  it('reads a person from the verified email claim', async () => {
    const token = await tokenOf({ email: 'Ana@Example.com', sub: 'user-id' });

    await expect(coreAuthVerify({ ...access, token })).resolves.toEqual({ login: 'ana@example.com', kind: 'person' });
  });

  it('reads a service token from its common name, whose sub is empty', async () => {
    const token = await tokenOf({ common_name: 'abc123.access', sub: '' });

    await expect(coreAuthVerify({ ...access, token })).resolves.toEqual({ login: 'abc123.access', kind: 'service' });
  });

  it('rejects a valid token with neither claim, and one for another audience', async () => {
    const anonymous = await tokenOf({ sub: 'user-id' });

    await expect(coreAuthVerify({ ...access, token: anonymous })).resolves.toBeNull();

    const token = await tokenOf({ email: 'ana@example.com' });
    const otherApp = { ...access, audience: 'other' };

    await expect(coreAuthVerify({ ...otherApp, token })).resolves.toBeNull();
  });
});
