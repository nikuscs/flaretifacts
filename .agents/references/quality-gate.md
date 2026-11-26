# Quality gate

Review the changed files and their callers against `.agents/references/architecture.md`. Report a defect only when the code proves its effect.

## Checks

```sh
bun run typecheck
bun run lint
bunx fallow dead-code --changed-since "$BASE" --format json
bun run test
bun run build
```

A required check that cannot run makes the review `INCOMPLETE`. Fallow `unused-exports` hits need an `rg -w` check before they count.

## Review

- Every added, renamed or moved file matches its tree in the architecture reference.
- `page.tsx` renders one page component, no markup; a page prefetches every query its client components read.
- Procedures are thin: named schemas from `types/`, one service call. Auth stays in `worker/index.ts`; a procedure reachable from `ARTIFACTS.publicPaths` checks visibility in its service.
- Services take `(deps: Deps, params)` with the one `Deps` type, never import `core/core.deps.ts`, and reach the Durable Object only through `deps.artifactsStore()`.
- Writes that must hold together run inside one Durable Object method, with the version check and the writes in one `transactionSync`; no read-then-write across calls.
- Schema changes add a migration; rows leave the Durable Object parsed by their schema in `types/`.
- No helper with one caller (tests do not count): every extracted function, value, type or wrapper has 2+ callers, or is a layer unit listed in the architecture standards.
- After a rename, move or replacement, old symbols, files and docs are gone and changed exports still have consumers.

## Protected enforcement

`architecture.md`, this file, `oxlint.config.ts`, `.fallowrc.json`, `tsconfig.json`, `tests/support/**`, the package `lint`, `check` and `test` scripts, and `wrangler.jsonc` bindings and Durable Object migrations change only for an explicit user request. New suppressions, skipped tests, `fallow-ignore` and downgraded severities are findings.

Use `FAIL` for proven defects and convention violations, `WARN` for optional improvements. Include the file, line, effect and fix direction.
