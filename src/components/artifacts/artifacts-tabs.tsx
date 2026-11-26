import { Children } from 'react';
import { match, P } from 'ts-pattern';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';
import type { ReactNode } from 'react';

interface ArtifactsTabsProps {
  tabs: ArtifactsBlocksProps<'Tabs'>['tabs'];
  children: ReactNode;
}

export function ArtifactsTabs({ tabs, children }: ArtifactsTabsProps) {
  const panels = Children.toArray(children);
  const labelled = tabs.map((tab) => match(tab).with(P.string, (label) => ({ label, icon: undefined, count: undefined })).otherwise((rich) => rich));

  return (
    <Tabs defaultValue="0">
      <TabsList aria-label="Tabs">
        {labelled.map((tab, index) => {
          const Icon = tab.icon ? ARTIFACTS_UI.icons[tab.icon] : null;

          return (
            <TabsTrigger key={`${tab.label}-${index}`} value={String(index)}>
              <span className="flex items-center gap-1.5">
                {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" /> : null}
                {tab.label}
                {tab.count === undefined ? null : <span className="rounded-md bg-muted px-1.5 text-xs leading-4.5 font-medium text-muted-foreground tabular-nums">{tab.count}</span>}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      {panels.map((panel, index) => (
        <TabsContent key={`${labelled[index]?.label ?? 'panel'}-${index}`} value={String(index)}>
          <div className="flex flex-col gap-4 pt-1">{panel}</div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
