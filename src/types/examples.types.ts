import * as z from 'zod';
import { artifactsKind, artifactsSpec, artifactsTitle } from '@/types/artifacts.types';

export const examplesPage = z.object({
  name: z.string(),
  title: artifactsTitle,
  emoji: z.string(),
  description: z.string().describe('What the page is for and when to start from it'),
  spec: artifactsSpec,
});

const examplesSummary = z.object({
  name: z.string(),
  title: artifactsTitle,
  emoji: z.string(),
  description: z.string(),
  kind: artifactsKind,
  blocks: z.array(z.string()).describe('The blocks the page uses'),
});

export const examplesListOutput = z.array(examplesSummary);

export const examplesGetInput = z.object({ name: z.string().describe('A name from examples_list') });

export const examplesGetOutput = examplesSummary.extend({ spec: artifactsSpec });

export type ExamplesGetInput = z.infer<typeof examplesGetInput>;
