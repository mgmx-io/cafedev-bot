CREATE TABLE job_postings (
  id          INTEGER PRIMARY KEY,
  url         TEXT NOT NULL UNIQUE,                   -- the pasted link; identity / dedup key
  title       TEXT NOT NULL,                          -- job title (from the rendered page)
  content     TEXT NOT NULL,                          -- the JD as plain text, fit-check input
  board_id    INTEGER REFERENCES company_boards(id),  -- detected ATS company board, if any
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
