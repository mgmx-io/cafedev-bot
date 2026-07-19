import { db } from "@server/lib/db";
import type { LanguageModelUsage } from "ai";

const insert = db.query(
	"INSERT INTO token_usage (user_id, input_tokens, cache_read_tokens, output_tokens) VALUES (?, ?, ?, ?)",
);

/** Record one agent turn's aggregated token usage. */
export function recordUsage(userId: string, usage: LanguageModelUsage): void {
	insert.run(
		userId,
		usage.inputTokens ?? 0,
		usage.inputTokenDetails.cacheReadTokens ?? 0,
		usage.outputTokens ?? 0,
	);
}
