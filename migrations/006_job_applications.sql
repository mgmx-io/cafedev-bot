CREATE TABLE job_applications (
  id          INTEGER PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  job_id      INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'considering' CHECK (status IN ('considering','applied','interviewing','offer','rejected','withdrawn')),
  fit         TEXT CHECK (fit IN ('apply','stretch','skip')),  -- job-fit verdict; NULL = not evaluated
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, job_id)                                     -- one application per user per job
);
