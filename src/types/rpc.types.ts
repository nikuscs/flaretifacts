import { oc } from '@orpc/contract';
import { mcp } from '@orpc/mcp';
import { openapi } from '@orpc/openapi';
import * as Artifacts from '@/types/artifacts.types';
import * as Assets from '@/types/assets.types';
import { errorsCatalog } from '@/types/errors.types';
import * as Examples from '@/types/examples.types';
import type { UsersIdentity } from '@/types/users.types';

const rpcGet = oc
  .errors(errorsCatalog)
  .meta(openapi({ method: 'GET' }));

const rpcPost = oc
  .errors(errorsCatalog)
  .meta(openapi({ method: 'POST' }), mcp.tool({ annotations: { destructiveHint: false } }));

const rpcDestructive = mcp.tool({ annotations: { destructiveHint: true } });

const rpcIdempotent = mcp.tool({ annotations: { idempotentHint: true } });

export const rpcContract = {
  examples: {
    list: rpcGet
      .meta(openapi({ summary: 'List example pages to start from: what each is for and the blocks it uses' }))
      .output(Examples.examplesListOutput),
    get: rpcGet
      .meta(openapi({ summary: 'Get one example page by name with its full spec, to copy and adapt' }))
      .input(Examples.examplesGetInput)
      .output(Examples.examplesGetOutput),
  },
  artifacts: {
    guide: rpcGet
      .meta(openapi({ summary: 'Read this first: how to build a beautiful artifact page, which block fits what, how to keep it up to date, and the rules every page follows' }))
      .output(Artifacts.artifactsGuideOutput),
    schema: rpcGet
      .meta(openapi({ summary: 'Get every block a page can use (charts, cards, tables, lists, inputs) with what it shows and the JSON Schema of its props, plus the JSON Schema of a whole spec' }))
      .input(Artifacts.artifactsSchemaInput)
      .output(Artifacts.artifactsSchemaOutput),
    validate: rpcPost
      .meta(openapi({ summary: 'Check a spec without saving it and get every problem that would stop it from rendering' }), rpcIdempotent)
      .input(Artifacts.artifactsValidateInput)
      .output(Artifacts.artifactsValidateOutput),
    list: rpcGet
      .meta(openapi({ summary: 'List artifacts newest first, optionally by words in the title, kind or visibility, with each one\'s version and link' }))
      .input(Artifacts.artifactsListInput)
      .output(Artifacts.artifactsListOutput),
    get: rpcGet
      .meta(openapi({ summary: 'Get one artifact whole: title, link, visibility, version, layout and data, the latest version or an earlier one' }))
      .input(Artifacts.artifactsGetInput)
      .output(Artifacts.artifactsArtifact),
    layout: rpcGet
      .meta(openapi({ summary: 'Get only the layout of an artifact: its blocks and how they nest, or its HTML, without the data' }))
      .input(Artifacts.artifactsGetInput)
      .output(Artifacts.artifactsLayoutOutput),
    data: rpcGet
      .meta(openapi({ summary: 'Get only the data of an artifact: the values its blocks read and what people changed on the page, such as ticked tasks and notes' }))
      .input(Artifacts.artifactsIdInput)
      .output(Artifacts.artifactsDataOutput),
    link: rpcGet
      .meta(openapi({ summary: 'Get the link of an artifact and who can open it' }))
      .input(Artifacts.artifactsIdInput)
      .output(Artifacts.artifactsLinkOutput),
    html: rpcGet
      .meta(openapi({ summary: 'Get an artifact page as the server renders it, as HTML without scripts' }))
      .input(Artifacts.artifactsIdInput)
      .output(Artifacts.artifactsHtmlOutput),
    versions: rpcGet
      .meta(openapi({ summary: 'List the kept versions of an artifact newest first, with who made each and when' }))
      .input(Artifacts.artifactsVersionsInput)
      .output(Artifacts.artifactsVersionsOutput),
    create: rpcPost
      .meta(openapi({ summary: 'Create an artifact from a blocks spec or an HTML page, private unless made public or passcode, and get its link' }))
      .input(Artifacts.artifactsCreateInput)
      .output(Artifacts.artifactsArtifact),
    update: rpcPost
      .meta(openapi({ summary: 'Replace an artifact\'s title, emoji, spec, data, visibility or passcode as a new version, given the version you read' }))
      .input(Artifacts.artifactsUpdateInput)
      .output(Artifacts.artifactsArtifact),
    patch: rpcPost
      .meta(openapi({ summary: 'Make precise edits to an artifact with JSON Patch, such as changing one number or adding one card, as a new version, given the version you read' }))
      .input(Artifacts.artifactsPatchInput)
      .output(Artifacts.artifactsArtifact),
    restore: rpcPost
      .meta(openapi({ summary: 'Bring an earlier version of an artifact back as its newest version' }))
      .input(Artifacts.artifactsRestoreInput)
      .output(Artifacts.artifactsArtifact),
    deleteVersions: rpcPost
      .meta(openapi({ summary: 'Delete earlier versions of an artifact, keeping its current version, and get the versions left' }), rpcDestructive, rpcIdempotent)
      .input(Artifacts.artifactsDeleteVersionsInput)
      .output(Artifacts.artifactsVersionsOutput),
    delete: rpcPost
      .meta(openapi({ summary: 'Delete artifacts with every version, one result per id' }), rpcDestructive, rpcIdempotent)
      .input(Artifacts.artifactsDeleteInput)
      .output(Artifacts.artifactsDeleteOutput),
    view: rpcGet
      .meta(openapi({ summary: 'Open an artifact the way its link does: public to anyone, passcode with the passcode, private only when signed in' }))
      .input(Artifacts.artifactsViewInput)
      .output(Artifacts.artifactsViewOutput),
    stateSave: rpcPost
      .meta(openapi({ summary: 'Save the data people changed on an artifact page, such as ticked tasks, on its current version' }), rpcIdempotent)
      .input(Artifacts.artifactsStateSaveInput)
      .output(Artifacts.artifactsViewOutput),
  },
  assets: {
    upload: rpcPost
      .meta(openapi({ summary: 'Upload an image (PNG, JPEG, GIF, WebP, AVIF or plain SVG, up to 3 MB) to an artifact from base64 or an https link, and get the link to use in its page' }))
      .input(Assets.assetsUploadInput)
      .output(Assets.assetsAsset),
    list: rpcGet
      .meta(openapi({ summary: 'List the images uploaded to an artifact, newest first, with their links' }))
      .input(Assets.assetsListInput)
      .output(Assets.assetsListOutput),
    delete: rpcPost
      .meta(openapi({ summary: 'Delete images from an artifact, one result per id; deleting the artifact deletes all of them' }), rpcDestructive, rpcIdempotent)
      .input(Assets.assetsDeleteInput)
      .output(Assets.assetsDeleteOutput),
  },
};

export interface RpcServerContext {
  user?: UsersIdentity | null;
}
