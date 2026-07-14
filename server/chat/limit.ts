import { deliverMessage } from "@server/chat/deliver";
import type { Sender } from "@server/identity/service";
import { db } from "@server/lib/db";

// ponytail: rolling 24h window; tune the budget from Langfuse cost data
const DAILY_TOKENS = 1_000_000;

const usedToday = db.query<{ total: number }, [string]>(
	`SELECT COALESCE(SUM(input_tokens + output_tokens), 0) AS total
	 FROM token_usage
	 WHERE user_id = ? AND created_at > datetime('now', '-1 day')`,
);

/** True if the user has spent their daily token budget; tells them so on their channel. */
export function enforceLimit(userId: string, sender: Sender): boolean {
	if ((usedToday.get(userId)?.total ?? 0) < DAILY_TOKENS) return false;
	deliverMessage(sender, "Daily usage limit reached — try again tomorrow ☕");
	return true;
}
