import type { ModelMessage } from "ai";
import type { Sender } from "@/identity/service";
import { db } from "@/lib/db";

const WINDOW = 20; // ponytail: solo contexto; el canal tiene el historial real. Ventana por tokens si desborda.

/** Conversation context for one channel thread. Empty if none yet. */
export function loadContext({ channel, channelUserId }: Sender): ModelMessage[] {
	const row = db
		.query<{ messages: string }, [string, string]>(
			"SELECT messages FROM conversation_context WHERE channel = ? AND channel_user_id = ?",
		)
		.get(channel, channelUserId);
	return row ? JSON.parse(row.messages) : [];
}

/** Overwrite the thread's context, trimmed to the last WINDOW messages. */
export function saveContext(
	{ channel, channelUserId }: Sender,
	messages: ModelMessage[],
): void {
	db.run(
		`INSERT INTO conversation_context (channel, channel_user_id, messages) VALUES (?, ?, ?)
		 ON CONFLICT (channel, channel_user_id) DO UPDATE SET messages = excluded.messages`,
		[channel, channelUserId, JSON.stringify(messages.slice(-WINDOW))],
	);
}
