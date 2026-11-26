import { ArtifactsAvatar } from '@/components/artifacts/artifacts-avatar';
import { AvatarGroup } from '@/components/ui/avatar-group';

interface ArtifactsAvatarGroupPerson {
  name: string;
  src?: string;
  emoji?: string;
}

interface ArtifactsAvatarGroupProps {
  people: ArtifactsAvatarGroupPerson[];
  max: number;
  label?: string;
}

export function ArtifactsAvatarGroup({ people, max, label }: ArtifactsAvatarGroupProps) {
  const names = people.map((person) => person.name);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <AvatarGroup
        items={people.map((person, index) => ({
          key: `${person.name}-${index}`,
          label: person.name,
          avatar: <ArtifactsAvatar
            emoji={person.emoji}
            name={person.name}
            size="xs"
            src={person.src}
          />,
        }))}
        label={names.join(', ')}
        max={max}
      />
      <span className="truncate text-sm text-muted-foreground">
        {label ?? (names.length <= 2 ? names.join(' and ') : `${names[0]}, ${names[1]} and ${names.length - 2} more`)}
      </span>
    </div>
  );
}
