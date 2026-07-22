CREATE TABLE conversation_context (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id     TEXT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  messages_json TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX conversation_context_thread_latest
  ON conversation_context (thread_id, id DESC);
