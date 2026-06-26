CREATE TABLE channel_links (
  channel         TEXT NOT NULL,
  channel_user_id TEXT NOT NULL,
  user_id         TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  PRIMARY KEY (channel, channel_user_id)
);
