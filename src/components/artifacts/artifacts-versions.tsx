'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToastStack } from '@/components/ui/toast-stack';
import { rpc } from '@/rpc/rpc.client';
import { datesFormatTime } from '@/utils/dates.utils';
import Check from '~icons/lucide/check';
import ChevronDown from '~icons/lucide/chevron-down';
import History from '~icons/lucide/history';
import Trash from '~icons/lucide/trash-2';

interface ArtifactsVersionsProps {
  id: string;
  version: number;
}

export function ArtifactsVersions({ id, version }: ArtifactsVersionsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToastStack();
  const { data: versions = [] } = useQuery(rpc.artifacts.versions.queryOptions({ input: { id } }));

  const restore = useMutation(rpc.artifacts.restore.mutationOptions({
    onSuccess: async (artifact) => {
      await queryClient.invalidateQueries({ queryKey: rpc.artifacts.key() });
      toast({ type: 'success', title: `Brought back as version ${artifact.version}` });
    },
    onError: (error) => toast({
      type: 'error',
      title: 'Couldn\'t restore that version',
      description: error.message,
    }),
  }));

  const remove = useMutation(rpc.artifacts.deleteVersions.mutationOptions({
    onSuccess: async (_left, input) => {
      await queryClient.invalidateQueries({ queryKey: rpc.artifacts.key() });
      toast({ type: 'success', title: input.versions.length === 1 ? `Deleted version ${input.versions[0]}` : `Deleted ${input.versions.length} versions` });
    },
    onError: (error) => toast({
      type: 'error',
      title: 'Couldn\'t delete those versions',
      description: error.message,
    }),
  }));

  const earlier = versions.filter((item) => item.version !== version);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          pending={restore.isPending || remove.isPending}
          size="sm"
          variant="outline"
        >
          <History />
          {`Version ${version}`}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuLabel>Restore an earlier version</DropdownMenuLabel>
        {versions.map((item) => (
          <DropdownMenuItem
            disabled={item.version === version}
            key={item.version}
            onSelect={() => restore.mutate({
              id,
              version,
              fromVersion: item.version,
            })}
          >
            {item.version === version ? <Check /> : <History />}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">{`Version ${item.version} · ${item.title}`}</span>
              <span suppressHydrationWarning className="text-xs text-muted-foreground">{`${datesFormatTime(item.createdAt)}${item.createdBy ? ` · ${item.createdBy}` : ''}`}</span>
            </span>
          </DropdownMenuItem>
        ))}
        {earlier.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Trash />
                Delete versions
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-56">
                {earlier.map((item) => (
                  <DropdownMenuItem
                    key={item.version}
                    variant="destructive"
                    onSelect={() => remove.mutate({ id, versions: [item.version] })}
                  >
                    <Trash />
                    <span className="truncate">{`Version ${item.version} · ${item.title}`}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => remove.mutate({ id, versions: earlier.map((item) => item.version) })}
                >
                  <Trash />
                  {`Delete all ${earlier.length} earlier versions`}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
