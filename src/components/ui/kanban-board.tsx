import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { TextLink } from '@/components/ui/text-link';
import { Tile } from '@/components/ui/tile';

type KanbanBoardTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface KanbanBoardCard {
  title: string;
  description?: string;
  tags?: { text: string; tone?: KanbanBoardTone }[];
  meta?: string;
  assignee?: string;
  url?: string;
}

interface KanbanBoardColumn {
  title: string;
  tone?: KanbanBoardTone;
  cards: KanbanBoardCard[];
}

interface KanbanBoardProps {
  columns: KanbanBoardColumn[];
  label?: string;
}

const kanbanBoardTones = {
  neutral: 'bg-(--text-muted)',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
};

function KanbanBoard({ columns, label = 'Board' }: KanbanBoardProps) {
  return (
    <section
      aria-label={label}
      className="-mx-1 grid snap-x snap-mandatory [scrollbar-width:thin] auto-cols-[minmax(13.5rem,1fr)] grid-flow-col gap-3 overflow-x-auto px-1 pb-1"
      data-slot="kanban-board"
    >
      {columns.map((column, index) => (
        <div className="flex min-w-0 snap-start flex-col gap-2 rounded-(--radius-control) border bg-muted/40 p-2" key={`${column.title}-${index}`}>
          <header className="flex items-center gap-2 px-1.5 pt-1 pb-0.5">
            <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', kanbanBoardTones[column.tone ?? 'neutral'])} />
            <h4 className="min-w-0 flex-1 truncate text-sm font-medium">{column.title}</h4>
            <span className="rounded-md bg-card px-1.5 text-xs leading-5 font-medium text-muted-foreground tabular-nums">{column.cards.length}</span>
          </header>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {column.cards.map((card, at) => (
              <li className="flex flex-col gap-2 rounded-[calc(var(--radius-control)-4px)] border bg-card p-3 shadow-(--shadow-resting)" key={`${card.title}-${at}`}>
                <span className="text-sm leading-5 font-medium text-pretty"><TextLink href={card.url}>{card.title}</TextLink></span>
                {card.description ? <span className="line-clamp-3 text-xs text-pretty text-muted-foreground">{card.description}</span> : null}
                {card.tags?.length || card.meta || card.assignee ? (
                  <span className="flex flex-wrap items-center gap-1.5">
                    {card.tags?.map((tag) => <Badge key={tag.text} variant={tag.tone ?? 'neutral'}>{tag.text}</Badge>)}
                    {card.meta ? <span className="text-xs text-muted-foreground tabular-nums">{card.meta}</span> : null}
                    {card.assignee ? (
                      <Tile className="ml-auto" lettering round size="sm" title={card.assignee}>
                        {card.assignee.split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join('')}
                      </Tile>
                    ) : null}
                  </span>
                ) : null}
              </li>
            ))}
            {column.cards.length === 0 ? <li className="rounded-[calc(var(--radius-control)-4px)] border border-dashed p-3 text-center text-xs text-muted-foreground">Nothing here</li> : null}
          </ol>
        </div>
      ))}
    </section>
  );
}

export { KanbanBoard };
