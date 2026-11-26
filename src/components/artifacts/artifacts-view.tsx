'use client';

import { defineCatalog } from '@json-render/core';
import { defineRegistry, JSONUIProvider, Renderer } from '@json-render/react';
import { schema } from '@json-render/react/schema';
import { cn } from 'cn';
import { Children } from 'react';
import { match, P } from 'ts-pattern';
import { ArtifactsAgenda } from '@/components/artifacts/artifacts-agenda';
import { ArtifactsAvatar } from '@/components/artifacts/artifacts-avatar';
import { ArtifactsAvatarGroup } from '@/components/artifacts/artifacts-avatar-group';
import { ArtifactsBarChart } from '@/components/artifacts/artifacts-bar-chart';
import { ArtifactsChartHeader } from '@/components/artifacts/artifacts-chart-header';
import { ArtifactsChecklist } from '@/components/artifacts/artifacts-checklist';
import { ArtifactsCountdown } from '@/components/artifacts/artifacts-countdown';
import { ArtifactsDataTable } from '@/components/artifacts/artifacts-data-table';
import { ArtifactsDropdown } from '@/components/artifacts/artifacts-dropdown';
import { ArtifactsFeatures } from '@/components/artifacts/artifacts-features';
import { ArtifactsFiles } from '@/components/artifacts/artifacts-files';
import { ArtifactsFilters } from '@/components/artifacts/artifacts-filters';
import { ArtifactsHeatmap } from '@/components/artifacts/artifacts-heatmap';
import { ArtifactsHtmlFrame } from '@/components/artifacts/artifacts-html-frame';
import { ArtifactsIcon } from '@/components/artifacts/artifacts-icon';
import { ArtifactsKeyValue } from '@/components/artifacts/artifacts-key-value';
import { ArtifactsLineChart } from '@/components/artifacts/artifacts-line-chart';
import { ArtifactsList } from '@/components/artifacts/artifacts-list';
import { ArtifactsMetric } from '@/components/artifacts/artifacts-metric';
import { ArtifactsNotes } from '@/components/artifacts/artifacts-notes';
import { ArtifactsPeople } from '@/components/artifacts/artifacts-people';
import { ArtifactsQuote } from '@/components/artifacts/artifacts-quote';
import { ArtifactsRanked } from '@/components/artifacts/artifacts-ranked';
import { ArtifactsSelect } from '@/components/artifacts/artifacts-select';
import { ArtifactsTable } from '@/components/artifacts/artifacts-table';
import { ArtifactsTabs } from '@/components/artifacts/artifacts-tabs';
import { ArtifactsTimeline } from '@/components/artifacts/artifacts-timeline';
import { ArtifactsToggle } from '@/components/artifacts/artifacts-toggle';
import { ArtifactsVideo } from '@/components/artifacts/artifacts-video';
import { Accordion } from '@/components/ui/accordion';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from '@/components/ui/code-block';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ComparisonTable } from '@/components/ui/comparison-table';
import { DonutChart } from '@/components/ui/donut-chart';
import { Gauge } from '@/components/ui/gauge';
import { KanbanBoard } from '@/components/ui/kanban-board';
import { Markdown } from '@/components/ui/markdown';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Sparkline } from '@/components/ui/sparkline';
import { SplitBar } from '@/components/ui/split-bar';
import { StatsBand } from '@/components/ui/stats-band';
import { StatusDot } from '@/components/ui/status-dot';
import { Stepper } from '@/components/ui/stepper';
import { TextLink } from '@/components/ui/text-link';
import { UsageMeter } from '@/components/ui/usage-meter';
import { WaffleChart } from '@/components/ui/waffle-chart';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { artifactsBlocksComponents } from '@/types/artifacts-blocks.types';
import { chartTone } from '@/utils/chart.utils';
import { dataTableBound, dataTableWhere } from '@/utils/data-table.utils';
import ChevronDown from '~icons/lucide/chevron-down';
import ExternalLink from '~icons/lucide/external-link';
import type { ArtifactsSpec } from '@/types/artifacts.types';
import type { StateStore } from '@json-render/core';

