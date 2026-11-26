import * as z from 'zod';

const errorsArtifactId = z.object({ id: z.string() });

export const errorsCatalog = {
  UNEXPECTED_ERROR: { status: 500, message: 'Something went wrong.', data: z.object({ detail: z.string() }) },

  ARTIFACT_NOT_FOUND: { status: 404, message: 'Artifact not found.', data: errorsArtifactId },
  ARTIFACT_VERSION_CONFLICT: { status: 409, message: 'The artifact changed since you read it: read it again and retry with its current version.', data: z.object({ id: z.string(), version: z.number() }) },
  ARTIFACT_VERSION_NOT_FOUND: { status: 404, message: 'The artifact has no such version; only the last versions are kept.', data: z.object({ id: z.string(), version: z.number() }) },
  ARTIFACT_SPEC_INVALID: { status: 400, message: 'The spec does not render: check the elements, block names and props against artifacts.blocks.', data: z.object({ issues: z.array(z.string()) }) },
  ARTIFACT_PATCH_INVALID: { status: 400, message: 'A patch operation does not apply to the spec: check its op, path and value against artifacts_layout and artifacts_data.', data: z.object({ operation: z.number(), detail: z.string() }) },
  ARTIFACT_PASSCODE_MISSING: { status: 400, message: 'A passcode artifact needs a passcode.', data: z.object({}) },
  ARTIFACT_PASSCODE_REQUIRED: { status: 401, message: 'This artifact needs a passcode.', data: errorsArtifactId },
  ARTIFACT_PASSCODE_WRONG: { status: 403, message: 'That passcode is not right.', data: errorsArtifactId },
  ARTIFACT_SIGN_IN_REQUIRED: { status: 403, message: 'This artifact is private: sign in to open it.', data: errorsArtifactId },

  ASSET_INVALID: { status: 400, message: 'That file is not an image the page can show: send a PNG, JPEG, GIF, WebP, AVIF or plain SVG.', data: z.object({ reason: z.string() }) },
  ASSET_NOT_FOUND: { status: 404, message: 'Asset not found: assets_list lists the assets of an artifact.', data: z.object({ id: z.string() }) },
  ASSET_LIMIT: { status: 400, message: 'The artifact has too many assets: delete some with assets_delete first.', data: z.object({ max: z.number() }) },

  EXAMPLE_NOT_FOUND: { status: 404, message: 'There is no example with that name: examples_list lists them.', data: z.object({ name: z.string() }) },
} satisfies Record<string, ErrorsDefinition>;

export interface ErrorsDefinition {
  status: number;
  message: string;
  data: z.ZodObject;
}

export type ErrorsCode = keyof typeof errorsCatalog;
export type ErrorsData<K extends ErrorsCode> = z.infer<(typeof errorsCatalog)[K]['data']>;
export type ErrorsResult = { [K in ErrorsCode]: { code: K; data: ErrorsData<K> } }[ErrorsCode];

export const errorsResult = z.union(Object.entries(errorsCatalog).map(([code, { data }]) => z.object({ code: z.literal(code), data })))
  .refine((result): result is ErrorsResult => Object.hasOwn(errorsCatalog, result.code))
  .meta({ id: 'ErrorsResult' });
