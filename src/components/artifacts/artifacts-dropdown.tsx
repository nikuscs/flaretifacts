'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import ChevronDown from '~icons/lucide/chevron-down';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsDropdownProps {
  block: ArtifactsBlocksProps<'Dropdown'>;
}

export function ArtifactsDropdown({ block: { label, icon, emoji, items } }: ArtifactsDropdownProps) {
  const Icon = icon ? ARTIFACTS_UI.icons[icon] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="self-start" variant="outline">
          {Icon ? <Icon aria-hidden="true" /> : null}
          {emoji ? <span aria-hidden="true">{emoji}</span> : null}
          {label}
          <ChevronDown aria-hidden="true" className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-w-80">
        {items.map((item, index) => {
          const ItemIcon = item.icon ? ARTIFACTS_UI.icons[item.icon] : null;

          return (
            <DropdownMenuItem
              asChild
              className="cursor-pointer items-start"
              key={`${item.url}-${index}`}
            >
              <a
                href={item.url}
                rel="noreferrer"
                target="_blank"
              >
                {ItemIcon ? <ItemIcon aria-hidden="true" className="mt-2.5" /> : null}
                {item.emoji ? <span aria-hidden="true" className="w-4 shrink-0 py-2 text-center leading-5">{item.emoji}</span> : null}
                <span className="flex min-w-0 flex-col gap-0.5 py-2">
                  <span className="leading-5 font-medium">{item.label}</span>
                  {item.description ? <span className="text-xs text-pretty text-muted-foreground">{item.description}</span> : null}
                </span>
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
