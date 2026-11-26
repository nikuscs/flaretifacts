'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { rpcQueryClientCreate } from '@/rpc/rpc.client';
import type { ReactNode } from 'react';

interface ProvidersQueryProps {
  children: ReactNode;
}

export function ProvidersQuery({ children }: ProvidersQueryProps) {
  const [queryClient] = useState(rpcQueryClientCreate);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
