import { ORPCError } from '@orpc/server';
import { errorsCatalog, errorsResult } from '@/types/errors.types';
import type { ErrorsCode, ErrorsData, ErrorsResult } from '@/types/errors.types';

export function errorsCreate<K extends ErrorsCode>(code: K, data: ErrorsData<K>) {
  return new ORPCError(code, { message: errorsCatalog[code].message, data });
}

export function errorsResultOf(error: Error['cause']): ErrorsResult {
  const known = errorsResult.safeParse(error);

  if (known.success) {
    return known.data;
  }

  return { code: 'UNEXPECTED_ERROR', data: { detail: error instanceof Error ? error.message : String(error) } };
}
