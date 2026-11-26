import { match, P } from 'ts-pattern';
import { examplesPage } from '@/types/examples.types';
import { errorsCreate } from '@/utils/errors.utils';
import type { ExamplesGetInput } from '@/types/examples.types';

const examplesPages = Object.values(import.meta.glob('./pages/*.json', { import: 'default', eager: true }))
  .map((file) => examplesPage.parse(file))
  .map((page) => match(page.spec)
    .with({ html: P.string }, () => ({ ...page, kind: 'html' as const, blocks: [] }))
    .otherwise((spec) => ({ ...page, kind: 'blocks' as const, blocks: [...new Set(Object.values(spec.elements).map((element) => element.type))].toSorted() })));

export function examplesList() {
  return examplesPages.map(({ spec: _spec, ...summary }) => summary);
}

export function examplesGet(params: ExamplesGetInput) {
  const page = examplesPages.find((item) => item.name === params.name);

  if (!page) {
    throw errorsCreate('EXAMPLE_NOT_FOUND', { name: params.name });
  }

  return page;
}
