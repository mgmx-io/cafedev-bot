import type { ModelMessage } from "ai";
import type { Sender } from "@/identity/service";
import { db } from "@/lib/db";

const MAX_TURNS = 10; // ponytail: últimos N intercambios; el canal tiene el historial real. Ventana por tokens si desborda.

/** Conversation context for one channel thread. Empty if none yet. */
export function loadContext({
	channel,
	channelUserId,
}: Sender): ModelMessage[] {
	const row = db
		.query<{ messages: string }, [string, string]>(
			"SELECT messages FROM conversation_context WHERE channel = ? AND channel_user_id = ?",
		)
		.get(channel, channelUserId);
	return row ? JSON.parse(row.messages) : [];
}

/** Drop the thread's context so the next message starts fresh. */
export function clearContext({ channel, channelUserId }: Sender): void {
	db.run(
		"DELETE FROM conversation_context WHERE channel = ? AND channel_user_id = ?",
		[channel, channelUserId],
	);
}

/** Group messages into turns: each starts at a user message and holds the assistant/tool replies until the next. */
function toTurns(messages: ModelMessage[]): ModelMessage[][] {
	const turns: ModelMessage[][] = [];
	for (const m of messages) {
		if (m.role === "user" || turns.length === 0) turns.push([m]);
		else turns[turns.length - 1].push(m);
	}
	return turns;
}

/** Keep the last `maxTurns` turns. Cutting on a turn boundary (a user message) never orphans a tool result → no 400. */
export const trimToTurns = (
	messages: ModelMessage[],
	maxTurns: number,
): ModelMessage[] => toTurns(messages).slice(-maxTurns).flat();

/** Overwrite the thread's context, trimmed to the last MAX_TURNS turns. */
export function saveContext(
	{ channel, channelUserId }: Sender,
	messages: ModelMessage[],
): void {
	db.run(
		`INSERT INTO conversation_context (channel, channel_user_id, messages) VALUES (?, ?, ?)
		 ON CONFLICT (channel, channel_user_id) DO UPDATE SET messages = excluded.messages`,
		[channel, channelUserId, JSON.stringify(trimToTurns(messages, MAX_TURNS))],
	);
}
