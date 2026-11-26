import type * as AssetsTypes from '@/types/assets.types';

interface TestStoredObject {
  bytes: Uint8Array;
  options: AssetsTypes.AssetsPutOptions;
}

export function testAssetsBucketCreate() {
  const objects = new Map<string, TestStoredObject>();

  const stored = (key: string, object: TestStoredObject): AssetsTypes.AssetsStored => ({
    key,
    size: object.bytes.length,
    httpMetadata: object.options.httpMetadata,
    customMetadata: object.options.customMetadata,
  });

  const bucket: AssetsTypes.AssetsBucket = {
    put: async (key, body, options) => {
      const object = { bytes: new Uint8Array(body), options };

      objects.set(key, object);

      return stored(key, object);
    },
    get: async (key) => {
      const object = objects.get(key);

      return object ? { ...stored(key, object), body: new Blob([object.bytes.slice()]).stream() } : null;
    },
    list: async ({ prefix }) => ({
      objects: [...objects].filter(([key]) => key.startsWith(prefix)).map(([key, object]) => stored(key, object)),
      truncated: false,
    }),
    delete: async (keys) => {
      for (const key of keys) {
        objects.delete(key);
      }
    },
  };

  return { bucket, objects };
}
