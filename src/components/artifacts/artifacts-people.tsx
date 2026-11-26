import { match } from 'ts-pattern';
import { ArtifactsAvatar } from '@/components/artifacts/artifacts-avatar';
import { ArtifactsAvatarGroup } from '@/components/artifacts/artifacts-avatar-group';
import { ArtifactsPager } from '@/components/artifacts/artifacts-pager';
import { Badge } from '@/components/ui/badge';
import { TextLink } from '@/components/ui/text-link';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { dataTableWhere } from '@/utils/data-table.utils';
import type { ArtifactsBlocksPerson, ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsPeopleProps {
  block: ArtifactsBlocksProps<'People'>;
}

export function ArtifactsPeople({ block: { people, layout = 'list', max = 6, where, pageSize } }: ArtifactsPeopleProps) {
  const found = dataTableWhere(people, where);

  const text = (person: ArtifactsBlocksPerson) => (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
      <span className="truncate font-medium"><TextLink href={person.url}>{person.name}</TextLink></span>
      {person.role ? <span className="truncate text-xs text-muted-foreground"><TextLink href={person.roleUrl}>{person.role}</TextLink></span> : null}
    </span>
  );

  return match(layout)
    .with('stack', () => (
      <ArtifactsAvatarGroup max={max} people={found.map((person) => ({ name: person.name, src: person.avatar }))} />
    ))
    .with('grid', () => (
      <ArtifactsPager
        items={found}
        key={JSON.stringify(where ?? {})}
        pageSize={pageSize}
      >
        {(visible, pager) => (
          <div className="flex min-w-0 flex-col gap-3">
            <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 min-[420px]:grid-cols-2 lg:grid-cols-3">
              {visible.map((person, index) => (
                <li className="flex min-w-0 items-center gap-3 rounded-(--radius-control) border bg-card p-3 shadow-(--shadow-resting)" key={`${person.name}-${index}`}>
                  <ArtifactsAvatar
                    name={person.name}
                    size="md"
                    src={person.avatar}
                  />
                  {text(person)}
                  {person.status ? <Badge>{person.status}</Badge> : null}
                </li>
              ))}
            </ul>
            {pager ? <div className="overflow-hidden rounded-(--radius-control) border bg-card [&>[data-slot=data-table-pagination]]:border-t-0">{pager}</div> : null}
          </div>
        )}
      </ArtifactsPager>
    ))
    .with('list', () => (
      <ArtifactsPager
        items={found}
        key={JSON.stringify(where ?? {})}
        pageSize={pageSize}
      >
        {(visible, pager) => (
          <div className="min-w-0 overflow-hidden rounded-(--radius-panel) border bg-card">
            <ul className="m-0 flex min-w-0 list-none flex-col divide-y divide-border/60 p-0">
              {visible.map((person, index) => (
                <li className={ARTIFACTS_UI.row} key={`${person.name}-${index}`}>
                  <ArtifactsAvatar
                    name={person.name}
                    size="sm"
                    src={person.avatar}
                  />
                  {text(person)}
                  {person.status ? <Badge>{person.status}</Badge> : null}
                </li>
              ))}
            </ul>
            {pager}
          </div>
        )}
      </ArtifactsPager>
    ))
    .exhaustive();
}
