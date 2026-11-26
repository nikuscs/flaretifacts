CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('blocks', 'html')),
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private', 'passcode')),
  passcode_hash TEXT,
  version INTEGER NOT NULL,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX artifacts_updated_at ON artifacts (updated_at DESC);

CREATE TABLE artifact_versions (
  artifact_id TEXT NOT NULL REFERENCES artifacts (id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  spec TEXT NOT NULL,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (artifact_id, version)
);
