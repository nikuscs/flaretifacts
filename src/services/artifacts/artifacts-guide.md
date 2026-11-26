# How to build artifact pages

An artifact is a page with a link. People open it on a phone or a laptop, often weeks later, so it must read at a glance and stay correct. You build it from blocks (Arc UI components) or from one HTML page.

## The tools, in the order you use them

1. `artifacts_guide` (this), then `examples_list` to pick a page close to what the person wants, and `examples_get { name }` for its full spec to adapt.
2. `artifacts_schema` for the exact props of the blocks you use (`{ blocks: ["DataTable", "AreaChart"] }` keeps it short).
3. `artifacts_validate { spec }` until it says `ok: true`, then `artifacts_create`. It returns the link (`url`): always send it to the person in your reply, and again after every change, so they can open the page.
4. Later: `artifacts_list { search }` to find it, `artifacts_data` or `artifacts_get` to read it, then `artifacts_patch` for small changes or `artifacts_update` to replace the data or the whole spec. Both need the `version` you read; on `ARTIFACT_VERSION_CONFLICT`, read again and redo your change on top.
5. `artifacts_html` shows the page as the server renders it, `artifacts_link` gives the link, `artifacts_versions` and `artifacts_restore` undo a bad change, and `artifacts_deleteVersions` removes earlier versions someone no longer wants (the current one always stays).

## A spec

```json
{
  "root": "page",
  "elements": {
    "page": { "type": "Stack", "props": { "gap": "lg" }, "children": ["intro", "kpis"] },
    "intro": { "type": "Text", "props": { "text": "November, from the books. Updated 18 Nov.", "variant": "muted" } },
    "kpis": { "type": "Grid", "props": { "columns": "3" }, "children": ["revenue", "costs", "margin"] },
    "revenue": { "type": "Metric", "props": { "label": "Revenue", "value": { "$state": "/revenue" }, "prefix": "€", "change": "+12%" } },
    "costs": { "type": "Metric", "props": { "label": "Costs", "value": { "$state": "/costs" }, "prefix": "€" } },
    "margin": { "type": "Gauge", "props": { "label": "Margin", "value": { "$state": "/margin" }, "unit": "%" } }
  },
  "state": { "revenue": 48250, "costs": 21730, "margin": 55 }
}
```

- `elements` is a flat map. Every element is reached exactly once from `root` through `children`, at most 32 levels deep. Keys are short and say what the block is (`revenue`, `cashCard`), never `el1`.
- Only layout blocks take children: Stack, Grid, Card, Tabs (one child per tab, in order), Section, DataTable (blocks in the panel each row opens) and any other block whose description says so.
- `repeat: { "statePath": "/sellers" }` on a Stack or Grid shows its children once per item of a list; they read the item with `{ "$item": "name" }`. `visible` shows an element only when a condition holds: `{ "$state": "/view", "eq": "list" }`, `{ "$item": "notes", "neq": "" }`.
- A whole spec is at most 2 MB of JSON, but aim far lower: send only what the page shows (totals and the rows people look up, not raw exports) and follow *Keep the data small*. Past 2 MB, split it into several pages linked from a short index page.
- `state` is the page data. `{ "$state": "/path" }` reads a value into any prop. `{ "$bindState": "/path" }` on the value prop of an input (Checklist items, Toggle checked, Select value, Notes value, Filters value) also saves what people change.

## Keep it up to date

Put every number, list and row that will change in `state`, and bind blocks to it with `$state`. Then an update is only new data:

- `artifacts_update { id, version, state: { … } }` replaces all the data.
- `artifacts_patch { id, version, operations: [{ "op": "replace", "path": "/state/revenue", "value": 52100 }] }` changes one value. Paths are JSON Pointers into the spec: `/state/…`, `/elements/<key>/props/<prop>`, `/elements/<key>/children/-` to append a child.
- Add a block with two operations: `{ "op": "add", "path": "/elements/notesCard", "value": { … } }` then `{ "op": "add", "path": "/elements/page/children/-", "value": "notesCard" }`.
- Never overwrite what people changed: read `artifacts_data` first and keep their ticks, notes and choices.
- Every update is a new version and open pages refresh live. The last 10 versions are kept.

