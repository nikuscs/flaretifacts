import * as z from 'zod';
import { artifactsBlocksComponents } from '@/types/artifacts-blocks.types';
import { errorsResult } from '@/types/errors.types';
import type { QueryClient } from '@tanstack/react-query';

const artifactsVisibility = z.enum(['public', 'private', 'passcode'])
  .describe('Who can open the link: public for anyone, private for the signed-in owner only, passcode for anyone who types the passcode');

export const artifactsKind = z.enum(['blocks', 'html']);

const artifactsId = z.string().regex(/^[0-9A-Za-z]{10}$/).describe('The artifact id: 10 letters and digits, the last part of its link');
const artifactsVersion = z.number().int().positive();
export const artifactsTitle = z.string().trim().min(1).max(120);
const artifactsPasscode = z.string().min(4).max(64).describe('The code people type to open a passcode artifact, 4 to 64 characters');
const artifactsJson = z.json();
export const artifactsJsonList = z.array(artifactsJson).catch([]);

export const artifactsBinding = z.object({
  $state: z.string().optional(),
  $bindState: z.string().optional(),
  $item: z.string().optional(),
  $bindItem: z.string().optional(),
});

const artifactsState = z.record(z.string(), z.json()).describe('The page data: numbers and lists agents keep up to date, and what people change on the page (ticks, notes, toggles). Blocks read it with { "$state": "/path" } and write it with { "$bindState": "/path" }');

const artifactsEmoji = z.string().min(1).max(16).regex(/^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3)/u)
  .describe('One emoji for what the artifact is, such as 📈 for a chart or 🗓️ for a plan');

const artifactsBlocksSpec = z.object({
  root: z.string().min(1).describe('The key of the top element in elements'),
  elements: z.record(z.string().min(1), z.object({
    type: z.string().min(1).describe('A block name from artifacts.blocks'),
    props: z.record(z.string(), z.json()).default({}),
    children: z.array(z.string()).default([]),
    repeat: z.object({
      statePath: z.union([z.string().startsWith('/'), z.object({ $item: z.string() }).strict()]).describe('A list in the page data ("/sellers"), or a list on the current item ({ "$item": "orders" })'),
      key: z.string().optional().describe('The item key that names each item, so items keep their place when the list changes'),
    }).strict().optional().describe('Shows the children once per item of a list; they read the item with { "$item": "key" } and save onto it with { "$bindItem": "key" }'),
    visible: z.json().optional().describe('Show the element only when a condition holds, such as { "$state": "/view", "eq": "list" } or { "$item": "notes", "neq": "" }'),
  })),
  state: artifactsState.default({}),
}).strict();

const artifactsHtmlSpec = z.object({
  html: z.string().trim().min(1).max(2_000_000).describe('A page body in HTML with inline style and script; it runs in a sandbox with no network'),
  state: artifactsState.default({}),
}).strict();

export const artifactsSpec = z.union([artifactsBlocksSpec, artifactsHtmlSpec])
  .describe('Either blocks ({ root, elements, state }) or HTML ({ html, state })');

