import { deliverMessage } from "@server/chat/deliver";
import type { Sender } from "@server/identity/service";
import { db } from "@server/lib/db";

type Tier = {
	id: string;
	tokenLimit: number;
	tokenWindowSeconds: number;
};

const tierForUser = db.query<Tier, [string]>(
	`SELECT
		t.id,
		t.token_limit AS tokenLimit,
		t.token_window_seconds AS tokenWindowSeconds
	 FROM tiers t
	 WHERE t.id = COALESCE(
		(SELECT tier_id FROM user_tiers WHERE user_id = ?),
		'free'
	 )`,
);

const usageWithinWindow = db.query<{ total: number }, [string, number]>(
	`SELECT COALESCE(SUM(input_tokens - cache_read_tokens + output_tokens), 0) AS total
	 FROM token_usage
	 WHERE user_id = ?
	   AND created_at > datetime('now', printf('-%d seconds', ?))`,
);

/** True if the user has spent their tier's token budget; tells them so on their channel. */
export function enforceLimit(userId: string, sender: Sender): boolean {
	const tier = tierForUser.get(userId);
	if (!tier) throw new Error("Default usage tier not found");
	if (tier.tokenLimit === -1) return false;

	const used =
		usageWithinWindow.get(userId, tier.tokenWindowSeconds)?.total ?? 0;
	if (used < tier.tokenLimit) return false;

	deliverMessage(sender, "Usage limit reached — try again later ☕");
	return true;
}
