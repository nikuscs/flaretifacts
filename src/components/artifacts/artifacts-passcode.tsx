'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import KeyRound from '~icons/lucide/key-round';

interface ArtifactsPasscodeProps {
  wrong: boolean;
  pending: boolean;
  onSubmit: (passcode: string) => void;
}

export function ArtifactsPasscode({ wrong, pending, onSubmit }: ArtifactsPasscodeProps) {
  const [passcode, setPasscode] = useState('');

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(passcode);
          }}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-(--radius-control) border bg-muted [&_svg]:size-4">
              <KeyRound />
            </span>
            <div className="grid gap-0.5">
              <h1 className="font-medium">This artifact needs a passcode</h1>
              <p className="text-sm text-muted-foreground">Ask whoever shared the link for it.</p>
            </div>
          </div>
          <Field error={wrong ? 'That passcode is not right.' : undefined} label="Passcode">
            {(control) => (
              <Input
                {...control}
                autoComplete="off"
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
              />
            )}
          </Field>
          <Button
            disabled={passcode.length === 0}
            pending={pending}
            type="submit"
          >Open</Button>
        </form>
      </CardContent>
    </Card>
  );
}
