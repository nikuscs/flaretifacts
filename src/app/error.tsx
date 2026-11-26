'use client';

import { ErrorsState } from '@/components/errors/errors-state';

export default function ErrorPage({ error, reset }: { error: Error & { code?: string }; reset: () => void }) {
  return (
    <ErrorsState
      error={error}
      reset={reset}
    />
  );
}