const { registry } = defineRegistry(defineCatalog(schema, { components: artifactsBlocksComponents, actions: {} }), {
  components: {
    Stack: ({ props, children }) => (
      <div className={cn('flex min-w-0', props.direction === 'horizontal' ? 'flex-row flex-wrap items-start' : 'flex-col', ARTIFACTS_UI.gaps[props.gap ?? 'md'])}>{children}</div>
    ),
    Grid: ({ props, children }) => <div className={cn('grid min-w-0 gap-4', ARTIFACTS_UI.columns[props.columns ?? '2'])}>{children}</div>,
    Card: ({ props, children }) => (
      <Card className="min-w-0">
        {props.title || props.description ? (
          <CardHeader>
            {props.title ? <CardTitle>{props.title}</CardTitle> : null}
            {props.description ? <CardDescription>{props.description}</CardDescription> : null}
          </CardHeader>
        ) : null}
        <CardContent>
          <div className="flex min-w-0 flex-col gap-4">{children}</div>
        </CardContent>
      </Card>
    ),
    Heading: ({ props }) => match(props.level ?? '2')
      .with('1', () => <h1 className={ARTIFACTS_UI.headings['1']}>{props.text}</h1>)
      .with('2', () => <h2 className={ARTIFACTS_UI.headings['2']}>{props.text}</h2>)
      .with('3', () => <h3 className={ARTIFACTS_UI.headings['3']}>{props.text}</h3>)
      .exhaustive(),
    Text: ({ props }) => <p className={cn('text-sm leading-relaxed text-pretty', props.variant === 'muted' && 'text-muted-foreground')}>{props.text}</p>,
    Stat: ({ props }) => (
      <ArtifactsMetric
        change={props.change}
        context={props.hint}
        label={props.label}
        tone={props.trend === 'flat' ? undefined : props.trend}
        value={props.value}
      />
    ),
    Badge: ({ props }) => <Badge variant={ARTIFACTS_UI.badges[props.variant ?? 'secondary']}>{props.text}</Badge>,
    List: ({ props }) => <ArtifactsList block={props} />,
    Table: ({ props }) => <ArtifactsTable block={props} />,
    Progress: ({ props }) => (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span>{props.label}</span>
          <span className="text-muted-foreground tabular-nums">{`${ARTIFACTS_UI.formats.number.format(props.value)}%`}</span>
        </div>
        <Progress
          label={props.label}
          max={100}
          value={props.value}
        />
        {props.hint ? <span className="text-xs text-muted-foreground">{props.hint}</span> : null}
      </div>
    ),
    Separator: () => <Separator />,
    LineChart: ({ props }) => <ArtifactsLineChart {...props} />,
    AreaChart: ({ props }) => <ArtifactsLineChart area {...props} />,
    BarChart: ({ props }) => <ArtifactsBarChart block={props} />,
    Checklist: ({ props, bindings }) => <ArtifactsChecklist binding={bindings?.items} items={props.items} />,
    Toggle: ({ props, bindings }) => (
      <ArtifactsToggle
        binding={bindings?.checked}
        checked={props.checked ?? false}
        description={props.description}
        label={props.label}
      />
    ),
    Tabs: ({ props, children }) => <ArtifactsTabs tabs={props.tabs}>{children}</ArtifactsTabs>,
    Section: ({ props, children }) => (
      <Collapsible className="group/section flex min-w-0 flex-col" defaultOpen={props.open ?? true}>
        <CollapsibleTrigger>
          <span className="min-w-0 flex-1 truncate">{props.title}</span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-standard) ease-(--ease-standard) group-data-[state=open]/section:rotate-180 motion-reduce:transition-none" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-4 pt-2">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    ),
    Markdown: ({ props }) => <Markdown text={props.text} />,
    KeyValue: ({ props }) => <ArtifactsKeyValue items={props.items} />,
    Status: ({ props }) => (
      <div className="flex items-start gap-2.5">
        <span className="flex h-5 items-center">
          <StatusDot label={props.label} variant={props.state} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm leading-5 font-medium">{props.label}</span>
          {props.description ? <span className="text-xs text-muted-foreground">{props.description}</span> : null}
        </div>
      </div>
    ),
    Alert: ({ props }) => (
      <Alert title={props.title} tone={ARTIFACTS_UI.alerts[props.variant ?? 'default']}>
        {props.description}
      </Alert>
    ),
    LinkButton: ({ props }) => (
      <Button
        asChild
        className="self-start"
        size="sm"
        variant="outline"
      >
        <a
          href={props.url}
          rel="noreferrer"
          target="_blank"
        >
          {props.label}
          <ExternalLink aria-hidden="true" />
        </a>
      </Button>
    ),
    Image: ({ props }) => (
      <figure className="m-0 flex flex-col gap-2">
        <img
          alt={props.alt}
          className="max-h-96 w-full rounded-(--radius-panel) border object-cover"
          loading="lazy"
          src={props.url}
        />
        {props.caption ? <figcaption className="text-xs text-muted-foreground">{props.caption}</figcaption> : null}
      </figure>
    ),
    PieChart: ({ props }) => (
      <div className="grid min-w-0 gap-4">
        <ArtifactsChartHeader title={props.title} />
        <DonutChart
          data={props.data.map((part, index) => ({ key: String(index), label: part.label, value: part.value }))}
          formatValue={(value) => ARTIFACTS_UI.formats.number.format(value)}
          label={props.title ?? 'Chart'}
          totalLabel={props.centerLabel}
        />
        {props.caption ? <p className="text-xs text-muted-foreground">{props.caption}</p> : null}
      </div>
    ),
    SplitBar: ({ props }) => (
      <SplitBar
        description={props.description}
        formatValue={(value) => `${ARTIFACTS_UI.formats.number.format(value)}${props.unit ?? ''}`}
        segments={props.segments.map((segment, index) => ({ key: String(index), label: segment.label, value: segment.value }))}
        title={props.title}
        totalLabel={props.totalLabel}
      />
    ),
    WaffleChart: ({ props }) => (
      <div className="grid min-w-0 gap-4">
        <ArtifactsChartHeader title={props.title} />
        <WaffleChart
          data={props.data.map((part, index) => ({ key: String(index), label: part.label, value: part.value }))}
          formatValue={(value) => `${ARTIFACTS_UI.formats.number.format(value)}${props.unit ?? ''}`}
          label={props.title ?? 'Chart'}
        />
        {props.caption ? <p className="text-xs text-muted-foreground">{props.caption}</p> : null}
      </div>
    ),
    RankedList: ({ props }) => (
      <div className="grid min-w-0 gap-3">
        <ArtifactsChartHeader title={props.title} />
        <ArtifactsRanked formatValue={(value) => `${ARTIFACTS_UI.formats.number.format(value)}${props.unit ?? ''}`} rows={props.rows} />
      </div>
    ),
    Timeline: ({ props }) => <ArtifactsTimeline block={props} />,
    Select: ({ props, bindings }) => (
      <ArtifactsSelect
        binding={bindings?.value}
        label={props.label}
        options={props.options}
        value={props.value}
      />
    ),
    Notes: ({ props, bindings }) => (
      <ArtifactsNotes
        binding={bindings?.value}
        label={props.label}
        placeholder={props.placeholder}
        value={props.value ?? ''}
      />
    ),
    Metric: ({ props }) => (
      <ArtifactsMetric
        change={props.change}
        context={props.context}
        label={props.label}
        prefix={props.prefix}
        suffix={props.suffix}
        tone={props.change ? chartTone(props.change) : undefined}
        value={props.value}
      />
    ),
    Sparkline: ({ props }) => (
      <Sparkline
        change={props.change}
        data={props.data}
        label={props.label}
        value={props.value}
      />
    ),
    Gauge: ({ props }) => (
      <Gauge
        description={props.description}
        label={props.label}
        max={props.max}
        status={props.status}
        tone={props.tone}
        unit={props.unit}
        value={props.value}
      />
    ),
    UsageMeter: ({ props }) => (
      <UsageMeter
        caption={props.caption}
        parts={props.parts}
        title={props.title}
        total={props.total}
        unit={props.unit}
        used={props.used}
      />
    ),
    Heatmap: ({ props }) => (
      <ArtifactsHeatmap
        caption={props.caption}
        days={props.days}
        title={props.title}
      />
    ),
    DataTable: ({ props, bindings, children }) => <ArtifactsDataTable block={props} rowsPath={bindings?.rows}>{children}</ArtifactsDataTable>,
    Accordion: ({ props, children }) => {
      const panels = Children.toArray(children);

      return (
        <Accordion
          defaultOpen={props.open ?? 0}
          items={props.items.map((item, index) => {
            const Icon = item.icon ? ARTIFACTS_UI.icons[item.icon] : null;

            return { title: item.title, icon: Icon ? <Icon /> : undefined, content: <div className="flex flex-col gap-3">{panels.at(index)}</div> };
          })}
        />
      );
    },
    Steps: ({ props }) => (
      <Stepper
        current={props.current}
        orientation={props.orientation}
        steps={props.steps}
      />
    ),
    Code: ({ props }) => (
      <CodeBlock
        code={props.code}
        filename={props.filename}
        language={props.language}
        maxLines={props.maxLines}
      />
    ),
    Quote: ({ props }) => <ArtifactsQuote block={props} />,
    People: ({ props }) => <ArtifactsPeople block={props} />,
    Features: ({ props }) => <ArtifactsFeatures block={props} />,
    Kanban: ({ props }) => <KanbanBoard columns={props.columns.map((column) => ({ ...column, cards: dataTableWhere(column.cards, props.where) }))} />,
    Agenda: ({ props }) => <ArtifactsAgenda block={props} />,
    Comparison: ({ props }) => <ComparisonTable options={props.options} rows={props.rows} />,
    KeyNumbers: ({ props }) => <StatsBand formatValue={(value) => ARTIFACTS_UI.formats.number.format(value)} items={props.items} />,
    Countdown: ({ props }) => <ArtifactsCountdown block={props} />,
    Video: ({ props }) => <ArtifactsVideo block={props} />,
    Files: ({ props }) => <ArtifactsFiles block={props} />,
    Avatar: ({ props }) => (
      <div className="flex min-w-0 items-center gap-3">
        <ArtifactsAvatar
          emoji={props.emoji}
          name={props.name}
          size={ARTIFACTS_UI.avatarBlock[props.size ?? 'md']}
          src={props.src}
          tone={props.tone}
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className={cn('truncate font-medium', props.size === 'lg' ? 'text-base' : 'text-sm')}><TextLink href={props.url}>{props.name}</TextLink></span>
          {props.description ? <span className="truncate text-xs text-muted-foreground">{props.description}</span> : null}
        </span>
      </div>
    ),
    AvatarGroup: ({ props }) => (
      <ArtifactsAvatarGroup
        label={props.label}
        max={props.max ?? 5}
        people={props.people}
      />
    ),
    Filters: ({ props, bindings }) => <ArtifactsFilters binding={bindings?.value} block={props} />,
    Dropdown: ({ props }) => <ArtifactsDropdown block={props} />,
    Html: ({ props }) => (
      <ArtifactsHtmlFrame
        embedded
        html={props.html}
        title={props.title ?? 'Custom content'}
      />
    ),
    Icon: ({ props }) => <ArtifactsIcon block={props} />,
  },
});

interface ArtifactsViewProps {
  spec: ArtifactsSpec;
  store: StateStore;
  title: string;
}

export function ArtifactsView({ spec, store, title }: ArtifactsViewProps) {
  return match(spec)
    .with({ html: P.string }, ({ html }) => (
      <ArtifactsHtmlFrame
        html={html}
        key={html}
        title={title}
      />
    ))
    .with({ root: P.string }, (structured) => (
      <JSONUIProvider
        key={JSON.stringify(structured.elements)}
        registry={registry}
        store={store}
      >
        <Renderer registry={registry} spec={dataTableBound(structured)} />
      </JSONUIProvider>
    ))
    .exhaustive();
}
