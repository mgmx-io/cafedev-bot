import { db } from "@server/lib/db";
import type { UIMessage } from "ai";

export type ChatThread = {
	id: string;
	title: string;
	created_at: string;
	updated_at: string;
};

type ContextRow = { messages_json: string | null };

/** Create a thread if the id is unused, then return it when owned by this user. */
export function getOrCreateThread(
	id: string,
	userId: string,
	title = "",
): ChatThread | null {
	db.run(
		"INSERT INTO chat_threads (id, user_id, title) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING",
		[id, userId, title],
	);
	return (
		db
			.query<ChatThread, [string, string]>(
				"SELECT id, title, created_at, updated_at FROM chat_threads WHERE id = ? AND user_id = ?",
			)
			.get(id, userId) ?? null
	);
}

/** List one user's threads, most recently active first. */
export function listThreads(userId: string): ChatThread[] {
	return db
		.query<ChatThread, [string]>(
			"SELECT id, title, created_at, updated_at FROM chat_threads WHERE user_id = ? ORDER BY updated_at DESC, id DESC",
		)
		.all(userId);
}

/** Get one thread when it belongs to this user. */
export function getThread(id: string, userId: string): ChatThread | null {
	return (
		db
			.query<ChatThread, [string, string]>(
				"SELECT id, title, created_at, updated_at FROM chat_threads WHERE id = ? AND user_id = ?",
			)
			.get(id, userId) ?? null
	);
}

/** Load the latest complete UIMessage snapshot. Null means the thread isn't owned by this user. */
export function loadThreadContext(
	threadId: string,
	userId: string,
): UIMessage[] | null {
	const row = db
		.query<ContextRow, [string, string]>(
			`SELECT (
			   SELECT messages_json FROM conversation_context
			   WHERE thread_id = t.id ORDER BY id DESC LIMIT 1
			 ) AS messages_json
			 FROM chat_threads t
			 WHERE t.id = ? AND t.user_id = ?`,
		)
		.get(threadId, userId);
	if (!row) return null;
	if (!row.messages_json) return [];
	const messages: unknown = JSON.parse(row.messages_json);
	if (!Array.isArray(messages))
		throw new Error("conversation context is not an array");
	return messages as UIMessage[];
}

/** Append a complete UIMessage snapshot and mark the thread active. */
export function saveThreadContext(
	threadId: string,
	userId: string,
	messages: UIMessage[],
): number | null {
	return db.transaction(() => {
		const thread = db
			.query<{ id: string }, [string, string]>(
				"SELECT id FROM chat_threads WHERE id = ? AND user_id = ?",
			)
			.get(threadId, userId);
		if (!thread) return null;

		const { lastInsertRowid } = db.run(
			"INSERT INTO conversation_context (thread_id, messages_json) VALUES (?, ?)",
			[threadId, JSON.stringify(messages)],
		);
		db.run(
			"UPDATE chat_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			[threadId],
		);
		return Number(lastInsertRowid);
	})();
}
