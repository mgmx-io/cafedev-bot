CREATE TABLE conversation_context (
  channel         TEXT NOT NULL,
  channel_user_id TEXT NOT NULL,
  messages        TEXT NOT NULL,
  PRIMARY KEY (channel, channel_user_id),
  FOREIGN KEY (channel, channel_user_id)
    REFERENCES channel_links (channel, channel_user_id) ON DELETE CASCADE
);
