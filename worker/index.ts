import handler from 'vinext/server/fetch-handler';
import { coreAuthVerify } from '../src/core/core.auth';
import { deps } from '../src/core/core.deps';
import { ARTIFACTS } from '../src/services/artifacts/artifacts.constants';
import { artifactsLive } from '../src/services/artifacts/artifacts.server';
import { assetsServe } from '../src/services/assets/assets.server';
import { ogServe } from '../src/services/og/og.server';
import { USERS } from '../src/services/users/users.constants';
import { usersAccessToken } from '../src/services/users/users.utils';
import { coreDevEnv } from '../src/types/core.types';
import { errorsResultOf } from '../src/utils/errors.utils';

export { ArtifactsStore } from '../src/services/artifacts/artifacts-store.server';

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext) {
    const { pathname, host } = new URL(request.url);
    const devEnv = import.meta.env.DEV ? coreDevEnv.safeParse(env) : null;

    if (devEnv && !devEnv.success) {
      return new Response('Set DEV_USER_EMAIL in .dev.vars to the email local dev signs in as.', { status: 403 });
    }

    const identity = devEnv?.success ? { login: devEnv.data.DEV_USER_EMAIL, kind: 'person' as const } : await coreAuthVerify({
      token: usersAccessToken(request.headers),
      teamDomain: env.ACCESS_TEAM_DOMAIN,
      audience: env.ACCESS_APP_AUDIENCE,
    });

    if (!identity && !ARTIFACTS.publicPaths.some((path) => pathname === path || pathname.startsWith(path))) {
      return new Response('Forbidden', { status: 403 });
    }

    const read = request.method === 'GET' || request.method === 'HEAD';
    const asset = read ? await assetsServe({ ...deps, user: identity }, { pathname }) ?? await ogServe(deps, { pathname, host }) : null;

    if (asset) {
      return asset;
    }

    if (pathname.startsWith(ARTIFACTS.livePath)) {
      try {
        return await artifactsLive({ ...deps, user: identity }, request);
      } catch (error) {
        return Response.json(errorsResultOf(error), { status: 403 });
      }
    }

    const headers = new Headers(request.headers);

    headers.delete(USERS.userHeader);

    if (identity) {
      headers.set(USERS.userHeader, encodeURIComponent(JSON.stringify(identity)));
    }

    const response = handler.fetch(new Request(request, { headers }), env, context);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      context.waitUntil(response);
    }

    return response;
  },
};
