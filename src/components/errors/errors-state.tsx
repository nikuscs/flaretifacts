'use client';

import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyStates } from '@/components/ui/empty-states';
import { Page } from '@/components/ui/page';
import { errorsCatalog } from '@/types/errors.types';

const ERRORS_STATE_FALLBACK = "This page couldn't load its data. Your work is saved; trying again usually fixes it.";

interface ErrorsStateProps {
  error: Error & { code?: string };
  reset: () => void;
}

export function ErrorsState({ error, reset }: ErrorsStateProps) {
  const router = useRouter();
  const known = Object.entries(errorsCatalog).find(([code]) => code === error.code && code !== 'UNEXPECTED_ERROR');

  return (
    <Page className="min-h-dvh justify-center">
      <EmptyStates
        action={(
          <Button
            size="sm"
            onClick={() => startTransition(() => {
              router.refresh();
              reset();
            })}
          >
            Try again
          </Button>
        )}
        description={known ? `${known[1].message} Your work is saved; trying again usually fixes it.` : ERRORS_STATE_FALLBACK}
        scene="offline"
        title="Something went wrong"
      />
    </Page>
  );
}
