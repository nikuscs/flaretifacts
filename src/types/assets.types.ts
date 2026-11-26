import * as z from 'zod';
import { errorsResult } from '@/types/errors.types';

const assetsArtifactId = z.string().regex(/^[0-9A-Za-z]{10}$/).describe('The artifact the asset belongs to: the last part of its link');
const assetsId = z.string().regex(/^[0-9A-Za-z]{12}\.(?:png|jpg|gif|webp|avif|svg)$/).describe('The asset file name, such as Ab12Cd34Ef56.png');

export const assetsMimeType = z.enum(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml']);

export const assetsUploadInput = z.object({
  artifactId: assetsArtifactId,
  name: z.string().trim().min(1).max(120).optional().describe('A short name for the image, such as "Ana" or "logo"; kept for assets_list'),
  base64: z.string().min(1).optional().describe('The image file as base64; PNG, JPEG, GIF, WebP, AVIF or SVG'),
  url: z.url({ protocol: /^https$/ }).optional().describe('An https link to download the image from, instead of base64'),
}).refine((input) => (input.base64 === undefined) !== (input.url === undefined), { message: 'Send either base64 or url, not both.' });

export const assetsAsset = z.object({
  id: assetsId,
  artifactId: assetsArtifactId,
  url: z.string().describe('Use this link as an image source in the page, such as Image url, Avatar src or a DataTable avatar cell'),
  name: z.string(),
  mimeType: assetsMimeType,
  bytes: z.number().int(),
  uploadedAt: z.number(),
});

export const assetsListInput = z.object({ artifactId: assetsArtifactId });

export const assetsListOutput = z.array(assetsAsset);

export const assetsDeleteInput = z.object({ artifactId: assetsArtifactId, ids: z.array(assetsId).min(1).max(100) });

export const assetsDeleteOutput = z.array(z.object({
  id: assetsId,
  ok: z.boolean(),
  error: errorsResult.nullable(),
}));

export const assetsMetadata = z.object({ name: z.string(), uploadedAt: z.coerce.number() });

export type AssetsUploadInput = z.infer<typeof assetsUploadInput>;
export type AssetsListInput = z.infer<typeof assetsListInput>;
export type AssetsDeleteInput = z.infer<typeof assetsDeleteInput>;
export type AssetsAsset = z.infer<typeof assetsAsset>;
export type AssetsMimeType = z.infer<typeof assetsMimeType>;

export interface AssetsServeInput {
  pathname: string;
}

export interface AssetsPutOptions {
  httpMetadata: AssetsHttpMetadata;
  customMetadata: Record<string, string>;
}

export interface AssetsHttpMetadata {
  contentType?: string;
}

export interface AssetsStored {
  key: string;
  size: number;
  httpMetadata?: AssetsHttpMetadata;
  customMetadata?: Record<string, string>;
}

export interface AssetsStoredBody extends AssetsStored {
  body: ReadableStream;
}

export interface AssetsListOptions {
  prefix: string;
  include?: ('httpMetadata' | 'customMetadata')[];
}

export interface AssetsListed {
  objects: AssetsStored[];
  truncated: boolean;
}

export interface AssetsBucket {
  put: (key: string, body: ArrayBuffer, options: AssetsPutOptions) => Promise<AssetsStored | null>;
  get: (key: string) => Promise<AssetsStoredBody | null>;
  list: (options: AssetsListOptions) => Promise<AssetsListed>;
  delete: (keys: string[]) => Promise<void>;
}
