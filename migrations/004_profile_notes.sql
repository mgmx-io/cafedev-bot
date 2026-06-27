CREATE TABLE profile_notes (
  id            INTEGER PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  summary       TEXT NOT NULL,             -- index line, injected every turn
  content       TEXT,                      -- full detail, recalled on demand (NULL = summary says it all)
  created_at    TEXT NOT NULL,
  removed_at    TEXT                       -- soft delete: removed-but-kept; NULL = active
);

CREATE INDEX idx_profile_notes_user ON profile_notes (user_id);
