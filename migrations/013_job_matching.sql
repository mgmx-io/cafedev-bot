CREATE TABLE job_embeddings (
  job_id     INTEGER PRIMARY KEY REFERENCES job_postings(id) ON DELETE CASCADE,
  summary    TEXT NOT NULL,
  embedding  BLOB NOT NULL
);

CREATE TABLE user_embeddings (
  user_id    TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  summary    TEXT NOT NULL,
  embedding  BLOB NOT NULL
);

CREATE TABLE job_matches (
  user_id     TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  job_id      INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  similarity REAL NOT NULL CHECK (similarity >= -1 AND similarity <= 1),
  PRIMARY KEY (user_id, job_id)
);

CREATE INDEX job_matches_user_similarity
  ON job_matches (user_id, similarity DESC);
