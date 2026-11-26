'use client';

import { ORPCError } from '@orpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useToastStack } from '@/components/ui/toast-stack';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { rpc } from '@/rpc/rpc.client';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import ChevronDown from '~icons/lucide/chevron-down';
import RefreshCw from '~icons/lucide/refresh-cw';
import type { ArtifactsVisibility } from '@/types/artifacts.types';

interface ArtifactsSharingProps {
  id: string;
  title: string;
  url: string;
  version: number;
  visibility: ArtifactsVisibility;
  size?: 'xs' | 'sm';
}

export function ArtifactsSharing({ id, title, url, version, visibility, size = 'sm' }: ArtifactsSharingProps) {
  const queryClient = useQueryClient();
  const { toast } = useToastStack();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<ArtifactsVisibility>(visibility);
  const [passcode, setPasscode] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const link = useSyncExternalStore(() => () => undefined, () => new URL(`${ARTIFACTS.viewPath}${id}`, window.location.href).href, () => url);
  const { label, Icon } = ARTIFACTS_UI.visibility[visibility];
  const limits = ARTIFACTS_UI.passcode;
  const passcodeError = passcode.length < limits.min || passcode.length > limits.max ? `Use ${limits.min} to ${limits.max} characters.` : undefined;

  const generate = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 10 ** limits.digits).padStart(limits.digits, '0');

  const update = useMutation(rpc.artifacts.update.mutationOptions({
    onSuccess: async (_artifact, input) => {
      await queryClient.invalidateQueries({ queryKey: rpc.artifacts.key() });

      if (input.visibility === 'passcode' && input.passcode) {
        setSaved(input.passcode);
        toast({
          type: 'success',
          title: 'Passcode saved',
          description: 'Copy it now: it can\'t be shown again.',
        });

        return;
      }

      setOpen(false);
      toast({ type: 'success', title: input.visibility === 'public' ? 'Anyone with the link can open it now' : 'Only you can open it now' });
    },
    onError: async (error) => {
      if (error instanceof ORPCError && error.code === 'ARTIFACT_VERSION_CONFLICT') {
        await queryClient.invalidateQueries({ queryKey: rpc.artifacts.key() });
        toast({
          type: 'error',
          title: 'It changed meanwhile',
          description: 'It shows the latest version now. Try again.',
        });

        return;
      }

      toast({
        type: 'error',
        title: 'Couldn\'t change who can open it',
        description: error.message,
      });
    },
  }));

  const rows = [
    ...saved === null ? [] : [{ name: 'passcode', value: saved }],
    ...choice === 'private' && saved === null ? [] : [{ name: 'link', value: link }],
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <Button
        aria-label={`Who can open ${title}: ${label}`}
        pending={update.isPending}
        size={size}
        variant="outline"
        onClick={() => {
          setChoice(visibility);
          setPasscode(generate());
          setSaved(null);
          setOpen(true);
        }}
      >
        <Icon />
        {label}
        <ChevronDown />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{saved === null ? 'Who can open this artifact' : 'Share the link and the passcode'}</DialogTitle>
          <DialogDescription>{saved === null ? ARTIFACTS_UI.visibility[choice].who : 'The passcode shows only now. To change it later, set a new one.'}</DialogDescription>
        </DialogHeader>
        {saved === null ? (
          <ToggleGroup
            aria-label="Who can open it"
            className="w-full"
            disabled={update.isPending}
            type="single"
            value={choice}
            onValueChange={(value) => {
              const next = ARTIFACTS_UI.visibilityOrder.find((item) => item === value);

              if (!next) {
                return;
              }

              setChoice(next);

              if (next === 'private' && visibility !== 'private') {
                update.mutate({
                  id,
                  version,
                  visibility: 'private',
                });
              }
            }}
          >
            {ARTIFACTS_UI.visibilityOrder.map((item) => {
              const Option = ARTIFACTS_UI.visibility[item];

              return (
                <ToggleGroupItem
                  className="flex-1 justify-center"
                  key={item}
                  value={item}
                >
                  <Option.Icon />
                  {Option.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        ) : null}
        {choice === 'passcode' && saved === null ? (
          <Field
            description={`${limits.min} to ${limits.max} characters. Only a scrambled copy is kept, so copy it after saving.`}
            error={passcodeError}
            label="Passcode"
          >
            {(control) => (
              <div className="flex items-center gap-2">
                <Input
                  {...control}
                  autoComplete="off"
                  maxLength={limits.max}
                  spellCheck={false}
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                />
                <Button
                  size="lg"
                  type="button"
                  variant="outline"
                  onClick={() => setPasscode(generate())}
                >
                  <RefreshCw />
                  New code
                </Button>
              </div>
            )}
          </Field>
        ) : null}
        {rows.map((row) => (
          <Field key={row.name} label={row.name === 'link' ? 'Link' : 'Passcode'}>
            {(control) => (
              <div className="flex items-center gap-2">
                <Input
                  {...control}
                  readOnly
                  value={row.value}
                  onFocus={(event) => event.target.select()}
                />
                <CopyButton
                  className="my-0"
                  label={row.name}
                  value={row.value}
                />
              </div>
            )}
          </Field>
        ))}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{saved === null && choice !== visibility ? 'Cancel' : 'Done'}</Button>
          </DialogClose>
          {saved === null && (choice === 'passcode' || (choice === 'public' && visibility !== 'public')) ? (
            <Button
              disabled={choice === 'passcode' && passcodeError !== undefined}
              pending={update.isPending}
              onClick={() => update.mutate({
                id,
                version,
                visibility: choice,
                passcode: choice === 'passcode' ? passcode : undefined,
              })}
            >
              {visibility === 'passcode' && choice === 'passcode' ? 'Change the passcode' : ARTIFACTS_UI.visibility[choice].confirm}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
