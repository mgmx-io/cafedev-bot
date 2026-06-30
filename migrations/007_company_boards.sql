CREATE TABLE company_boards (
  id          INTEGER PRIMARY KEY,
  ats         TEXT NOT NULL,               -- ATS catalog key, e.g. 'greenhouse', 'workday'
  slug        TEXT NOT NULL,               -- canonical slug for Source(slug)
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (ats, slug)
);
