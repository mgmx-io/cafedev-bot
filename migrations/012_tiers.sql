CREATE TABLE tiers (
  id                   TEXT PRIMARY KEY,
  token_limit          INTEGER NOT NULL,
  token_window_seconds INTEGER NOT NULL,
  created_at           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tiers (id, token_limit, token_window_seconds) VALUES
  ('free',      1000000, 86400),
  ('unlimited',      -1, 86400);

CREATE TABLE user_tiers (
  user_id    TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  tier_id    TEXT NOT NULL REFERENCES tiers(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX user_tiers_tier ON user_tiers (tier_id);
