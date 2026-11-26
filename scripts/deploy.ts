import { spawnSync } from 'node:child_process';
import { experimental_readRawConfig } from 'wrangler';
import * as z from 'zod';

// bun run deploy             gate, build, check the built Worker, deploy it with its Durable Object
// bun run deploy --dry-run   run the local steps and the wrangler dry run, change nothing remote
//
// Every step is safe to repeat: run it again after a failure or for every release.

const dryRun = process.argv.slice(2).includes('--dry-run');

const BUILT_CONFIG = 'dist/server/wrangler.json';

const SETUP = 'see README › Deploy to your own Cloudflare account';

const needs = (what: string) => `wrangler.jsonc needs ${what} (${SETUP})`;

const wranglerConfig = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/),
  routes: z.array(z.object({ pattern: z.string().min(1) }), { error: needs('a routes entry for your domain') }).min(1, needs('a routes entry for your domain')),
  vars: z.object({
    ACCESS_APP_AUDIENCE: z.string().regex(/^[a-f0-9]{64}$/, needs("ACCESS_APP_AUDIENCE set to the Access app's aud tag")),
    ACCESS_TEAM_DOMAIN: z.hostname(needs('ACCESS_TEAM_DOMAIN set to <your-team>.cloudflareaccess.com')),
    APP_ORIGIN: z.string().refine(
      (origin) => URL.canParse(origin) && new URL(origin).protocol === 'https:' && new URL(origin).origin === origin,
      needs('APP_ORIGIN set to https://<your-domain>, with no path or trailing slash'),
    ),
  }),
});

const parsed = wranglerConfig.safeParse(experimental_readRawConfig({ config: 'wrangler.jsonc' }).rawConfig);

if (!parsed.success) {
  console.error(parsed.error.issues.map((issue) => `✗ ${issue.message}`).join('\n'));
  process.exit(1);
}

const config = parsed.data;

function title(text: string) {
  console.log(`\n▸ ${text}`);
}

function run(command: string, args: string[], { remote = false } = {}) {
  console.log(`$ ${command} ${args.join(' ')}`);

  if (dryRun && remote) {
    console.log('  skipped (--dry-run)');

    return;
  }

  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });

  if (result.error || result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with status ${result.status}`, { cause: result.error });
  }
}

title(`Gate and build ${config.name}`);
run('bun', ['run', 'check']);
run('bun', ['run', 'lint:cycles']);
run('bun', ['run', 'build']);

title('Check the built Worker');
run('bunx', ['wrangler', 'deploy', '--config', BUILT_CONFIG, '--dry-run']);

title('Deploy the Worker and its Durable Object migrations');
run('bunx', ['wrangler', 'deploy', '--config', BUILT_CONFIG], { remote: true });

console.log(dryRun ? '\nDry run finished: nothing remote changed.' : '\nDeployed.');
