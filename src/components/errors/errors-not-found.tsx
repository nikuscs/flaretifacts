'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EmptyStates } from '@/components/ui/empty-states';
import { Page } from '@/components/ui/page';

export function ErrorsNotFound() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Page className="min-h-dvh justify-center">
      <EmptyStates
        action={(
          <>
            <Button
              asChild
              size="sm"
            >
              <Link href="/">Go to overview</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.back()}
            >
              Go back
            </Button>
          </>
        )}
        description={(
          <>
            There is nothing at <span className="font-mono text-foreground">{pathname}</span>. The link may be out of date, or the page has moved.
          </>
        )}
        scene="map"
        title="Page not found"
      />
    </Page>
  );
}
