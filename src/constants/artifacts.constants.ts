import { CHART } from '@/constants/chart.constants';
import { ICONS } from '@/constants/icons.constants';
import FileArchiveIcon from '~icons/lucide/file-archive';
import FileAudioIcon from '~icons/lucide/file-audio';
import FileCodeIcon from '~icons/lucide/file-code';
import FileImageIcon from '~icons/lucide/file-image';
import FileSpreadsheetIcon from '~icons/lucide/file-spreadsheet';
import FileTextIcon from '~icons/lucide/file-text';
import FileTypeIcon from '~icons/lucide/file-type';
import FileVideoIcon from '~icons/lucide/file-video';
import GlobeIcon from '~icons/lucide/globe';
import KeyRound from '~icons/lucide/key-round';
import LinkIcon from '~icons/lucide/link';
import LockIcon from '~icons/lucide/lock';
import PresentationIcon from '~icons/lucide/presentation';

export const ARTIFACTS_UI = {
  formats: {
    number: new Intl.NumberFormat(CHART.locale, { maximumFractionDigits: 2 }),
    tick: new Intl.NumberFormat(CHART.locale, { notation: 'compact', maximumFractionDigits: 2 }),
  },
  visibility: {
    private: { label: 'Private', Icon: LockIcon, who: 'Only you can open it, signed in.', confirm: 'Make it private' },
    public: { label: 'Public', Icon: GlobeIcon, who: 'Anyone with the link can open it, with no sign-in and no passcode.', confirm: 'Make it public' },
    passcode: { label: 'Passcode', Icon: KeyRound, who: 'Anyone with the link who types the passcode can open it.', confirm: 'Turn on the passcode' },
  },
  visibilityOrder: ['private', 'public', 'passcode'],
  passcode: { digits: 6, min: 4, max: 64 },
  gaps: { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' },
  columns: { '1': 'grid-cols-1', '2': 'sm:grid-cols-2', '3': 'sm:grid-cols-2 lg:grid-cols-3', '4': 'sm:grid-cols-2 lg:grid-cols-4' },
  headings: {
    '1': 'text-xl leading-tight font-semibold tracking-[-0.02em] text-balance',
    '2': 'text-base leading-snug font-semibold tracking-[-0.01em] text-balance',
    '3': 'text-sm leading-snug font-semibold text-balance',
  },
  badges: { secondary: 'neutral', outline: 'info', destructive: 'danger', success: 'success', warning: 'warning' },
  alerts: { default: 'info', success: 'success', warning: 'warning', destructive: 'danger' },
  icons: ICONS,
  fileKinds: {
    link: LinkIcon,
    pdf: FileTextIcon,
    doc: FileTypeIcon,
    sheet: FileSpreadsheetIcon,
    slides: PresentationIcon,
    image: FileImageIcon,
    video: FileVideoIcon,
    audio: FileAudioIcon,
    archive: FileArchiveIcon,
    code: FileCodeIcon,
  },
  tones: {
    neutral: 'bg-(--border-strong)',
    info: 'bg-info',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
  },
  code: {
    keywords: /^(?:abstract|as|async|await|break|case|catch|class|const|continue|def|default|delete|do|elif|else|enum|export|extends|finally|fn|for|from|func|function|if|implements|import|in|instanceof|interface|let|match|mut|new|of|package|private|protected|pub|public|readonly|return|self|static|struct|switch|then|throw|try|type|typeof|use|var|void|while|with|yield|SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|JOIN|LEFT|ON|GROUP|ORDER|BY|LIMIT|AND|OR|NOT|AS|CREATE|TABLE|true|false|null|undefined|None|True|False|nil)$/,
    tokens: /\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*|<!--[\s\S]*?-->|`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$-]*\b/g,
    colors: {
      comment: 'text-(--text-muted) italic',
      string: 'text-[oklch(46%_0.13_150)] dark:text-[oklch(77%_0.15_150)]',
      number: 'text-[oklch(50%_0.14_55)] dark:text-[oklch(80%_0.14_75)]',
      keyword: 'text-[oklch(48%_0.15_285)] dark:text-[oklch(78%_0.16_285)]',
      function: 'text-[oklch(43%_0.12_25)] dark:text-[oklch(80%_0.13_25)]',
      property: 'text-[oklch(44%_0.12_85)] dark:text-[oklch(79%_0.12_85)]',
    },
    hashComments: new Set(['bash', 'sh', 'shell', 'zsh', 'py', 'python', 'yaml', 'yml', 'toml', 'rb', 'ruby']),
    keyed: new Set(['json', 'yaml', 'yml', 'css', 'toml']),
  },
  dataTable: { pageSize: 20, pageSizes: [10, 20, 50, 100], money: 'EUR', buttonsMax: 5, pillsMax: 3, searchFrom: 9, shortText: 24 },
  avatars: {
    xs: { box: 'size-6', initials: 'text-[8px]', emoji: 'text-xs', dot: 'size-2' },
    sm: { box: 'size-7', initials: 'text-[9px]', emoji: 'text-sm', dot: 'size-2' },
    md: { box: 'size-8', initials: 'text-[11px]', emoji: 'text-base', dot: 'size-2.5' },
    lg: { box: 'size-10', initials: 'text-xs', emoji: 'text-lg', dot: 'size-2.5' },
    xl: { box: 'size-14', initials: 'text-base', emoji: 'text-2xl', dot: 'size-3.5' },
  },
  avatarBlock: { sm: 'md', md: 'lg', lg: 'xl' },
  iconBlock: {
    tones: {
      neutral: 'bg-muted text-foreground/75 ring-border',
      info: 'bg-info/12 text-info ring-info/15 dark:bg-info/16',
      success: 'bg-success/12 text-success ring-success/15 dark:bg-success/16',
      warning: 'bg-warning/15 text-warning ring-warning/20 dark:bg-warning/16',
      danger: 'bg-destructive/12 text-destructive ring-destructive/15 dark:bg-destructive/16',
    },
    sizes: {
      sm: { box: 'size-8 rounded-[10px] [&_svg]:size-4', gap: 'gap-2.5', label: 'text-sm', description: 'text-xs' },
      md: { box: 'size-10 rounded-xl [&_svg]:size-5', gap: 'gap-3', label: 'text-sm', description: 'text-xs' },
      lg: { box: 'size-12 rounded-2xl [&_svg]:size-6', gap: 'gap-3.5', label: 'text-base', description: 'text-sm' },
    },
  },

  list: 'flex min-w-0 flex-col divide-y divide-border/60 overflow-hidden rounded-(--radius-panel) border bg-card',
  row: 'flex min-w-0 items-center gap-3 px-4 py-3 text-sm',
  label: 'text-sm font-medium',
  heatmapUnit: { one: 'activity', other: 'activities' },
  html: {
    message: { height: 'artifacts.html-height', link: 'artifacts.html-link', theme: 'artifacts.html-theme' },
    height: { initial: 320, min: 80, max: 1600 },
    tokens: [
      '--background', '--foreground', '--card', '--card-foreground', '--popover', '--popover-foreground',
      '--primary', '--primary-foreground', '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
      '--accent', '--accent-foreground', '--destructive', '--success', '--warning', '--info',
      '--border', '--border-strong', '--border-subtle', '--input', '--ring',
      '--surface', '--surface-muted', '--surface-raised', '--text-secondary', '--text-muted',
      '--tone-teal', '--tone-sky', '--tone-orchid', '--tone-violet', '--tone-rose', '--tone-amber', '--tone-green',
      '--series-1', '--series-2', '--series-3', '--series-4',
      '--radius', '--radius-control', '--radius-panel', '--radius-surface',
      '--shadow-resting', '--shadow-raised', '--shadow-floating',
    ],
    embedded: '\n:root{color-scheme:normal!important}html{background:transparent;accent-color:var(--primary)}input,select,textarea{padding:4px 8px;border:1px solid var(--border);border-radius:8px;background:var(--surface,transparent);color:var(--foreground);font:inherit}',
    imageSources: 'img-src data: blob:',
    assetsPath: '/a/',
    csp: "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'",
    base: [
      ':root{color-scheme:light dark}',
      "html{background:var(--background,transparent);color:var(--foreground,inherit);font-family:'Inter Variable',Inter,ui-sans-serif,system-ui,sans-serif;font-size:13px;line-height:1.4;letter-spacing:-0.01em;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}",
      'body{margin:0;display:flow-root}*,*::before,*::after{box-sizing:border-box}img,svg,canvas{max-width:100%}',
      'a{color:inherit;font-weight:500;text-decoration:underline;text-decoration-color:color-mix(in oklab,currentColor 30%,transparent);text-underline-offset:2px}',
      ':is(button,select,summary,[role=button],[role=tab],[role=option],[role=menuitem]):not(:disabled,[aria-disabled=true]){cursor:pointer}',
    ].join('\n'),
    kit: [
      '.o-stack{display:flex;flex-direction:column;gap:16px}',
      '.o-row-wrap{display:flex;flex-wrap:wrap;align-items:center;gap:8px}',
      '.o-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}',
      '.o-h1{margin:0;font-size:20px;line-height:1.25;font-weight:600;letter-spacing:-0.02em;text-wrap:balance}',
      '.o-h2{margin:0;font-size:16px;line-height:1.35;font-weight:600;letter-spacing:-0.01em;text-wrap:balance}',
      '.o-h3{margin:0;font-size:14px;line-height:1.35;font-weight:600;text-wrap:balance}',
      '.o-text{margin:0;font-size:14px;text-wrap:pretty}',
      '.o-muted{font-size:12px;line-height:16px;color:var(--muted-foreground)}',
      '.o-card{display:flex;flex-direction:column;gap:12px;padding:16px 20px 20px;border:1px solid var(--border);border-radius:var(--radius-panel,26px);background:var(--card);color:var(--card-foreground);box-shadow:var(--shadow-resting)}',
      '.o-title{font-size:14px;font-weight:500}',
      '.o-list{display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--border);border-radius:var(--radius-panel,26px);background:var(--card)}',
      '.o-row{display:flex;align-items:center;gap:12px;padding:12px 16px;font-size:14px}',
      '.o-row+.o-row{border-top:1px solid color-mix(in oklab,var(--border) 60%,transparent)}',
      '.o-row>:first-child{flex:1;min-width:0}',
      '.o-stat{display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.o-label{font-size:13px;line-height:18px;color:var(--muted-foreground)}',
      '.o-value{font-size:28px;line-height:1;font-weight:500;letter-spacing:-0.03em;font-variant-numeric:tabular-nums}',
      '.o-up{font-size:12px;line-height:16px;color:var(--success)}',
      '.o-down{font-size:12px;line-height:16px;color:var(--destructive)}',
      '.o-badge{display:inline-flex;align-items:center;min-height:20px;padding:0 8px;border-radius:5px;background:color-mix(in oklab,var(--text-secondary) 10%,var(--surface));color:color-mix(in oklab,var(--text-secondary) 84%,var(--foreground));font-size:11px;font-weight:500;line-height:1}',
      '.o-button{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 12px;border:1px solid var(--border);border-radius:9999px;background:var(--card);color:var(--foreground);font:inherit;font-size:14px;font-weight:500}',
      '.o-button:hover{background:var(--accent)}',
      '.o-table{width:100%;border-collapse:collapse;font-size:13px}',
      '.o-table th{height:36px;padding:0 16px;text-align:left;font-size:12px;font-weight:400;color:var(--muted-foreground);white-space:nowrap;border-bottom:1px solid var(--border)}',
      '.o-table td{height:44px;padding:0 16px;border-bottom:1px solid color-mix(in oklab,var(--border) 60%,transparent);white-space:nowrap;font-variant-numeric:tabular-nums}',
      '.o-table tr:last-child td{border-bottom:0}',
    ].join(''),
    bootstrap: `(function () {
  var post = function (message) { window.parent.postMessage(message, '*'); };
  var previous = 0;
  var resize = function () {
    var height = Math.ceil(document.body.getBoundingClientRect().height);

    if (height !== previous) {
      previous = height;
      post({ type: 'artifacts.html-height', height: height });
    }
  };

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent || !event.data || event.data.type !== 'artifacts.html-theme') {
      return;
    }

    var root = document.documentElement;
    root.style.colorScheme = event.data.appearance;
    root.classList.toggle('dark', event.data.appearance === 'dark');
    Object.keys(event.data.tokens).forEach(function (name) { root.style.setProperty(name, String(event.data.tokens[name])); });

    if (document.body) {
      previous = 0;
      resize();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    new ResizeObserver(resize).observe(document.body);
    resize();
  });

  document.addEventListener('click', function (event) {
    var link = event.target instanceof Element ? event.target.closest('a') : null;

    if (link === null) {
      return;
    }

    var href = link.getAttribute('href');

    if (href && href.indexOf('#') === 0) {
      return;
    }

    event.preventDefault();

    if (event.isTrusted && href) {
      post({ type: 'artifacts.html-link', url: href });
    }
  });
})();`,
  },
} as const;
