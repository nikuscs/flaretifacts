import { getOpenAPIMeta } from '@orpc/openapi';
import { COMMON_ERROR_STATUS_MAP, createRouterClient, implement } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { deps } from '@/core/core.deps';
import * as Artifacts from '@/services/artifacts/artifacts.server';
import * as Assets from '@/services/assets/assets.server';
import * as Examples from '@/services/examples/examples.server';
import { usersAccessToken, usersOfRequest } from '@/services/users/users.utils';
import { errorsCatalog } from '@/types/errors.types';
import { rpcContract } from '@/types/rpc.types';
import type { Deps } from '@/types/deps.types';
import type { RpcServerContext } from '@/types/rpc.types';
import type { AnyProcedure } from '@orpc/server';

const rpc = implement(rpcContract).$context<Deps>();

export const rpcRouter = rpc.router({
  examples: {
    list: rpc.examples.list.handler(() => Examples.examplesList()),
    get: rpc.examples.get.handler(({ input }) => Examples.examplesGet(input)),
  },
  artifacts: {
    guide: rpc.artifacts.guide.handler(() => Artifacts.artifactsGuide()),
    schema: rpc.artifacts.schema.handler(({ input }) => Artifacts.artifactsSchema(input)),
    validate: rpc.artifacts.validate.handler(({ input }) => Artifacts.artifactsValidate(input)),
    list: rpc.artifacts.list.handler(({ context, input }) => Artifacts.artifactsList(context, input)),
    get: rpc.artifacts.get.handler(({ context, input }) => Artifacts.artifactsGet(context, input)),
    layout: rpc.artifacts.layout.handler(({ context, input }) => Artifacts.artifactsLayout(context, input)),
    data: rpc.artifacts.data.handler(({ context, input }) => Artifacts.artifactsData(context, input)),
    link: rpc.artifacts.link.handler(({ context, input }) => Artifacts.artifactsLink(context, input)),
    html: rpc.artifacts.html.handler(({ context, input }) => Artifacts.artifactsHtml(context, input)),
    versions: rpc.artifacts.versions.handler(({ context, input }) => Artifacts.artifactsVersions(context, input)),
    create: rpc.artifacts.create.handler(({ context, input }) => Artifacts.artifactsCreate(context, input)),
    update: rpc.artifacts.update.handler(({ context, input }) => Artifacts.artifactsUpdate(context, input)),
    patch: rpc.artifacts.patch.handler(({ context, input }) => Artifacts.artifactsPatch(context, input)),
    restore: rpc.artifacts.restore.handler(({ context, input }) => Artifacts.artifactsRestore(context, input)),
    deleteVersions: rpc.artifacts.deleteVersions.handler(({ context, input }) => Artifacts.artifactsDeleteVersions(context, input)),
    delete: rpc.artifacts.delete.handler(({ context, input }) => Artifacts.artifactsDelete(context, input)),
    view: rpc.artifacts.view.handler(({ context, input }) => Artifacts.artifactsView(context, input)),
    stateSave: rpc.artifacts.stateSave.handler(({ context, input }) => Artifacts.artifactsStateSave(context, input)),
  },
  assets: {
    upload: rpc.assets.upload.handler(({ context, input }) => Assets.assetsUpload(context, input)),
    list: rpc.assets.list.handler(({ context, input }) => Assets.assetsList(context, input)),
    delete: rpc.assets.delete.handler(({ context, input }) => Assets.assetsDelete(context, input)),
  },
});

export const rpcErrorStatusMap = {
  ...COMMON_ERROR_STATUS_MAP,
  ...Object.fromEntries(Object.entries(errorsCatalog).map(([code, { status }]) => [code, status])),
};

export async function rpcHandle(request: Request) {
  const allowMethods = (method: string, procedure: AnyProcedure) => method === 'POST' || getOpenAPIMeta(procedure)?.method === method;

  const user = usersOfRequest(request.headers);
  const { response } = await new RPCHandler(rpcRouter, { errorStatusMap: rpcErrorStatusMap, allowMethods }).handle(request, { prefix: '/rpc', context: { ...deps, user, userToken: usersAccessToken(request.headers) } });

  return response ?? new Response('Not found', { status: 404 });
}

export const rpcServer = createTanstackQueryUtils(createRouterClient<typeof rpcRouter, RpcServerContext>(rpcRouter, {
  context: ({ user = null }) => ({ ...deps, user }),
}));
