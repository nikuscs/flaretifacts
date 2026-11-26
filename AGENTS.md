# Flaretifacts

Artifacts that agents create over MCP: block pages and HTML pages with saved state, versions and public, private or passcode links. Next App Router code built by vinext and served by one Cloudflare Worker with one SQLite Durable Object.

## Read first

- `.agents/references/architecture.md`: how the app runs, the allowed folders and file names, and the standards. Read it before writing code.
- `.agents/references/quality-gate.md`: the review standard.

## Protected files

Agents never edit these on their own. Propose the exact diff and wait for the user's approval of that diff:

- `.agents/references/architecture.md` and `.agents/references/quality-gate.md`.
- `oxlint.config.ts` and `.fallowrc.json`.
- New suppressions, test `skip`/`only` and `fallow-ignore`.

## Work protocol

- A question is not an edit request. Review feedback is discussion until fixes are approved.
- Before a non-trivial or destructive change, state the plan and assumptions and wait. "Go", "do it", "ship it" or "end to end" authorizes the agreed scope without staged pauses.
- After two failed attempts, stop and ask. Fix only the requested path; mention unrelated issues.
- Commit or push only when requested, on the current branch. Open a PR only with explicit PR permission.

## Rules

- Greenfield: change things cleanly, no compatibility shims, re-exports or leftovers.
- A schema change adds a numbered file in `migrations/`; the Durable Object applies it on its next start.
- Cloudflare resources, Access apps and deploys need explicit approval.
- Headless backend: every action and read a screen needs is a procedure in `rpcContract`, so agents can do it over MCP; the frontend only calls `/rpc`.
- Public paths are listed once in `ARTIFACTS.publicPaths`; every procedure they reach checks the artifact's visibility itself. Everything else sits behind Cloudflare Access.
- UI follows Arc (https://uiarc.dev).
- Readable code is required: follow `.agents/references/architecture.md` › Standards.

## Task procedures

- Deploy, Access setup and connecting MCP clients: `README.md` › Deploy to your own Cloudflare account.

## Validation

```bash
bun run check        # typecheck, lint, lint:dead, test
bun run lint:cycles
bun run build
```

Zero warnings. After changing agent files, run `bun run agents:sync`.
