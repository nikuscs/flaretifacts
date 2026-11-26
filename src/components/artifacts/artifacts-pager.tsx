'use client';

import { useState } from 'react';
import { DataTablePagination } from '@/components/ui/data-table';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import type { ReactNode } from 'react';

interface ArtifactsPagerProps<Item> {
  items: Item[];
  pageSize?: number;
  children: (visible: Item[], pager: ReactNode) => ReactNode;
}

export function ArtifactsPager<Item>({ items, pageSize, children }: ArtifactsPagerProps<Item>) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize ?? items.length);
  const pages = Math.max(1, Math.ceil(items.length / Math.max(1, size)));
  const current = Math.min(page, pages);
  const first = (current - 1) * size;

  if (pageSize === undefined || items.length <= pageSize) {
    return children(items, null);
  }

  return children(items.slice(first, first + size), (
    <DataTablePagination
      page={current}
      pageSize={size}
      pageSizes={[...ARTIFACTS_UI.dataTable.pageSizes]}
      total={items.length}
      onPage={setPage}
      onPageSize={(next) => {
        setSize(next);
        setPage(1);
      }}
    />
  ));
}
