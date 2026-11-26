import { createStoreAdapter } from '@json-render/core/store-utils';
import { hashKey } from '@tanstack/react-query';
import { rpc } from '@/rpc/rpc.client';
import { artifactsStateSaveInput } from '@/types/artifacts.types';
import type { ArtifactsStoreParams } from '@/types/artifacts.types';
import type { StateStore } from '@json-render/core';

export function artifactsStoreCreate({ queryClient, input, onError }: ArtifactsStoreParams): StateStore {
  const queryKey = rpc.artifacts.view.queryKey({ input });
  const empty = {};
  let saving = Promise.resolve();

  return createStoreAdapter({
    getSnapshot: () => queryClient.getQueryData(queryKey)?.artifact.spec.state ?? empty,
    setSnapshot: (snapshot) => {
      const state = artifactsStateSaveInput.shape.state.parse(snapshot);

      queryClient.setQueryData(queryKey, (view) => view && { ...view, artifact: { ...view.artifact, spec: { ...view.artifact.spec, state } } });
      saving = saving.then(async () => {
        const current = queryClient.getQueryData(queryKey);

        if (!current) {
          return;
        }

        try {
          queryClient.setQueryData(queryKey, await rpc.artifacts.stateSave.call({
            ...input,
            version: current.artifact.version,
            state,
          }));
        } catch {
          onError();
          await queryClient.invalidateQueries({ queryKey });
        }
      });
    },
    subscribe: (listener) => queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryHash === hashKey(queryKey)) {
        listener();
      }
    }),
  });
}
