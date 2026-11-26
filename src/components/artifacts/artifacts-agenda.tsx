import { cn } from 'cn';
import { TextLink } from '@/components/ui/text-link';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { datesDayLong, datesMonthShort, datesParseDay, datesWeekdayShort } from '@/utils/dates.utils';
import MapPin from '~icons/lucide/map-pin';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsAgendaProps {
  block: ArtifactsBlocksProps<'Agenda'>;
}

export function ArtifactsAgenda({ block: { events } }: ArtifactsAgendaProps) {
  const days = new Map<string, typeof events>();

  for (const event of events.toSorted((left, right) => left.date.localeCompare(right.date, 'en'))) {
    days.set(event.date, days.get(event.date) ?? []);
    days.get(event.date)?.push(event);
  }

  return (
    <ol className="m-0 flex list-none flex-col gap-5 p-0">
      {[...days].map(([day, items]) => {
        const date = datesParseDay(day)?.date ?? new Date(0);

        return (
          <li className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4" key={day}>
            <span aria-hidden="true" className="flex h-14 flex-col items-center justify-center rounded-(--radius-control) border bg-(--surface-raised) leading-none">
              <span className="text-xs font-medium text-muted-foreground uppercase">{datesMonthShort(date)}</span>
              <span className="mt-1 text-lg font-medium tabular-nums">{date.getUTCDate()}</span>
            </span>
            <div className="flex min-w-0 flex-col">
              <h4 className="flex h-6 items-center gap-2 text-sm font-medium">
                <span className="sr-only">{datesDayLong(date)}</span>
                <span aria-hidden="true">{`${datesWeekdayShort(date)} ${date.getUTCDate()} ${datesMonthShort(date)} ${date.getUTCFullYear()}`}</span>
                <span className="text-xs font-normal text-muted-foreground tabular-nums">{items.length === 1 ? '1 event' : `${items.length} events`}</span>
              </h4>
              <ul className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0">
                {items.map((event, index) => (
                  <li className="relative flex min-w-0 gap-3 rounded-(--radius-control) border bg-card py-2.5 pr-3 pl-4 text-sm" key={`${event.title}-${index}`}>
                    <span aria-hidden="true" className={cn('absolute inset-y-2.5 left-1.5 w-0.75 rounded-full', ARTIFACTS_UI.tones[event.tone ?? 'neutral'])} />
                    <span className="w-24 shrink-0 text-xs leading-5 text-muted-foreground tabular-nums max-sm:w-16">{event.time ?? 'All day'}</span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="leading-5 font-medium wrap-break-word"><TextLink href={event.url}>{event.title}</TextLink></span>
                      {event.location ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin aria-hidden="true" className="size-3 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      ) : null}
                      {event.description ? <span className="text-xs text-pretty text-muted-foreground">{event.description}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
