CREATE TABLE job_postings (
  id          INTEGER PRIMARY KEY,
  url         TEXT NOT NULL UNIQUE,        -- the pasted link; identity / dedup key
  title       TEXT NOT NULL,               -- job title (from the rendered page)
  content     TEXT NOT NULL,               -- the JD as plain text, fit-check input
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
