CREATE TABLE artifacts (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,
  filename     TEXT NOT NULL,
  object_key   TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  sha256       TEXT NOT NULL CHECK (length(sha256) = 64),
  size         INTEGER NOT NULL CHECK (size >= 0),
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX artifacts_user_created ON artifacts (user_id, created_at);
