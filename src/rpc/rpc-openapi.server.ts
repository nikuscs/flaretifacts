import { SmartCoercionHandlerPlugin } from '@orpc/json-schema';
import { OpenAPIGenerator } from '@orpc/openapi';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { OpenAPIReferenceHandlerPlugin } from '@orpc/openapi/plugins';
import { deps } from '@/core/core.deps';
import { rpcErrorStatusMap, rpcRouter } from '@/rpc/rpc.server';
import { usersAccessToken, usersOfRequest } from '@/services/users/users.utils';

export async function rpcOpenapiHandle(request: Request) {
  const user = usersOfRequest(request.headers);

  const reference = new OpenAPIReferenceHandlerPlugin({
    spec: () => new OpenAPIGenerator().generate(rpcRouter, {
      version: '3.1.1',
      errorStatusMap: rpcErrorStatusMap,
      base: {
        info: {
          title: 'flaretifacts',
          version: '0.0.0',
          description: 'Every procedure of rpcContract over REST. The same procedures run over the oRPC protocol at /rpc and as MCP tools at /mcp.',
        },
        servers: [{ url: '/api' }],
      },
    }),
    specPath: '/openapi.json',
    docsPath: '/docs',
    providerConfig: {
      operationTitleSource: 'path',
      operationsSorter: 'method',
      showDeveloperTools: 'never',
      agent: { disabled: true },
    },
  });

  const { response } = await new OpenAPIHandler(rpcRouter, { errorStatusMap: rpcErrorStatusMap, plugins: [new SmartCoercionHandlerPlugin(), reference] }).handle(request, { prefix: '/api', context: { ...deps, user, userToken: usersAccessToken(request.headers) } });

  return response ?? new Response('Not found', { status: 404 });
}
