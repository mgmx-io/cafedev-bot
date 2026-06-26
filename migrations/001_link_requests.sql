CREATE TABLE link_requests (
  token           TEXT PRIMARY KEY,
  channel         TEXT NOT NULL,
  channel_user_id TEXT NOT NULL,
  expires_at      TEXT NOT NULL
);
