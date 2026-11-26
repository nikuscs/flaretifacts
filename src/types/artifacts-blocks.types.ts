import * as z from 'zod';

const artifactsLink = z.url({ protocol: /^https?$/ });
const artifactsImage = z.url({ protocol: /^https$/ }).describe('An https image link, such as an uploaded asset at https://<your-domain>/a/ID/assets/FILE');
const artifactsEmojiText = z.string().min(1).max(16).regex(/^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3)/u).describe('One emoji');
const artifactsCell = z.union([z.string(), z.number(), z.null()]);

export const artifactsBlocksDataTableValue = z.union([z.string(), z.number(), z.null(), z.array(z.string())]);

const artifactsDataTableCell = z.union([z.string(), z.number(), z.null(), z.array(z.string().max(120)).max(30)])
  .describe('Text, a number, null when unknown (shows a dash), or a list of texts such as ["Moncler", "Stone Island"] for several values');

const artifactsDataTableRows = z.union([
  z.array(z.record(z.string(), z.json())).max(5000),
  z.object({
    keys: z.array(z.string().min(1)).min(1).max(60).describe('The row keys, in the order of each row\'s values'),
    rows: z.array(z.array(z.json())).max(5000).describe('One list of values per row, in the order of keys'),
  }).strict(),
]).describe([
  'The rows: objects mapping keys to values, or { keys, rows } with one list of values per row, about 20% smaller for big tables.',
  'Column keys hold text, numbers, lists of texts or null; other keys may hold any data the panel blocks read, such as a list of points for a chart.',
  'Rows saved by panel inputs ($bindItem) must be objects in the page data, bound with { "$state": "/path" }',
].join(' '));

const artifactsSeries = z.array(z.object({ key: z.string(), label: z.string() })).min(1).max(4);

const artifactsTone = z.enum(['neutral', 'info', 'success', 'warning', 'danger']);
const artifactsDate = z.iso.date().describe('A day as YYYY-MM-DD');

const artifactsBlocksIcons = [
  'activity', 'alarm-clock', 'award', 'baby', 'banknote', 'battery', 'bed', 'bell', 'bike', 'book-open', 'bookmark', 'briefcase', 'building', 'bus',
  'cake', 'calculator', 'calendar', 'camera', 'car', 'cat', 'chart-column', 'circle-check', 'clipboard-list', 'clock', 'cloud', 'code', 'coffee',
  'compass', 'credit-card', 'crown', 'database', 'dog', 'dumbbell', 'file-text', 'flag', 'flame', 'folder', 'gamepad-2', 'gem', 'gift', 'globe',
  'graduation-cap', 'hammer', 'handshake', 'headphones', 'heart', 'hospital', 'hourglass', 'house', 'image', 'inbox', 'key', 'landmark', 'laptop',
  'layers', 'leaf', 'lightbulb', 'link', 'list', 'lock', 'mail', 'map-pin', 'medal', 'megaphone', 'message-circle', 'mic', 'moon', 'mountain',
  'music', 'newspaper', 'package', 'palette', 'party-popper', 'paw-print', 'pencil', 'phone', 'piggy-bank', 'pill', 'pizza', 'plane', 'plug',
  'receipt', 'recycle', 'rocket', 'school', 'scissors', 'search', 'settings', 'shield', 'ship', 'shirt', 'shopping-bag', 'shopping-cart', 'smile',
  'snowflake', 'sparkles', 'sprout', 'star', 'stethoscope', 'store', 'sun', 'tag', 'target', 'tent', 'thumbs-up', 'ticket', 'timer', 'train',
  'tree-pine', 'trending-up', 'trophy', 'truck', 'tv', 'umbrella', 'user', 'users', 'utensils', 'video', 'wallet', 'wifi', 'wine', 'wrench', 'zap',
] as const;

const artifactsIcon = z.enum(artifactsBlocksIcons).describe('A lucide icon name from the fixed list, such as rocket, calendar or party-popper');

const artifactsWhere = z.record(z.string(), artifactsCell).optional()
  .describe('Show only rows whose key equals the value, such as { "status": { "$state": "/statusFilter" } } bound to a Filters block; "all" or empty shows every row');

const artifactsUrlKey = z.string().optional().describe('The row key whose value is a link: the cell opens it in a new tab');

const artifactsCopy = z.boolean().optional().describe([
  'Adds a copy button beside the value, for things people paste elsewhere: passwords, codes, addresses, IDs, links.',
  'A leading emoji is left out of the copy; links copy the full URL',
].join(' '));

