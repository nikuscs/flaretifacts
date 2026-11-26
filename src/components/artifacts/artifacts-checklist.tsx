'use client';

import { useBoundProp } from '@json-render/react';
import { cn } from 'cn';
import { useId } from 'react';
import { ArtifactsRowText } from '@/components/artifacts/artifacts-row-text';
import { Checkbox } from '@/components/ui/checkbox';
import { TextLink } from '@/components/ui/text-link';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';

interface ArtifactsChecklistItem {
  title: string;
  description?: string;
  done?: boolean;
  url?: string;
}

interface ArtifactsChecklistProps {
  items: ArtifactsChecklistItem[];
  binding?: string;
}

export function ArtifactsChecklist({ items, binding }: ArtifactsChecklistProps) {
  const id = useId();
  const [bound = [], setBound] = useBoundProp(items, binding);

  return (
    <ul className={ARTIFACTS_UI.list}>
      {bound.map((item, index) => (
        <li className={ARTIFACTS_UI.row} key={`${item.title}-${index}`}>
          <Checkbox
            checked={item.done ?? false}
            id={`${id}-${index}`}
            onCheckedChange={(checked) => setBound(bound.map((entry, position) => (position === index ? { ...entry, done: checked === true } : entry)))}
          />
          <ArtifactsRowText description={item.description}>
            <label className={cn('cursor-pointer transition-colors duration-(--duration-fast)', item.done && 'text-muted-foreground line-through decoration-current/40')} htmlFor={`${id}-${index}`}>{item.url ? <TextLink href={item.url}>{item.title}</TextLink> : item.title}</label>
          </ArtifactsRowText>
        </li>
      ))}
    </ul>
  );
}