const artifactsSummary = z.object({
  id: artifactsId,
  title: artifactsTitle,
  emoji: z.string(),
  kind: artifactsKind,
  visibility: artifactsVisibility,
  version: artifactsVersion,
  url: z.url().describe('The link that opens the artifact'),
  createdBy: z.string().nullable(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export const artifactsArtifact = artifactsSummary.extend({ spec: artifactsSpec });

export const artifactsListOutput = z.array(artifactsSummary);

export const artifactsGetInput = z.object({
  id: artifactsId,
  version: artifactsVersion.optional().describe('An earlier version to read; the latest when left out'),
});

export const artifactsCreateInput = z.object({
  title: artifactsTitle,
  emoji: artifactsEmoji.optional(),
  spec: artifactsSpec,
  visibility: artifactsVisibility.default('private'),
  passcode: artifactsPasscode.optional().describe('Required when visibility is passcode'),
});

export const artifactsUpdateInput = z.object({
  id: artifactsId,
  version: artifactsVersion.describe('The version you read last; the update fails if someone changed it since'),
  title: artifactsTitle.optional(),
  emoji: artifactsEmoji.optional(),
  spec: artifactsSpec.optional(),
  state: artifactsState.optional(),
  visibility: artifactsVisibility.optional(),
  passcode: artifactsPasscode.optional().describe('A new passcode; required when changing visibility to passcode'),
}).refine((input) => Object.keys(input).some((key) => key !== 'id' && key !== 'version'), { message: 'Change at least one field.' });

export const artifactsRestoreInput = z.object({
  id: artifactsId,
  version: artifactsVersion.describe('The current version'),
  fromVersion: artifactsVersion.describe('The earlier version to bring back as a new version'),
});

export const artifactsVersionsInput = z.object({ id: artifactsId });

export const artifactsVersionsOutput = z.array(z.object({
  version: artifactsVersion,
  title: artifactsTitle,
  createdBy: z.string().nullable(),
  createdAt: z.number().int(),
}));

export const artifactsDeleteVersionsInput = z.object({
  id: artifactsId,
  versions: z.array(artifactsVersion).min(1).max(100).describe('The earlier versions to delete; the current version always stays'),
});

export const artifactsDeleteInput = z.object({ ids: z.array(artifactsId).min(1).max(100) });

export const artifactsDeleteOutput = z.array(z.object({
  id: artifactsId,
  ok: z.boolean(),
  error: errorsResult.nullable(),
}));

export const artifactsViewInput = z.object({
  id: artifactsId,
  passcode: z.string().max(64).optional(),
});

export const artifactsViewOutput = z.object({
  artifact: artifactsArtifact,
  owner: z.boolean().describe('Whether the signed-in owner is viewing'),
});

export const artifactsStateSaveInput = artifactsViewInput.extend({
  version: artifactsVersion,
  state: artifactsState,
});

export const artifactsListInput = z.object({
  search: z.string().trim().max(120).optional().describe('Words to find in the title'),
  kind: artifactsKind.optional(),
  visibility: artifactsVisibility.optional(),
}).optional();

export const artifactsIdInput = z.object({ id: artifactsId });

export const artifactsLayoutOutput = z.object({
  id: artifactsId,
  version: artifactsVersion,
  kind: artifactsKind,
  layout: z.union([artifactsBlocksSpec.omit({ state: true }), artifactsHtmlSpec.omit({ state: true })]),
});

export const artifactsDataOutput = z.object({
  id: artifactsId,
  version: artifactsVersion,
  state: artifactsState,
});

export const artifactsLinkOutput = z.object({
  id: artifactsId,
  title: artifactsTitle,
  url: z.url(),
  visibility: artifactsVisibility,
});

export const artifactsHtmlOutput = z.object({
  id: artifactsId,
  version: artifactsVersion,
  html: z.string().describe('The page as the server renders it, without scripts, with absolute links'),
});

const artifactsPatchPath = z.string().regex(/^(\/[^/]*)*$/).describe('JSON Pointer into the spec, such as /elements/revenue/props/value or /state/tasks/0/done; - appends to an array');

const artifactsPatchOperation = z.discriminatedUnion('op', [
  z.object({
    op: z.enum(['add', 'replace', 'test']),
    path: artifactsPatchPath,
    value: z.json(),
  }),
  z.object({ op: z.literal('remove'), path: artifactsPatchPath }),
  z.object({
    op: z.enum(['move', 'copy']),
    path: artifactsPatchPath,
    from: artifactsPatchPath,
  }),
]);

export const artifactsPatchInput = z.object({
  id: artifactsId,
  version: artifactsVersion.describe('The version you read last; the patch fails if someone changed it since'),
  operations: z.array(artifactsPatchOperation).min(1).max(200).describe('JSON Patch (RFC 6902) operations on the spec { root, elements, state } or { html, state }, applied in order, all or nothing'),
  title: artifactsTitle.optional(),
  emoji: artifactsEmoji.optional(),
});

export const artifactsValidateInput = z.object({ spec: artifactsSpec });

export const artifactsValidateOutput = z.object({
  ok: z.boolean(),
  issues: z.array(z.string()).describe('What would stop the page from rendering, one line each'),
});

export const artifactsSchemaInput = z.object({
  blocks: z.array(z.string()).max(100).optional().describe('Only these blocks; all when left out'),
}).optional();

export const artifactsGuideOutput = z.object({ markdown: z.string() });

const artifactsBlocksOutput = z.record(z.string(), z.object({
  description: z.string(),
  props: z.record(z.string(), z.json()),
}));

export const artifactsSchemaOutput = z.object({
  blocks: artifactsBlocksOutput.describe('Every block: what it shows and the JSON Schema of its props'),
  spec: z.record(z.string(), z.json()).describe('The JSON Schema of a whole spec'),
});

export const artifactsBlocksCatalog = artifactsBlocksOutput.parse(Object.fromEntries(Object.entries(artifactsBlocksComponents).map(([name, block]) => [name, {
  description: block.description,
  props: z.toJSONSchema(block.props, { io: 'input' }),
}])));

export const artifactsSpecJsonSchema = z.record(z.string(), z.json()).parse(z.toJSONSchema(artifactsSpec, { io: 'input' }));

export const artifactsBlockProps = new Map<string, z.ZodType>(Object.entries(artifactsBlocksComponents).map(([name, block]) => [name, block.props]));

export const artifactsRow = z.object({
  id: z.string(),
  title: z.string(),
  emoji: z.string(),
  kind: artifactsKind,
  visibility: artifactsVisibility,
  passcodeHash: z.string().nullable(),
  version: z.number(),
  createdBy: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  spec: z.string(),
});

export const artifactsRowSummary = artifactsRow.omit({ spec: true });

export const artifactsVersionRow = z.object({
  version: z.number(),
  title: z.string(),
  createdBy: z.string().nullable(),
  createdAt: z.number(),
});

export interface ArtifactsVersionWrite {
  id: string;
  expectedVersion: number | null;
  title: string;
  emoji: string;
  kind: ArtifactsKind;
  visibility: ArtifactsVisibility;
  passcodeHash: string | null;
  spec: string;
  user: string | null;
  now: number;
}

export interface ArtifactsStateWrite {
  id: string;
  version: number;
  spec: string;
  now: number;
}

export type ArtifactsWriteResult = { ok: true; row: ArtifactsRow } | { ok: false; conflict: number | null };

export interface ArtifactsStoreParams {
  queryClient: QueryClient;
  input: ArtifactsViewInput;
  onError: () => void;
}

export type ArtifactsRow = z.infer<typeof artifactsRow>;
export type ArtifactsRowSummary = z.infer<typeof artifactsRowSummary>;
export type ArtifactsKind = z.infer<typeof artifactsKind>;
export type ArtifactsVisibility = z.infer<typeof artifactsVisibility>;
export type ArtifactsSpec = z.infer<typeof artifactsSpec>;
export type ArtifactsListInput = z.infer<typeof artifactsListInput>;
export type ArtifactsIdInput = z.infer<typeof artifactsIdInput>;
export type ArtifactsPatchInput = z.infer<typeof artifactsPatchInput>;
export type ArtifactsValidateInput = z.infer<typeof artifactsValidateInput>;
export type ArtifactsSchemaInput = z.infer<typeof artifactsSchemaInput>;
export type ArtifactsBlocksSpec = z.infer<typeof artifactsBlocksSpec>;
export type ArtifactsJson = z.infer<typeof artifactsJson>;

export interface ArtifactsScope {
  item: ArtifactsJson;
  index: number;
  basePath: string | null;
}
export type ArtifactsVersionRow = z.infer<typeof artifactsVersionRow>;
export type ArtifactsArtifact = z.infer<typeof artifactsArtifact>;
export type ArtifactsSummary = z.infer<typeof artifactsSummary>;
export type ArtifactsGetInput = z.infer<typeof artifactsGetInput>;
export type ArtifactsCreateInput = z.infer<typeof artifactsCreateInput>;
export type ArtifactsUpdateInput = z.infer<typeof artifactsUpdateInput>;
export type ArtifactsRestoreInput = z.infer<typeof artifactsRestoreInput>;
export type ArtifactsVersionsInput = z.infer<typeof artifactsVersionsInput>;
export type ArtifactsDeleteVersionsInput = z.infer<typeof artifactsDeleteVersionsInput>;
export type ArtifactsDeleteInput = z.infer<typeof artifactsDeleteInput>;
export type ArtifactsViewInput = z.infer<typeof artifactsViewInput>;
export type ArtifactsStateSaveInput = z.infer<typeof artifactsStateSaveInput>;