## Make it beautiful

- **Start with the answer.** The page already shows its `title` and `emoji` at the top, so never repeat them in a Heading. Open with one muted Text line saying what the page covers and when it was updated, then the 3 or 4 numbers that matter (KeyNumbers, or Metric cards in a Grid). Details go below.
- **Make it fun to look at.** Emoji are welcome where they help people scan: card titles (`"💸 Spending"`), tab labels, badges, list items, Filters options, Kanban cards and status or badge cells (`"✅ Done"`, `"🔥 Hot"`). One per label, at the start. Never inside numbers, money or dates, and never in a column people sort by number.
- **Icons for things, emoji for feeling.** Icon, Features, Tabs, Accordion, Filters and Dropdown take an `icon`: a lucide name from the fixed list in `artifacts_schema`, such as `rocket`, `calendar`, `handshake`, `stethoscope` or `party-popper`; any other name fails validation. Icon shows one in a soft tinted square with a `tone`, a `label` and a `description`: several in a Grid make a row of points.
- **Faces make people pages.** Avatar for one person, AvatarGroup for a team or who is going, People for a list or grid, and an `avatar` column in DataTable. Pictures are https links (an uploaded asset such as `https://<your-domain>/a/ID/assets/FILE` or any https image); initials or an `emoji` show when there is none.
- **Link what you name.** When a row, card or name has a page of its own (a shop, a profile, an issue, a booking, a product), give it a `url` so people can open it: List, Files, People (`url` on the name, `roleUrl` on the line under it), Avatar, RankedList, Timeline, Kanban, Agenda, Comparison, KeyValue, Features, Checklist and Quote take one. In Table and DataTable, `urlKey` on a column names the row key holding the link, so the name or avatar itself opens it. Links open in a new tab.
- **Copy what people paste.** `copy: true` on a DataTable or Table column, or on a KeyValue item, adds a copy button beside the value: passwords, codes, addresses, IDs, links. One KeyValue row with `copy` shows a single value to copy; Code has its own button. Store the value ready to paste: a leading emoji is left out of the copy, anything else goes in as written.
- **Group in Cards.** Each chart, table or list sits in a Card with a short `title` and, when it helps, a `description`. Cards side by side go in a Grid with 2 columns; full-width cards for wide charts and tables.
- **One idea per block.** A chart shows one thing. Its title says what, its caption says the period or the source.
- **Pick the right chart.** A trend over time: AreaChart or LineChart (up to 4 series). Comparing periods or items: BarChart. Parts of a whole: PieChart for up to 6 parts, SplitBar for one bar of parts, WaffleChart for 2 to 4 shares. A ranking: RankedList. A single value against a target: Gauge, Progress or UsageMeter. A small trend inside a card: Sparkline. Days of activity: Heatmap.
- **Pick the right block for the rest.** Headline numbers under the intro: KeyNumbers (light) or Metric cards (heavy). Many rows people search or sort: DataTable with typed columns (an `avatar` column for faces), `filters`, `pageSize` and `groupBy`; a short fixed table: Table. One person: Avatar; a team in one line: AvatarGroup. Several links behind one button: Dropdown; a saved choice: Select. Things that happened: Timeline. Things that will happen by date: Agenda. A deadline: Countdown. Stages: Steps. Work in columns: Kanban. Choosing between options: Comparison. People: People. Highlights or what is included: Features. A point with an icon beside it, such as a feature row or a section header: Icon. FAQs or details per topic: Accordion. Links and documents: Files. Commands or snippets: Code. A line worth keeping: Quote. A clip: Video. One custom part no block can show, such as a small calculator or visual: Html.
- **Filter instead of repeating.** To filter several blocks at once, put one Filters block with `value: { "$bindState": "/team" }` and `"team": "all"` in state, then give DataTable, Table, List, People, Files or Kanban `where: { "team": { "$state": "/team" } }`: they show only rows or cards whose key equals the value, and "all" shows everything. Rows and items may carry extra keys only for `where`. Filters inside one DataTable are under Tables.
- **Long lists get pages.** `pageSize` on DataTable, Table, List, People and Files adds the same pager ("1–20 of 312").
- **Tables are for lookup, not for reading.** Use them for rows people scan or search; summarise above them with numbers or a chart.
- **Labels in plain words.** "Revenue", not "rev_total". Units on every number: a `prefix` of `€`, a `suffix` or `unit` of `%`, `h` or `docs`. Round to what matters: 48,250 not 48,250.37.
- **Changes carry a sign.** `change: "+12%"` or `"-3.1%"`; the block colours it.
- **Status is quiet until it matters.** Badge and Status for state, Alert only for something to act on, destructive only for errors.
- **Long or secondary content** goes in Tabs (up to 8, with an `icon` and a `count` each), an Accordion or a Section the reader opens, never in one endless column. A Tabs block in a Card is the best way to hold several views of the same thing.
- **Interactive blocks** (Checklist, Toggle, Select, Notes, Filters) are for pages people work in, like plans and checklists. Bind them so their changes are saved.
- **Mobile first.** Grids stack on narrow screens; keep tables to the columns that matter and charts to 12 points or fewer when you can.
- **Don't** nest Cards in Cards, repeat the page title as the first Card title, stack more than 6 numbers in one Grid, or use Markdown where a block exists.