const artifactsPageSize = z.number().int().min(5).max(100).optional().describe('Rows per page; a pager shows when there are more, all rows when left out');

export const artifactsBlocksVideo = /^https:\/\/(?:(?:www\.|m\.)?youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/|(?:www\.|player\.)?vimeo\.com\/(?:video\/)?)([\w-]{6,20})/;

const artifactsChartHeader = {
  title: z.string().optional(),
  value: z.string().optional(),
  change: z.string().optional(),
  caption: z.string().optional(),
};

export const artifactsBlocksComponents = {
  Stack: {
    props: z.object({
      direction: z.enum(['vertical', 'horizontal']).optional(),
      gap: z.enum(['sm', 'md', 'lg']).optional(),
    }),
    description: 'Lays out its children in a column (default) or a row.',
  },
  Grid: {
    props: z.object({ columns: z.enum(['1', '2', '3', '4']).optional() }),
    description: 'Lays out its children in equal columns that stack on narrow screens.',
  },
  Card: {
    props: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
    }),
    description: 'An outlined group with an optional title and description around its children.',
  },
  Heading: {
    props: z.object({
      text: z.string(),
      level: z.enum(['1', '2', '3']).optional(),
    }),
    description: 'A heading. Level 1 is the page title.',
  },
  Text: {
    props: z.object({
      text: z.string(),
      variant: z.enum(['default', 'muted']).optional(),
    }),
    description: 'A paragraph of plain text.',
  },
  Stat: {
    props: z.object({
      label: z.string(),
      value: z.union([z.string(), z.number()]),
      change: z.string().optional(),
      trend: z.enum(['up', 'down', 'flat']).optional(),
      hint: z.string().optional(),
    }),
    description: 'One key number with its label, an optional change such as "+3%" and its trend.',
  },
  Badge: {
    props: z.object({
      text: z.string(),
      variant: z.enum(['secondary', 'outline', 'destructive', 'success', 'warning']).optional(),
    }),
    description: 'A small label for a state, such as "Live" or "Failed". Variant: secondary (grey, default), outline (blue), success, warning or destructive.',
  },
  List: {
    props: z.object({
      items: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        meta: z.string().optional(),
        url: artifactsLink.optional(),
      }).catchall(artifactsCell).describe('Extra keys such as status or team are not shown; where filters on them')).max(200),
      where: artifactsWhere,
      pageSize: artifactsPageSize,
    }),
    description: 'Rows with a title, an optional description, a short meta text on the right and an optional link. Optional where to filter by a Filters block and pageSize for a pager.',
  },
  Table: {
    props: z.object({
      columns: z.array(z.object({
        key: z.string(),
        label: z.string(),
        align: z.enum(['left', 'right']).optional(),
        urlKey: artifactsUrlKey,
        copy: artifactsCopy,
      })).min(1).max(12),
      rows: z.array(z.record(z.string(), artifactsCell)).max(500),
      where: artifactsWhere,
      pageSize: artifactsPageSize,
    }),
    description: 'A table. Each row maps column keys to text or numbers. Optional where to filter by a Filters block and pageSize for a pager.',
  },
  Progress: {
    props: z.object({
      label: z.string(),
      value: z.number().min(0).max(100),
      hint: z.string().optional(),
    }),
    description: 'A labelled progress bar from 0 to 100.',
  },
  Separator: {
    props: z.object({}),
    description: 'A thin divider between sections.',
  },
  LineChart: {
    props: z.object({
      data: z.array(z.record(z.string(), artifactsCell)).max(500),
      x: z.string(),
      series: artifactsSeries,
      ...artifactsChartHeader,
    }),
    description: 'A line chart of one to four series over the x axis, with a crosshair. Optional title, value, change and caption head it.',
  },
  BarChart: {
    props: z.object({
      data: z.array(z.record(z.string(), artifactsCell)).max(500),
      x: z.string(),
      series: artifactsSeries,
      average: z.boolean().optional(),
      unit: z.string().optional(),
      ...artifactsChartHeader,
    }),
    description: 'A bar chart of one to four series over the x axis. Optional average line, unit, title, value, change and caption.',
  },
  Checklist: {
    props: z.object({
      items: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        done: z.boolean().optional().describe('Not done when left out, so new tasks need no value'),
        url: artifactsLink.optional().describe('Makes the title a link, such as the ticket or doc for the task'),
      })).max(200),
    }),
    description: 'Tasks people tick. Bind items with $bindState at /tasks so ticks are saved.',
  },
  Toggle: {
    props: z.object({
      label: z.string(),
      description: z.string().optional(),
      checked: z.boolean().optional().describe('Off when left out, so rows need no value until someone flips it'),
    }),
    description: 'An on/off switch with a label. Bind checked with $bindState at /path so it is saved.',
  },
  Tabs: {
    props: z.object({
      tabs: z.array(z.union([
        z.string(),
        z.object({
          label: z.string().min(1).max(40),
          icon: artifactsIcon.optional(),
          count: z.number().int().nonnegative().optional(),
        }),
      ])).min(2).max(8),
    }),
    description: 'Tabs with 2 to 8 panels: one child per tab, in the same order. Each tab is a label string or { label, icon, count }, where count shows a small number such as open items. Put a Stack in a tab to hold several blocks.',
  },
  Section: {
    props: z.object({
      title: z.string(),
      open: z.boolean().optional(),
    }),
    description: 'A titled part of the page that opens and closes; its children are inside.',
  },
  Markdown: {
    props: z.object({ text: z.string().max(20_000) }),
    description: 'Rich text in Markdown: paragraphs, lists, links, small tables and code fences.',
  },
  KeyValue: {
    props: z.object({
      items: z.array(z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        url: artifactsLink.optional().describe('Makes the value a link'),
        copy: artifactsCopy,
      })).max(50),
    }),
    description: 'Label and value rows, like a details panel. A value can be a link or have a copy button; one row with copy shows a single value to copy, such as a code or an address.',
  },
  Status: {
    props: z.object({
      label: z.string(),
      state: z.enum(['default', 'success', 'destructive']),
      description: z.string().optional(),
    }),
    description: 'A state with a dot: default (neutral), success (good) or destructive (broken).',
  },
  Alert: {
    props: z.object({
      title: z.string(),
      description: z.string().optional(),
      variant: z.enum(['default', 'success', 'warning', 'destructive']).optional(),
    }),
    description: 'A short notice or callout with a title and an optional description. Variant: default (info), success, warning, or destructive only for errors.',
  },
  LinkButton: {
    props: z.object({ label: z.string(), url: artifactsLink }),
    description: 'A button that opens a web link in a new tab.',
  },
  Image: {
    props: z.object({
      url: artifactsLink,
      alt: z.string(),
      caption: z.string().optional(),
    }),
    description: 'An image from a web link, with alt text and an optional caption.',
  },
  AreaChart: {
    props: z.object({
      data: z.array(z.record(z.string(), artifactsCell)).max(500),
      x: z.string(),
      series: artifactsSeries,
      ...artifactsChartHeader,
    }),
    description: 'An area chart of one to four series over the x axis, with a crosshair. Optional title, value, change and caption head it.',
  },
  PieChart: {
    props: z.object({
      data: z.array(z.object({ label: z.string(), value: z.number().nonnegative() })).min(1).max(6),
      title: z.string().optional(),
      centerLabel: z.string().optional(),
      caption: z.string().optional(),
    }),
    description: 'A donut chart of up to six parts of a whole, with the total in the centre and a legend of values and percentages. Optional title, centerLabel and caption.',
  },
  Select: {
    props: z.object({
      label: z.string(),
      options: z.array(z.object({ value: z.string(), label: z.string() })).min(2).max(20),
      value: z.string().optional().describe('The picked option value; none when left out'),
    }),
    description: 'A dropdown to pick one option. Bind value with $bindState at /path so it is saved.',
  },
  Notes: {
    props: z.object({
      label: z.string().optional(),
      placeholder: z.string().optional(),
      value: z.string().max(5000).optional().describe('The text; empty when left out, so rows need no value until someone writes'),
    }),
    description: 'A text box people write in. Bind value with $bindState at /path so it is saved.',
  },
  Metric: {
    props: z.object({
      label: z.string(),
      value: z.union([z.string(), z.number()]),
      prefix: z.string().optional(),
      suffix: z.string().optional(),
      change: z.string().optional(),
      context: z.string().optional(),
    }),
    description: 'A card for one headline number: label, value that rolls in, optional prefix or suffix, a signed change such as "+18%" tinted by direction, and a context line.',
  },
  Sparkline: {
    props: z.object({
      data: z.array(z.number()).min(2).max(200),
      label: z.string().optional(),
      value: z.string().optional(),
      change: z.string().optional(),
    }),
    description: 'A compact trend line of 2 to 200 numbers, with an optional label, current value and change.',
  },
  Gauge: {
    props: z.object({
      value: z.number(),
      max: z.number().positive().optional(),
      unit: z.string().optional(),
      status: z.string().optional(),
      label: z.string(),
      description: z.string().optional(),
      tone: z.enum(['default', 'success', 'destructive']).optional(),
    }),
    description: 'One value against a range, such as a health score or a quota, as an arc with the value, unit, status word, label and description. Tone colours it.',
  },
  UsageMeter: {
    props: z.object({
      title: z.string(),
      used: z.number().nonnegative(),
      total: z.number().positive(),
      unit: z.string().optional(),
      parts: z.array(z.object({ label: z.string(), value: z.number().nonnegative() })).min(1).max(6),
      caption: z.string().optional(),
    }),
    description: 'A quota split into up to six parts, such as storage by type: used of total with a unit, a segmented bar and a legend.',
  },
  Heatmap: {
    props: z.object({
      days: z.array(z.object({ date: z.iso.date(), value: z.number().nonnegative() })).max(400),
      title: z.string().optional(),
      caption: z.string().optional(),
    }),
    description: 'A daily activity grid over weeks or months, like contributions or workouts: one value per YYYY-MM-DD day.',
  },
  SplitBar: {
    props: z.object({
      segments: z.array(z.object({ label: z.string(), value: z.number().nonnegative() })).min(1).max(6),
      title: z.string().optional(),
      description: z.string().optional(),
      totalLabel: z.string().optional(),
      unit: z.string().optional(),
    }),
    description: 'One bar split into up to six parts of a whole, such as spend by category, with a total and a legend. Optional title, description, totalLabel and a unit after each value.',
  },
  WaffleChart: {
    props: z.object({
      data: z.array(z.object({ label: z.string(), value: z.number().nonnegative() })).min(1).max(4),
      title: z.string().optional(),
      caption: z.string().optional(),
      unit: z.string().optional(),
    }),
    description: 'A grid of 100 squares showing up to four shares of a whole, such as matched against unmatched. Optional title, caption and unit.',
  },
  RankedList: {
    props: z.object({
      rows: z.array(z.object({
        label: z.string(),
        hint: z.string().optional(),
        value: z.number().nonnegative(),
        url: artifactsLink.optional().describe('Makes the label a link'),
      })).min(1).max(50),
      title: z.string().optional(),
      unit: z.string().optional(),
    }),
    description: 'Rows ranked by value, biggest first, each with a bar against the top one, like top vendors or pages. Optional hint under each label, link, title and unit.',
  },
  Timeline: {
    props: z.object({
      events: z.array(z.object({
        day: z.string(),
        time: z.string(),
        title: z.string(),
        actor: z.string().optional(),
        meta: z.string().optional(),
        tone: z.enum(['neutral', 'success', 'danger']).optional(),
        detail: z.string().optional(),
        url: artifactsLink.optional().describe('Makes the title a link, such as the commit, order or message'),
      })).min(1).max(100),
      label: z.string().optional(),
    }),
    description: 'Events grouped by day, in order, each with a time, a title, an optional actor, meta line, tone and detail that opens on click. Day is a heading such as "Today" or "18 Nov".',
  },
  DataTable: {
    props: z.object({
      title: z.string().max(120).optional(),
      description: z.string().max(300).optional(),
      columns: z.array(z.object({
        key: z.string().min(1),
        label: z.string(),
        type: z.enum(['text', 'number', 'money', 'percent', 'date', 'badge', 'link', 'progress', 'avatar']).optional()
          .describe([
            'text (default, a list shows comma-separated); number; money (with currency); percent (25 means 25%); date (YYYY-MM-DD or ISO time);',
            'badge (tinted by tones, a list shows several); link (the cell is a URL, shown as labelKey or the host); progress (0 to 100 as a bar); avatar (the cell is an https picture link, labelKey names the person, initials when empty)',
          ].join(' ')),
        currency: z.string().regex(/^[A-Z]{3}$/).optional().describe('ISO currency for money columns, such as EUR or USD; EUR when left out'),
        decimals: z.number().int().min(0).max(4).optional().describe('Fixed decimals for number, money and percent columns'),
        tones: z.record(z.string(), artifactsTone).optional().describe('For badge columns: cell value to tone, such as { "Paid": "success", "Late": "danger" }; neutral otherwise'),
        labelKey: z.string().optional().describe('For link columns: the row key whose value is the link text, the host name otherwise. For avatar columns: the row key of the name shown beside the picture'),
        urlKey: artifactsUrlKey,
        copy: artifactsCopy,
        show: z.enum(['always', 'wide', 'detail']).optional().describe([
          'always (default): a column on every screen; wide: a column on wide screens, in the row\'s panel on phones;',
          'detail: only in the panel that opens under the row, for long text and extras',
        ].join(' ')),
        form: z.boolean().optional().describe('For editable tables: false keeps this column out of the Add and Edit form, for extras an agent fills in later; in the form when left out'),
        placeholder: z.string().max(60).optional().describe('For editable tables: the hint shown in the empty form field, such as "e.g. Moncler Maya puffer"'),
        default: z.string().max(60).optional().describe('For editable tables: the value a new row starts with, such as "👀 Not yet"'),
      })).min(1).max(30).refine((columns) => columns.some((column) => column.show !== 'detail'), 'Keep at least one column with show always or wide'),
      rows: artifactsDataTableRows,
      filters: z.array(z.object({
        key: z.string().min(1).describe('The row key to filter on, usually a badge or text column; a list cell or comma-separated text counts as several values'),
        label: z.string().max(40).optional().describe('What the filter is, such as "Team"; the column label when left out'),
        type: z.enum(['select', 'buttons', 'dropdown']).optional().describe([
          'select (default): a button opening a list to tick any number of values, with counts and a search box for long lists;',
          'buttons: one row to pick a single value, only for a table with one filter of 2 to 5 values; dropdown is the same as select',
        ].join(' ')),
        options: z.array(z.union([
          z.string().max(60),
          z.object({
            value: z.string().min(1).max(60).describe('The value rows are compared with'),
            label: z.string().max(40).optional().describe('The text shown; the value when left out'),
            icon: artifactsIcon.optional(),
            emoji: artifactsEmojiText.optional(),
          }),
        ])).min(1).max(40).optional().describe('The values to offer, in order, as texts or { value, label, icon, emoji }; the distinct values of the column when left out'),
      })).max(8).optional().describe('Filters on one row above the table, each with a count per value; they combine with search, sort and pages. More than 3 sit behind one Filters button'),
      where: artifactsWhere,
      pageSize: z.number().int().min(5).max(100).optional().describe('Rows per page, 20 when left out'),
      search: z.boolean().optional().describe('Show the search box; on by default'),
      sort: z.object({ key: z.string(), direction: z.enum(['asc', 'desc']) }).optional().describe('The starting sort'),
      groupBy: z.string().optional().describe('A column key: rows with the same value sit under one heading with their count and the sums of money and number columns'),
      editable: z.boolean().optional().describe([
        'Lets people add, edit and remove rows on the page: an Add button above the table and an Edit button in each row\'s panel, saved like other inputs.',
        'Needs rows bound with { "$state": "/path" } to a list of objects; badge fields offer the tones, filter options and values already in the column',
      ].join(' ')),
    }),
    description: [
      'A data table for many records (up to 5000 rows): typed columns (text, number, money, percent, date, badge, link, progress, avatar), numbers aligned right,',
      'sorting by clicking a header, a search box, select filters to tick any number of values (any count of filters stays on one row), pagination with "1–20 of 312"',
      'and an optional groupBy. Each row maps column keys to text, numbers, lists of texts or null; empty cells show a dash. Link cells show labelKey or the host;',
      'urlKey turns any other column into links, such as a name or avatar that opens its profile.',
      'A row opens on click into a panel with its detail columns and the table\'s children: any blocks, read from the open row with { "$item": "key" },',
      'saved onto it with { "$bindItem": "key" }, and nested tables with rows: { "$item": "key" } or where: { "seller": { "$item": "name" } }.',
      'Use Table instead for a handful of plain rows.',
    ].join(' '),
  },
  Accordion: {
    props: z.object({
      items: z.array(z.object({
        title: z.string().min(1).max(160),
        icon: artifactsIcon.optional(),
      })).min(1).max(30),
      open: z.number().int().min(-1).optional().describe('The index of the item open at first; 0 when left out, -1 for all closed'),
    }),
    description: 'Titled items that open one at a time, like an FAQ or details per topic. One child per item, in the same order; use Text or Markdown for plain answers, a Stack for several blocks.',
  },
  Steps: {
    props: z.object({
      steps: z.array(z.object({
        title: z.string().min(1).max(80),
        description: z.string().max(200).optional(),
        error: z.string().max(200).optional().describe('Marks the step as failed with this message'),
      })).min(2).max(10),
      current: z.number().int().min(0).describe('The index of the step in progress; steps before it show as done; the number of steps means all done'),
      orientation: z.enum(['horizontal', 'vertical']).optional(),
    }),
    description: 'Progress through ordered stages, such as a project, an application or a move: numbered markers, done steps ticked, the current one ringed, failed ones marked. Horizontal (default) folds to markers with the current label on narrow screens.',
  },
  Code: {
    props: z.object({
      code: z.string().min(1).max(20_000),
      language: z.string().max(20).optional().describe('Such as ts, json, bash, sql or css; light colouring for common languages'),
      filename: z.string().max(120).optional(),
      maxLines: z.number().int().min(3).max(200).optional().describe('Fold longer code to this many lines with a button to show all'),
    }),
    description: 'A block of code or a command with a copy button, an optional file name and language, and light colouring.',
  },
  Quote: {
    props: z.object({
      text: z.string().min(1).max(1000),
      author: z.string().max(80).optional(),
      source: z.string().max(120).optional().describe('Where it comes from or who the author is, such as a book or a role'),
      url: artifactsLink.optional(),
    }),
    description: 'A quotation set large, with an optional author, source and link.',
  },
  People: {
    props: z.object({
      people: z.array(z.object({
        name: z.string().min(1).max(80),
        role: z.string().max(80).optional(),
        avatar: artifactsImage.optional().describe('An https photo link; initials when left out or when it fails to load'),
        url: artifactsLink.optional().describe('Makes the name a link'),
        roleUrl: artifactsLink.optional().describe('Makes the role line a link, such as the shop or team it names'),
        status: z.string().max(40).optional().describe('A short state such as "Away" or "Owner"'),
      }).catchall(artifactsCell).describe('Extra keys such as team are not shown; where filters on them')).min(1).max(60),
      layout: z.enum(['list', 'grid', 'stack']).optional().describe('list (default) rows, grid cards, or stack for overlapping avatars with a count'),
      max: z.number().int().min(1).max(20).optional().describe('For stack: how many avatars show before "+N"'),
      where: artifactsWhere,
      pageSize: artifactsPageSize.describe('For list and grid: people per page, all when left out'),
    }),
    description: 'People, brands or shops with a name, role line, photo or initials and status, the name and role each an optional link: as rows, cards or an overlapping avatar stack. Optional where and pageSize.',
  },
  Features: {
    props: z.object({
      items: z.array(z.object({
        icon: artifactsIcon,
        title: z.string().min(1).max(80),
        text: z.string().max(300).optional(),
        url: artifactsLink.optional().describe('Makes the title a link'),
      })).min(1).max(12),
      columns: z.enum(['2', '3', '4']).optional().describe('3 when left out; fewer on narrow screens'),
    }),
    description: 'A grid of tiles, each an icon from the fixed list with a title and a short text: highlights, goals, services or what is included.',
  },
  Kanban: {
    props: z.object({
      columns: z.array(z.object({
        title: z.string().min(1).max(60),
        tone: artifactsTone.optional(),
        cards: z.array(z.object({
          title: z.string().min(1).max(160),
          description: z.string().max(300).optional(),
          tags: z.array(z.object({ text: z.string().max(30), tone: artifactsTone.optional() })).max(4).optional(),
          meta: z.string().max(60).optional().describe('A short line such as a due date'),
          assignee: z.string().max(60).optional().describe('A name, shown as initials'),
          url: artifactsLink.optional().describe('Makes the title a link, such as the issue or deal'),
        }).catchall(artifactsCell).describe('Extra keys such as priority are not shown; where filters on them')).max(50),
      })).min(1).max(6),
      where: artifactsWhere.describe('Show only cards whose key equals the value, such as { "assignee": { "$state": "/who" } }; "all" or empty shows every card'),
    }),
    description: [
      'A board of up to six columns of cards, like To do, Doing and Done or a sales pipeline. Each card has a title, description, tags, a meta line and an assignee.',
      'Optional where filters cards by a Filters block. Columns scroll sideways on phones.',
    ].join(' '),
  },
  Agenda: {
    props: z.object({
      events: z.array(z.object({
        date: artifactsDate,
        time: z.string().max(20).optional().describe('Such as "09:30" or "09:30–10:15"; all day when left out'),
        title: z.string().min(1).max(160),
        location: z.string().max(120).optional(),
        description: z.string().max(300).optional(),
        tone: artifactsTone.optional(),
        url: artifactsLink.optional().describe('Makes the title a link, such as the booking or the call'),
      })).min(1).max(200),
    }),
    description: 'Events grouped by day in date order, each day with a date tile, each event with a time, title, location, description and tone. Use for trips, schedules, plans and deadlines.',
  },
  Comparison: {
    props: z.object({
      options: z.array(z.object({
        name: z.string().min(1).max(40),
        price: z.string().max(30).optional(),
        period: z.string().max(30).optional().describe('Such as "/month"'),
        description: z.string().max(160).optional(),
        highlight: z.boolean().optional().describe('Marks the recommended option'),
        url: artifactsLink.optional().describe('Makes the name a link, such as the product page'),
      })).min(2).max(5),
      rows: z.array(z.object({
        label: z.string().min(1).max(80),
        hint: z.string().max(160).optional(),
        values: z.array(z.union([z.boolean(), z.string(), z.number(), z.null()])).describe('One per option, in order: true shows a tick, false or null a dash'),
      })).min(1).max(40),
    }),
    description: 'Compares two to five options side by side, such as plans, products or flats: a header per option with price and description, then rows of values where true is a tick and false a dash. Highlight marks the pick.',
  },
  KeyNumbers: {
    props: z.object({
      items: z.array(z.object({
        label: z.string().min(1).max(60),
        value: z.union([z.string(), z.number()]),
        prefix: z.string().max(4).optional(),
        suffix: z.string().max(12).optional().describe('A unit such as %, km or /5, set smaller'),
        context: z.string().max(80).optional(),
      })).min(2).max(6),
    }),
    description: 'A band of two to six headline numbers side by side with a label, a unit and a context line, divided by thin rules. Lighter than Metric cards; good under a page title.',
  },
  Countdown: {
    props: z.object({
      to: z.iso.datetime({ offset: true }).describe('The moment, with a time zone offset, such as 2026-12-24T18:00:00+00:00'),
      title: z.string().max(80).optional(),
      doneText: z.string().max(80).optional().describe('Shown once the moment has passed'),
    }),
    description: 'Days, hours, minutes and seconds left until a moment such as a trip, a launch or a deadline, with the date below.',
  },
  Video: {
    props: z.object({
      url: z.string().regex(artifactsBlocksVideo).describe('A YouTube or Vimeo link, such as https://www.youtube.com/watch?v=ID or https://vimeo.com/ID'),
      title: z.string().max(120),
      caption: z.string().max(300).optional(),
    }),
    description: 'A YouTube or Vimeo video played in the page. Only YouTube and Vimeo links work.',
  },
  Files: {
    props: z.object({
      items: z.array(z.object({
        title: z.string().min(1).max(120),
        url: artifactsLink,
        kind: z.enum(['link', 'pdf', 'doc', 'sheet', 'slides', 'image', 'video', 'audio', 'archive', 'code']).optional(),
        description: z.string().max(200).optional(),
        meta: z.string().max(40).optional().describe('Such as "2.4 MB" or "Updated 3 Nov"'),
      }).catchall(artifactsCell).describe('Extra keys such as topic are not shown; where filters on them')).min(1).max(30),
      columns: z.enum(['1', '2', '3']).optional().describe('2 when left out'),
      where: artifactsWhere,
      pageSize: artifactsPageSize.describe('Files per page, all when left out'),
    }),
    description: [
      'Cards for files and links with a kind icon (pdf, doc, sheet, slides, image, video, audio, archive, code or link), title, description, meta and the site name.',
      'Each opens in a new tab. Optional where and pageSize.',
    ].join(' '),
  },
  Avatar: {
    props: z.object({
      name: z.string().min(1).max(80),
      src: artifactsImage.optional().describe('An https picture link; the emoji or initials when left out or when it fails to load'),
      emoji: artifactsEmojiText.optional().describe('Shown instead of initials when there is no picture'),
      description: z.string().max(120).optional().describe('A line under the name, such as a role'),
      size: z.enum(['sm', 'md', 'lg']).optional().describe('md when left out'),
      tone: artifactsTone.optional().describe('A status dot on the picture: success (online), warning (away), danger (busy), neutral (offline)'),
      url: artifactsLink.optional().describe('Makes the name a link'),
    }),
    description: 'One person or thing with a round picture (or an emoji, or initials), a name, an optional line under it and an optional status dot. Sizes sm, md and lg.',
  },
  AvatarGroup: {
    props: z.object({
      people: z.array(z.object({
        name: z.string().min(1).max(80),
        src: artifactsImage.optional(),
        emoji: artifactsEmojiText.optional(),
      })).min(1).max(60),
      max: z.number().int().min(1).max(20).optional().describe('How many pictures show before "+N"; 5 when left out'),
      label: z.string().max(80).optional().describe('A short line beside the pictures, such as "12 going"; the first names when left out'),
    }),
    description: 'Overlapping round pictures (or emoji, or initials) with a "+N" for the rest and a short line beside them: a team, attendees or who is in.',
  },
  Filters: {
    props: z.object({
      value: z.string().describe('The chosen option value, "all" for everything. Bind it with $bindState at /path and point where props at the same path'),
      options: z.array(z.object({
        value: z.string().min(1).max(60).describe('The value rows are compared with'),
        label: z.string().max(40).optional().describe('The button text; the value when left out'),
        icon: artifactsIcon.optional(),
        emoji: artifactsEmojiText.optional(),
        count: z.number().int().nonnegative().optional().describe('A small number beside the label'),
      })).min(1).max(12),
      all: z.string().max(40).optional().describe('The text of the first button that shows everything; "All" when left out'),
      label: z.string().max(60).optional().describe('What the filter is, read by screen readers'),
    }),
    description: [
      'A row of buttons to pick one value, with "All" first, each with an optional icon or emoji and count. Bind value with $bindState at /path, then give DataTable,',
      'Table, List, People, Files or Kanban blocks where: { "key": { "$state": "/path" } } so one row of buttons filters them all.',
    ].join(' '),
  },
  Dropdown: {
    props: z.object({
      label: z.string().min(1).max(40),
      icon: artifactsIcon.optional(),
      emoji: artifactsEmojiText.optional(),
      items: z.array(z.object({
        label: z.string().min(1).max(60),
        url: artifactsLink,
        icon: artifactsIcon.optional(),
        emoji: artifactsEmojiText.optional(),
        description: z.string().max(120).optional(),
      })).min(1).max(20),
    }),
    description: 'A button that opens a menu of links, each with a label, an optional icon or emoji and a description; each opens in a new tab. For a saved choice use Select.',
  },
  Html: {
    props: z.object({
      html: z.string().trim().min(1).max(200_000).describe('An HTML fragment with inline style and script; it runs in a sandbox with no network, like an HTML page'),
      title: z.string().max(80).optional().describe('What it shows, read by screen readers'),
    }),
    description: [
      'A piece of custom HTML, CSS and JS inside a blocks page, for the one part no block can show, such as a small custom visual or a calculator.',
      'It runs sandboxed like an HTML page: inline only, no network, eval and innerHTML allowed, the app colours and o- classes available, and it grows to fit.',
    ].join(' '),
  },
  Icon: {
    props: z.object({
      icon: artifactsIcon,
      label: z.string().max(80).optional().describe('A short bold line beside the icon'),
      description: z.string().max(200).optional().describe('A muted line under the label'),
      tone: artifactsTone.optional().describe('The tint: neutral (default), info, success, warning or danger'),
      size: z.enum(['sm', 'md', 'lg']).optional().describe('md when left out'),
    }),
    description: [
      'One icon from the fixed list in a soft tinted square, with an optional label and description beside it.',
      'Use it for feature rows, section headers and a status at a glance; put several in a Grid or a Stack for a row of points.',
    ].join(' '),
  },
} as const;

