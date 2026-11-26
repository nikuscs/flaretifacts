import { DurableObject } from 'cloudflare:workers';
import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import { artifactsRow, artifactsRowSummary, artifactsVersionRow } from '@/types/artifacts.types';
import type * as ArtifactsTypes from '@/types/artifacts.types';

const artifactsStoreMigrations: Record<string, string> = import.meta.glob('../../../migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export class ArtifactsStore extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    const sql = ctx.storage.sql;

    sql.exec('create table if not exists migrations (name text primary key, applied_at integer not null)');

    const applied = new Set(sql.exec<{ name: string }>('select name from migrations').toArray().map((row) => row.name));

    for (const [path, query] of Object.entries(artifactsStoreMigrations).sort(([left], [right]) => left.localeCompare(right))) {
      const name = path.split('/').at(-1) ?? path;

      if (!applied.has(name)) {
        ctx.storage.transactionSync(() => {
          sql.exec(query);
          sql.exec('insert into migrations (name, applied_at) values (?, ?)', name, Date.now());
        });
      }
    }
  }

  list(limit: number): ArtifactsTypes.ArtifactsRowSummary[] {
    return this.ctx.storage.sql.exec(`select a.id, a.title, a.emoji, a.kind, a.visibility, a.passcode_hash as passcodeHash, a.version, a.created_by as createdBy, a.created_at as createdAt, a.updated_at as updatedAt
      from artifacts a
      order by a.updated_at desc, a.id
      limit ?`, limit).toArray().map((row) => artifactsRowSummary.parse(row));
  }

  get(id: string, version: number | null): ArtifactsTypes.ArtifactsRow | null {
    const versionSql = version === null ? 'v.version = a.version' : 'v.version = ?';
    const values = version === null ? [id] : [id, version];

    const row = this.ctx.storage.sql.exec(`${ARTIFACTS.rowSelect} where a.id = ? and ${versionSql}`, ...values).toArray().at(0);

    return row ? artifactsRow.parse(row) : null;
  }

  exists(id: string): number | null {
    return this.ctx.storage.sql.exec<{ version: number }>('select version from artifacts where id = ?', id).toArray()[0]?.version ?? null;
  }

  versions(id: string): ArtifactsTypes.ArtifactsVersionRow[] {
    return this.ctx.storage.sql.exec(`select version, title, created_by as createdBy, created_at as createdAt
      from artifact_versions
      where artifact_id = ?
      order by version desc`, id).toArray().map((row) => artifactsVersionRow.parse(row));
  }

  versionsRemove(id: string, versions: number[]): boolean {
    const current = this.exists(id);
    const earlier = versions.filter((version) => version !== current);

    if (current !== null && earlier.length > 0) {
      this.ctx.storage.sql.exec(`delete from artifact_versions where artifact_id = ? and version in (${earlier.map(() => '?').join(', ')})`, id, ...earlier);
    }

    return current !== null;
  }

  write(write: ArtifactsTypes.ArtifactsVersionWrite): ArtifactsTypes.ArtifactsWriteResult {
    const sql = this.ctx.storage.sql;
    const current = this.exists(write.id);

    if (current !== write.expectedVersion) {
      return { ok: false, conflict: current };
    }

    const version = (current ?? 0) + 1;

    this.ctx.storage.transactionSync(() => {
      if (current === null) {
        sql.exec(`insert into artifacts (id, title, emoji, kind, visibility, passcode_hash, version, created_by, created_at, updated_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, write.id, write.title, write.emoji, write.kind, write.visibility, write.passcodeHash, version, write.user, write.now, write.now);
      } else {
        sql.exec(`update artifacts
          set title = ?, emoji = ?, kind = ?, visibility = ?, passcode_hash = ?, version = ?, updated_at = ?
          where id = ?`, write.title, write.emoji, write.kind, write.visibility, write.passcodeHash, version, write.now, write.id);
      }

      sql.exec('insert into artifact_versions (artifact_id, version, title, spec, created_by, created_at) values (?, ?, ?, ?, ?, ?)', write.id, version, write.title, write.spec, write.user, write.now);
      sql.exec('delete from artifact_versions where artifact_id = ? and version <= ?', write.id, version - ARTIFACTS.versionsKept);
    });

    this.ctx.getWebSockets(write.id).forEach((socket) => socket.send(JSON.stringify({ type: 'updated', version })));

    const row = this.get(write.id, null);

    return row ? { ok: true, row } : { ok: false, conflict: null };
  }

  stateSave(write: ArtifactsTypes.ArtifactsStateWrite): ArtifactsTypes.ArtifactsWriteResult {
    const sql = this.ctx.storage.sql;
    const current = this.exists(write.id);

    if (current !== write.version) {
      return { ok: false, conflict: current };
    }

    this.ctx.storage.transactionSync(() => {
      sql.exec('update artifact_versions set spec = ? where artifact_id = ? and version = ?', write.spec, write.id, write.version);
      sql.exec('update artifacts set updated_at = ? where id = ?', write.now, write.id);
    });

    this.ctx.getWebSockets(write.id).forEach((socket) => socket.send(JSON.stringify({ type: 'updated', version: write.version })));

    const row = this.get(write.id, null);

    return row ? { ok: true, row } : { ok: false, conflict: null };
  }

  remove(id: string): boolean {
    const sql = this.ctx.storage.sql;

    const removed = this.ctx.storage.transactionSync(() => {
      sql.exec('delete from artifact_versions where artifact_id = ?', id);

      return sql.exec('delete from artifacts where id = ?', id).rowsWritten > 0;
    });

    this.ctx.getWebSockets(id).forEach((socket) => socket.close(4404, 'deleted'));

    return removed;
  }

  override fetch(request: Request) {
    const id = new URL(request.url).pathname.slice(ARTIFACTS.livePath.length);
    const [client, server] = Object.values(new WebSocketPair());

    this.ctx.acceptWebSocket(server, [id]);

    return new Response(null, { status: 101, webSocket: client });
  }

  override webSocketMessage(socket: WebSocket) {
    socket.send(JSON.stringify({ type: 'pong' }));
  }
}