## Tables

- Use DataTable for anything people look up: directories, catalogues, sellers, transactions. Start from `examples_get { name: "seller-directory" }` or `team-directory`.
- Type every column: `money`, `number`, `percent`, `date`, `badge` with `tones` (emoji welcome: `"🟢 Live"`), `progress`, `avatar`, `link`. Text is the default.
- Filters: `filters: [{ "key": "brands" }, { "key": "status" }]` gives each a compact select button where people tick any number of values, with counts. Add as many as help; more than 3 fold into one Filters button. `options` set the order and may carry an `emoji` or `icon`. Use `"type": "buttons"` only for a table with one filter of 2 to 5 values.
- Several values in one cell: a list (`"brands": ["Moncler", "Stone Island"]`) or comma-separated text. Filters match any of them.
- Links: give a `link` column a `labelKey` naming the row key with a short label; the host shows otherwise. To make a name, avatar or badge open a page instead, keep the link in an untyped row key and set the column's `urlKey` to it.
- Leave unknown cells out (or `null`, `""`, `[]`): they show a dash. Never write "N/A" or "unknown".
- `pageSize` 20 to 50, and a `sort` that puts the best rows first.
- **Few columns, more on click.** Keep 4 to 6 short columns in the table: the name, a status, a number, a date. Give long text, sources and extras `"show": "detail"`: they move into a panel that opens under the row. `"show": "wide"` keeps a column on laptops and moves it into the panel on phones: leave only 2 or 3 short columns (the name and a status) for phones, so tables never scroll sideways.
- **Blocks for each row.** A DataTable's children appear in that panel for the open row, nested as deep as you need: a chart, a checklist, a Notes box, another table. They read the row with `{ "$item": "prices" }` (or `{ "$template": "Seen ${talk} times" }` inside text) and save onto it with `{ "$bindItem": "notes" }`. Rows hold any data the panel needs, such as `"prices": [{ "day": "2026-11-01", "eur": 42 }]`; a nested table can list a row's own records with `rows: { "$item": "orders" }`.
- **Tables people fill in.** `editable: true` adds an Add row button above the table and an Edit row button in each row's panel (with Remove), so people keep their own lists on the page: finds, purchases, contacts, links. Bind `rows` with `{ "$state": "/finds" }` to a list of objects; the form has one field per column, plus the name of an avatar and the link behind a `urlKey`. Badge fields offer the `tones`, the filter `options` and the values already in the column, so list every status in `tones`. Keep the form short: `"form": false` on a column leaves it out of the form for extras an agent fills in later. Give each field a `placeholder` (`"e.g. Moncler Maya puffer"`) and a `default` where one is usual (`"👀 Not yet"`). A text column with filter `options` suggests them as people type, and still takes any value. Start empty lists as `[]`.