export type ArtifactsBlocksName = keyof typeof artifactsBlocksComponents;
export type ArtifactsBlocksProps<K extends ArtifactsBlocksName> = z.infer<(typeof artifactsBlocksComponents)[K]['props']>;
export type ArtifactsBlocksIcon = z.infer<typeof artifactsIcon>;
export type ArtifactsBlocksDataTableCell = z.infer<typeof artifactsDataTableCell>;
export type ArtifactsBlocksDataTableColumn = ArtifactsBlocksProps<'DataTable'>['columns'][number];
export type ArtifactsBlocksDataTableRows = ArtifactsBlocksProps<'DataTable'>['rows'];
export type ArtifactsBlocksDataTableRow = Exclude<ArtifactsBlocksDataTableRows, { keys: string[] }>[number];
export type ArtifactsBlocksDataTableFilter = NonNullable<ArtifactsBlocksProps<'DataTable'>['filters']>[number];

export interface ArtifactsBlocksDataTableOption {
  value: string;
  label: string;
  icon?: ArtifactsBlocksIcon;
  emoji?: string;
  count: number;
}

export interface ArtifactsBlocksDataTableFacet {
  key: string;
  label: string;
  single: boolean;
  picked: string[];
  total: number;
  options: ArtifactsBlocksDataTableOption[];
}
export type ArtifactsBlocksPerson = ArtifactsBlocksProps<'People'>['people'][number];
