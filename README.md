# 🧩 Flaretifacts

> Shareable pages that AI agents publish over MCP — reports, charts, checklists and plans on your own Cloudflare domain.

An agent calls one MCP tool with a title and a spec and gets back a link. The spec is either a tree of blocks (charts, tables, checklists, notes, markdown and more, rendered with the Arc UI look) or a sandboxed HTML page. What people change on the page, such as ticked tasks or notes, is saved with it, every change by an agent is a new version, and open pages update live. A link can be public, private to the signed-in owner, or behind a passcode.

## ✨ Features

- 🔌 **MCP first.** Every action is an oRPC procedure at `/rpc`, also served as MCP tools at `/mcp` and as REST at `/api`, with instructions that teach agents the spec format.
- 🧱 **Blocks and HTML.** 56 blocks in the Arc UI style (layout, cards, text, tables, line, area, bar, pie, split-bar and waffle charts, ranked lists, timelines, metrics, gauges, meters, heatmaps, checklists, toggles, selects, notes and more), an Html block for one custom part, or a whole HTML page. Custom HTML runs sandboxed with no network, eval allowed.
- 🔗 **Links.** Names, rows, cards, events and table cells take a link that opens in a new tab.
- 🗂️ **Rows that open.** A data table row opens into a panel with its extra columns and any blocks for that row, nested as deep as needed; columns move into the panel on phones, and big tables can send rows as compact value lists.
- 🖼️ **Images.** Agents upload PNG, JPEG, GIF, WebP, AVIF or checked SVG images to an artifact in R2 and use them in Image, Avatar and table cells; they go when the artifact goes.
- 💾 **Saved state.** Blocks bind to state with `$bindState`; ticks and notes save on the current version, and agents read them back.
- 🕘 **Versions.** Updates check the version the agent read, the last 10 versions are kept, and any of them can be restored.
- 🔐 **Three kinds of link.** Public, private (Cloudflare Access sign-in) or passcode (hashed with PBKDF2).
- ⚡ **Live.** Open pages hold a websocket to the Durable Object and refresh when the artifact changes.
- 📋 **Dashboard.** One table with every artifact, its kind, access, version and link.

## 🧰 Built with

