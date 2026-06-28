CREATE TABLE job_postings (
  id          INTEGER PRIMARY KEY,
  url         TEXT NOT NULL,             -- the pasted link, for reference / re-open
  ats         TEXT NOT NULL,             -- 'greenhouse' | 'lever' | 'ashby' | ...
  external_id TEXT NOT NULL,             -- the job's id within that ATS
  content     TEXT NOT NULL,             -- stripForLlm output: the JD as plain text, fit-check input
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (ats, external_id)              -- identity / dedup key
);
