CREATE TABLE board_postings (
  board_id    INTEGER NOT NULL REFERENCES company_boards(id) ON DELETE CASCADE,
  ext_id      TEXT NOT NULL,
  url         TEXT NOT NULL,
  title       TEXT NOT NULL,
  notified_at TEXT,                        -- NULL = notification pending
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (board_id, ext_id)
);