[vinext](https://vinext.dev) · [Next.js App Router](https://nextjs.org) · [Cloudflare Workers](https://developers.cloudflare.com/workers/) · [Durable Objects with SQLite](https://developers.cloudflare.com/durable-objects/) · [Cloudflare R2](https://developers.cloudflare.com/r2/) · [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) · [oRPC](https://orpc.dev) · [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) · [json-render](https://github.com/vercel-labs/json-render) · [Streamdown](https://streamdown.ai) · [Zod](https://zod.dev) · [TanStack Query](https://tanstack.com/query) · [Tailwind CSS](https://tailwindcss.com) · [Arc UI](https://uiarc.dev) · [Bun](https://bun.sh) · [Oxlint](https://oxc.rs) · [Fallow](https://fallow.tools/docs/) · [Vitest](https://vitest.dev)

## 🚀 Run locally

```bash
bun install
cp .dev.vars.example .dev.vars
bun run dev
```

Opens on `http://localhost:5173` with a local Durable Object. Access does not run locally, so every request is signed in as `DEV_USER_EMAIL`. Image blocks only take `https` links, so in local dev use an `https` picture link: uploads return `http://localhost` links, which image blocks reject.

## 🔑 Configuration

There are no secrets. Everything lives in `wrangler.jsonc` `vars`, with local overrides in `.dev.vars`.

| Key | What it is |
| --- | --- |
| `ACCESS_APP_AUDIENCE` | Application Audience (AUD) tag of the Access app: the Worker accepts only tokens Access issued for it |
| `ACCESS_TEAM_DOMAIN` | Your Cloudflare Access team domain (`<your-team>.cloudflareaccess.com`) |
| `APP_ORIGIN` | Public origin (`https://<your-domain>`); artifact links start with it |
| `DEV_USER_EMAIL` | Who local dev signs in as; ignored outside `bun run dev` |

| Binding | Kind | Purpose |
| --- | --- | --- |
| `ARTIFACTS` | Durable Object (SQLite) | One `ArtifactsStore` instance with every artifact, version and saved state, and the live sockets |
| `ASSETS_BUCKET` | R2 bucket `flaretifacts-assets` | Images agents upload, under `<artifact id>/<asset id>`; served at `/a/<artifact id>/assets/<asset id>` with the artifact's visibility, a sandbox CSP and nosniff, and deleted with the artifact |
| `SELF` | Service binding to this Worker | Renders an artifact page for `artifacts_html`, as the caller |

## 🔌 API and MCP

| Path | Who | What it serves |
| --- | --- | --- |
| `/` | signed in | The dashboard |
| `/a/<id>` | anyone, then the artifact's visibility decides | One artifact as its link shows it |
| `/mcp` | signed in | Every procedure as an MCP tool over Streamable HTTP |
| `/rpc` | signed in, except `artifacts/view` and `artifacts/stateSave` | oRPC handler for `rpcContract` |
| `/api/...`, `/api/openapi.json`, `/api/docs` | signed in | REST, the OpenAPI spec and its docs |
| `/live/<id>` | anyone who may view the artifact | Websocket that says when the artifact changed |

MCP tools, in the order an agent uses them:

| Tool | What it does |
| --- | --- |
| `artifacts_guide` | How to build a beautiful page and keep it up to date; agents read it first |
| `artifacts_schema` | Every block with what it shows and the JSON Schema of its props, plus the schema of a whole spec |
| `examples_list` | Example pages to start from, what each is for and the blocks it uses |
| `examples_get` | One example page by name with its full spec |
| `artifacts_validate` | Checks a spec without saving it |
| `artifacts_list` | Artifacts newest first, by words in the title, kind or visibility |
| `artifacts_get` | One artifact whole |
| `artifacts_layout` | Only its blocks and how they nest, or its HTML |
| `artifacts_data` | Only its data: the values blocks read and what people changed on the page |
| `artifacts_link` | Only its link and who can open it |
| `artifacts_html` | The page as the server renders it, without scripts |
| `artifacts_versions` | The kept versions |
| `artifacts_create` | A new page and its link |
| `artifacts_update` | Replaces title, emoji, spec, data, visibility or passcode as a new version |
| `artifacts_patch` | JSON Patch edits as a new version, such as one number or one new card |
| `artifacts_restore` | Brings back an earlier version |
| `artifacts_delete` | Deletes artifacts and their images |
| `assets_upload` | Uploads an image (PNG, JPEG, GIF, WebP, AVIF or a plain SVG, up to 3 MB) to an artifact from base64 or an https link, and returns its link |
| `assets_list` | The images of an artifact |
| `assets_delete` | Deletes images from an artifact |

`artifacts_view` and `artifacts_stateSave` exist for the page itself at `/rpc` and are not MCP tools.

A blocks spec looks like this:

```json
{
  "root": "page",
  "elements": {
    "page": { "type": "Stack", "children": ["title", "tasks"] },
    "title": { "type": "Heading", "props": { "text": "Launch plan" } },
    "tasks": { "type": "Checklist", "props": { "items": { "$bindState": "/tasks" } } }
  },
  "state": { "tasks": [{ "title": "Write copy", "done": false }] }
}
```

## ☁️ Deploy to your own Cloudflare account

You need a Cloudflare account with a domain (zone) on it and Zero Trust turned on (the free plan works). Run `bun install` first.

1. **Log in with Wrangler:**

   ```bash
   bunx wrangler login
   ```

   If your account has more than one Cloudflare account, export `CLOUDFLARE_ACCOUNT_ID=<your-account-id>` before running deploy commands.

2. **Create the R2 bucket:**

   ```bash
   bunx wrangler r2 bucket create flaretifacts-assets
   ```

3. **Choose a custom domain** on a zone in your Cloudflare account and add a `routes` entry to `wrangler.jsonc`:

   ```jsonc
   "routes": [{ "pattern": "<your-domain>", "custom_domain": true }]
   ```

   Keep `"name"` and the `SELF` entry in `services` the same: the Worker calls itself through that binding. If you rename one, rename both.

4. **Set `APP_ORIGIN`** in `wrangler.jsonc` `vars` to `https://<your-domain>`.

5. **Create two Cloudflare Access apps.** First create two reusable policies in Zero Trust › Access › Policies: an **Allow** policy for your own email and a **Bypass** policy for Everyone. Then create the apps in the dashboard with the settings below, or send each body as `POST https://api.cloudflare.com/client/v4/accounts/<account-id>/access/apps`. Leave out `allowed_idps` to allow every login method you have set up, and replace or remove `<your-mcp-client-origin>/*`: it is the web origin of any other MCP client that should be able to sign in.

   - **Main app on the whole host**, with Managed OAuth enabled so MCP clients can sign in:

     ```json
     {
       "name": "flaretifacts",
       "type": "self_hosted",
       "domain": "<your-domain>",
       "destinations": [{ "type": "public", "uri": "<your-domain>" }],
       "session_duration": "24h",
       "app_launcher_visible": false,
       "allowed_idps": ["<your-idp-id>"],
       "http_only_cookie_attribute": true,
       "policies": [{ "id": "<your-allow-policy-id>", "precedence": 1 }],
       "oauth_configuration": {
         "enabled": true,
         "grant": { "session_duration": "336h", "access_token_lifetime": "15m" },
         "dynamic_client_registration": {
           "enabled": true,
           "allowed_uris": ["https://claude.ai/*", "<your-mcp-client-origin>/*"],
           "allow_any_on_localhost": true,
           "allow_any_on_loopback": true
         }
       }
     }
     ```

   - **Bypass app for shared links**, so anyone can open `/a/<id>` and what the page loads (the Worker still checks each artifact's visibility):

     ```json
     {
       "name": "flaretifacts-links",
       "type": "self_hosted",
       "domain": "<your-domain>/a/*",
       "destinations": [
         { "type": "public", "uri": "<your-domain>/a/*" },
         { "type": "public", "uri": "<your-domain>/live/*" },
         { "type": "public", "uri": "<your-domain>/assets/*" },
         { "type": "public", "uri": "<your-domain>/_next/*" },
         { "type": "public", "uri": "<your-domain>/rpc/artifacts/view" },
         { "type": "public", "uri": "<your-domain>/rpc/artifacts/stateSave" },
         { "type": "public", "uri": "<your-domain>/favicon.ico" },
         { "type": "public", "uri": "<your-domain>/apple-icon.png" },
         { "type": "public", "uri": "<your-domain>/manifest.webmanifest" }
       ],
       "app_launcher_visible": false,
       "policies": [{ "id": "<your-bypass-policy-id>", "precedence": 1 }]
     }
     ```

6. **Fill `ACCESS_APP_AUDIENCE` and `ACCESS_TEAM_DOMAIN`** in `wrangler.jsonc` `vars` with the main app's `aud` tag and `<your-team>.cloudflareaccess.com`.

7. **Deploy:**

   ```bash
   bun run deploy --dry-run   # gate, build and wrangler dry run; nothing remote changes
   bun run deploy             # the same, then deploy the Worker and its Durable Object migrations
   ```

   The deploy stops and says what is missing until steps 3 to 6 are done. Schema changes ship as new files in `migrations/`; the Durable Object applies them on its next start.

### 🤖 Connect an MCP client

Point any MCP client that supports Streamable HTTP and OAuth (such as Claude, Cursor, Executor or another MCP client) at `https://<your-domain>/mcp`. The client discovers OAuth metadata from Cloudflare Access Managed OAuth, signs in once, and exposes the `artifacts_*`, `assets_*` and `examples_*` tools.

## 🧪 Checks

```bash
bun run check        # typecheck, lint, dead code, tests
bun run lint:cycles
bun run build
```

## 🙏 Credits

UI components are adapted from the free, MIT-licensed part of [Arc UI](https://uiarc.dev). The fire icon is from [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) by Microsoft (MIT).

## 📄 License

MIT, see [LICENSE](LICENSE).
