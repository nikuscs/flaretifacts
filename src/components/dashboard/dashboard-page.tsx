'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArtifactsLink } from '@/components/artifacts/artifacts-link';
import { ArtifactsSharing } from '@/components/artifacts/artifacts-sharing';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Page, PageHeader } from '@/components/ui/page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { rpc } from '@/rpc/rpc.client';
import { datesFormatTime } from '@/utils/dates.utils';
import Sparkles from '~icons/lucide/sparkles';

export function DashboardPage() {
  const { data: artifacts } = useSuspenseQuery(rpc.artifacts.list.queryOptions());

  return (
    <Page className="mx-auto w-full max-w-6xl">
      <PageHeader
        description="Pages agents published over MCP. Open one to preview it."
        title="Artifacts"
      />
      <Card variant="flush">
        {artifacts.length === 0 ? (
          <EmptyState
            description="Ask an agent to create one with the artifacts_create tool."
            icon={<Sparkles />}
            title="No artifacts yet"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artifact</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Access</TableHead>
                <TableHead className="text-right">Version</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {artifacts.map((artifact) => (
                <TableRow key={artifact.id}>
                  <TableCell className="max-w-96">
                    <Link className="flex min-w-0 items-center gap-2 font-medium hover:underline" href={`/a/${artifact.id}`}>
                      <span aria-hidden="true">{artifact.emoji}</span>
                      <span className="truncate">{artifact.title}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge>{artifact.kind === 'html' ? 'HTML' : 'Blocks'}</Badge>
                  </TableCell>
                  <TableCell>
                    <ArtifactsSharing
                      id={artifact.id}
                      size="xs"
                      title={artifact.title}
                      url={artifact.url}
                      version={artifact.version}
                      visibility={artifact.visibility}
                    />
                  </TableCell>
                  <TableCell className="text-right">{artifact.version}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{artifact.createdBy ?? 'Unknown'}</span>
                  </TableCell>
                  <TableCell>
                    <time
                      suppressHydrationWarning
                      className="text-muted-foreground"
                      dateTime={new Date(artifact.updatedAt).toISOString()}
                    >{datesFormatTime(artifact.updatedAt)}</time>
                  </TableCell>
                  <TableCell>
                    <ArtifactsLink
                      open
                      id={artifact.id}
                      title={artifact.title}
                      url={artifact.url}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </Page>
  );
}
