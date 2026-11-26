import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import { McpRegistrar } from '@orpc/mcp';
import { deps } from '@/core/core.deps';
import { rpcRouter } from '@/rpc/rpc.server';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import { usersAccessToken, usersOfRequest } from '@/services/users/users.utils';

export async function mcpHandle(request: Request) {
  const user = usersOfRequest(request.headers);
  const { view: _view, stateSave: _stateSave, ...artifacts } = rpcRouter.artifacts;
  const context = { ...deps, user, userToken: usersAccessToken(request.headers) };

  return createMcpHandler(async () => {
    const server = new McpServer({ name: 'flaretifacts', version: '0.0.0' }, { instructions: ARTIFACTS.mcpInstructions });

    await new McpRegistrar({
      examples: rpcRouter.examples,
      artifacts,
      assets: rpcRouter.assets,
    }).register(server, { context });

    return server;
  }).fetch(request);
}
