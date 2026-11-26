import { describe, expect, it } from 'vitest';
import { mcpHandle } from '@/mcp/mcp.server';
import { USERS } from '@/services/users/users.constants';

async function mcpTestCall(method: string, params: object) {
  const response = await mcpHandle(new Request('https://artifacts.test/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      [USERS.userHeader]: encodeURIComponent(JSON.stringify({ login: 'agent.access', kind: 'service' })),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  }));

  const data = (await response.text()).split('\n').find((line) => line.startsWith('data: ')) ?? '';

  return JSON.parse(data.slice('data: '.length)).result;
}

describe('mcpHandle', () => {
  it('tells agents how artifacts work and lists every tool but the two the page uses', async () => {
    const initialized = await mcpTestCall('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '0' },
    });

    const { tools } = await mcpTestCall('tools/list', {});

    expect(initialized.instructions).toContain('artifacts_guide');
    expect(tools.map((tool: { name: string }) => tool.name).toSorted()).toEqual([
      'artifacts_create',
      'artifacts_data',
      'artifacts_delete',
      'artifacts_deleteVersions',
      'artifacts_get',
      'artifacts_guide',
      'artifacts_html',
      'artifacts_layout',
      'artifacts_link',
      'artifacts_list',
      'artifacts_patch',
      'artifacts_restore',
      'artifacts_schema',
      'artifacts_update',
      'artifacts_validate',
      'artifacts_versions',
      'assets_delete',
      'assets_list',
      'assets_upload',
      'examples_get',
      'examples_list',
    ]);
  });

  it('creates an artifact as the calling service token and returns its link', async () => {
    const result = await mcpTestCall('tools/call', {
      name: 'artifacts_create',
      arguments: { title: 'Weekly numbers', emoji: '📈', visibility: 'public', spec: { html: '<h1>Numbers</h1>' } },
    });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toMatchObject({
      title: 'Weekly numbers',
      emoji: '📈',
      kind: 'html',
      visibility: 'public',
      createdBy: 'agent.access',
      version: 1,
    });
    expect(result.structuredContent.url).toMatch(/^https:\/\/artifacts\.test\/a\/[\dA-Za-z]{10}$/);
  });
});