## Keep the data small

Pages load on phones, every byte is sent each time someone opens one, and every agent that reads or updates the page pays for it again. Small data is the default, not a last step before the 2 MB limit. `seller-directory`, `team-directory` and `personal-finance` in `examples_get` show each rule below.

- **Store each thing once.** One list in `state` per kind of record (people, sellers, mentions, orders), with the keys every block needs. Blocks point at it with `{ "$state": "/people" }` and pick their rows with `where`, never with their own copy: People, Table, List, Files, Kanban and DataTable all take `where`, and rows may carry a key only for it (`"lead": "yes"`, then `where: { "lead": "yes" }`). Name keys the way People reads them (`name`, `avatar`, `role`, `status`), so the same list also feeds People and tables.
- **Join instead of nesting copies.** Records that belong to a row (mentions, orders, reviews) live in their own list; the row's panel shows its own with a table on that list and `where: { "seller": { "$item": "seller" } }`. Never copy them into each row, and never copy the parent's fields (its brands, logo, status) onto each record.
- **Leave out what the page works out or never shows.** A `link` column shows the host already, so add a `labelKey` only for a better label. Skip keys no column, filter, `where` or panel block uses, and leave unknown values out (`null` in a `{ keys, rows }` list) rather than writing "N/A" or "unknown".
- **Big read-only tables as lists.** `rows` (or the list in `state`) may be `{ "keys": ["seller", "status", "rating"], "rows": [["North Thread", "🟢 Live", 4.6], …] }`: the keys are written once instead of on every row, which often makes it 20 to 45% smaller. Use it for any DataTable over about 20 rows; keep objects only when panel inputs save onto rows with `$bindItem`.
- **Short cells.** One line in a column; the full text goes in a `detail` column, cut to what helps people decide.
- **Inputs start empty.** Checklist `done`, Toggle `checked`, and Select and Notes `value` may be left out until someone uses them, so tasks and rows need no `false` or `""` placeholders, and a Notes box bound to `/notes` needs no `notes` in state.

## Images

Upload pictures instead of linking to random sites: create the page, then `assets_upload { artifactId, name, base64 }` (or `url` with an https link) for each image. It returns a `url` on the app's domain; put it in an Image `url`, an Avatar `src`, a People `avatar` or a DataTable `avatar` cell with `artifacts_patch`. PNG, JPEG, GIF, WebP, AVIF and plain SVG up to 3 MB; SVGs with scripts, event handlers or outside links are refused. Images follow the page's visibility, `assets_list` and `assets_delete` manage them, and deleting the page deletes them. HTML pages can use these links in `<img>` too.

## Visibility

`private` (the default) opens only for the signed-in owner. `public` opens for anyone with the link. `passcode` opens for anyone who types the passcode you set; tell the person the passcode separately. Choose public or passcode only when the person asks to share it.

## HTML pages

Use `{ html, state }` only when no block can show it: a custom visual, a small game, a print layout. The body runs in a sandbox with inline CSS and JS (eval, `new Function` and `innerHTML` work), no network and no external images. Links open in a new tab. It gets the app's colours as CSS variables (`--background`, `--foreground`, `--card`, `--border`, `--muted-foreground`, `--series-1` to `--series-4`) and the classes `o-stack`, `o-grid`, `o-card`, `o-h1`, `o-h2`, `o-text`, `o-muted`, `o-label`, `o-value`, `o-badge`, `o-button`, `o-list`, `o-row` and `o-table`, so it matches the rest of the app. Blocks pages look better and can be patched; prefer them, and for one custom part inside a blocks page use the Html block, which runs the same way.
