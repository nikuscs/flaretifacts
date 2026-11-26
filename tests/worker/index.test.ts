import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../../worker/index';

const waitUntil: ExecutionContext['waitUntil'] = () => undefined;

// SAFETY: fetch() reads only waitUntil from the execution context.
const context = { waitUntil } as ExecutionContext;

describe('worker fetch', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('turns away signed-out requests except artifact links, their reads and saves, and static files', async () => {
    vi.stubEnv('DEV', false);

    const statusOf = async (path: string, method = 'GET') => (await worker.fetch(new Request(`https://artifacts.test${path}`, { method }), env, context)).status;

    await expect(statusOf('/')).resolves.toBe(403);
    await expect(statusOf('/mcp', 'POST')).resolves.toBe(403);
    await expect(statusOf('/rpc/artifacts/create', 'POST')).resolves.toBe(403);
    await expect(statusOf('/api/artifacts/list')).resolves.toBe(403);
    await expect(statusOf('/a/k7Qx2mP9vR')).resolves.toBe(200);
    await expect(statusOf('/rpc/artifacts/view?data=%7B%7D')).resolves.toBe(200);
    await expect(statusOf('/rpc/artifacts/stateSave', 'POST')).resolves.toBe(200);
    await expect(statusOf('/assets/index.js')).resolves.toBe(200);
  });

  it('drops a user header the caller sent', async () => {
    vi.stubEnv('DEV', false);

    const fetched = vi.fn<(request: Request) => Promise<Response>>(async () => new Response('vinext app'));
    const handler = await import('vinext/server/fetch-handler');

    vi.spyOn(handler.default, 'fetch').mockImplementation(fetched);

    // SAFETY: the test env carries every var the Worker reads.
    await worker.fetch(new Request('https://artifacts.test/a/x', { headers: { 'x-flaretifacts-user': 'forged' } }), env, context);

    expect(fetched).toHaveBeenCalledOnce();
    expect(fetched.mock.calls[0]?.[0].headers.get('x-flaretifacts-user')).toBeNull();
  });
});
