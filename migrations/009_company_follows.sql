CREATE TABLE company_follows (
  id          INTEGER PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  board_id    INTEGER NOT NULL REFERENCES company_boards(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, board_id)               -- one follow per user per board
);
