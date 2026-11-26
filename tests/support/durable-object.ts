import { DatabaseSync } from 'node:sqlite';
import { errorsCreate } from '@/utils/errors.utils';
import type { ArtifactsStore } from '@/services/artifacts/artifacts-store.server';
import type { ArtifactsStateWrite, ArtifactsVersionWrite } from '@/types/artifacts.types';
import type { SQLInputValue } from 'node:sqlite';

interface TestSqlCursor {
  toArray: () => object[];
  rowsWritten: number;
}

export interface TestSocket {
  tags: string[];
  sent: string[];
  closed: number | null;
}

interface TestArtifactsStoreClass {
  current: typeof ArtifactsStore | null;
}

const testArtifactsStoreClass: TestArtifactsStoreClass = { current: null };

export function testArtifactsStoreUse(store: typeof ArtifactsStore) {
  testArtifactsStoreClass.current = store;
}

function testDurableObjectStateCreate() {
  const sqlite = new DatabaseSync(':memory:');
  const sockets: TestSocket[] = [];

  sqlite.exec('pragma foreign_keys = on');

  const exec = (query: string, ...values: SQLInputValue[]): TestSqlCursor => {
    if (values.length === 0 && query.trim().replace(/;\s*$/, '').includes(';')) {
      sqlite.exec(query);

      return { toArray: () => [], rowsWritten: 0 };
    }

    const statement = sqlite.prepare(query);

    if (statement.columns().length > 0) {
      const rows = statement.all(...values);

      return { toArray: () => rows, rowsWritten: 0 };
    }

    const { changes } = statement.run(...values);

    return { toArray: () => [], rowsWritten: Number(changes) };
  };

  const transactionSync = <T>(callback: () => T) => {
    sqlite.exec('begin');

    try {
      const result = callback();

      sqlite.exec('commit');

      return result;
    } catch (error) {
      sqlite.exec('rollback');
      throw error;
    }
  };

  const socketOf = (socket: TestSocket) => ({
    send: (message: string) => {
      socket.sent.push(message);
    },
    close: (code: number) => {
      socket.closed = code;
    },
  });

  const state = {
    storage: { sql: { exec }, transactionSync },
    getWebSockets: (tag: string) => sockets.filter((socket) => socket.tags.includes(tag)).map(socketOf),
  };

  // SAFETY: the store only calls storage.sql.exec, storage.transactionSync and getWebSockets outside fetch.
  return { state: state as DurableObjectState, sockets };
}

export function testArtifactsNamespaceCreate() {
  const { state, sockets } = testDurableObjectStateCreate();
  let store: ArtifactsStore | null = null;

  const storeOf = async () => {
    const Store = testArtifactsStoreClass.current;

    if (!Store) {
      throw errorsCreate('UNEXPECTED_ERROR', { detail: 'tests/support/setup.ts registers the store class before any test runs' });
    }

    // SAFETY: the store never reads env.
    store ??= new Store(state, {} as Env);

    return store;
  };

  const stub = {
    list: async (limit: number) => (await storeOf()).list(limit),
    get: async (id: string, version: number | null) => (await storeOf()).get(id, version),
    exists: async (id: string) => (await storeOf()).exists(id),
    versions: async (id: string) => (await storeOf()).versions(id),
    versionsRemove: async (id: string, versions: number[]) => (await storeOf()).versionsRemove(id, versions),
    write: async (write: ArtifactsVersionWrite) => (await storeOf()).write(write),
    stateSave: async (write: ArtifactsStateWrite) => (await storeOf()).stateSave(write),
    remove: async (id: string) => (await storeOf()).remove(id),
  };

  const namespace = {
    idFromName: (name: string) => {
      const id: DurableObjectId = {
        name,
        toString: () => name,
        equals: (other) => other.toString() === name,
      };

      return id;
    },
    get: (_id: DurableObjectId) => stub,
  };

  // SAFETY: the app calls only idFromName and get on the namespace, and only the store's own methods on the stub.
  return { namespace: namespace as DurableObjectNamespace<ArtifactsStore>, sockets };
}
