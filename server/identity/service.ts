import { db } from "@server/lib/db";

const TTL_MS = 15 * 60 * 1000; // magic link lives 15 min

/** A user as seen on a channel — the identity of one channel thread. */
export type Sender = { channel: string; channelUserId: string };

/** Resolve a channel identity to a user id, or null if not linked yet. */
export function resolveIdentity({
	channel,
	channelUserId,
}: Sender): string | null {
	const row = db
		.query<{ user_id: string }, [string, string]>(
			"SELECT user_id FROM channel_links WHERE channel = ? AND channel_user_id = ?",
		)
		.get(channel, channelUserId);
	return row?.user_id ?? null;
}

/** Erase a user account entirely; FK cascades take profile, links and context with it. */
export function deleteUser(userId: string): void {
	db.run("DELETE FROM user WHERE id = ?", [userId]);
}

/** Create a one-shot link token for an unknown channel identity. */
export function startLink({ channel, channelUserId }: Sender): string {
	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
	db.transaction(() => {
		// at most one live token per channel identity — newest link wins
		db.run(
			"DELETE FROM link_requests WHERE channel = ? AND channel_user_id = ?",
			[channel, channelUserId],
		);
		db.run(
			"INSERT INTO link_requests (token, channel, channel_user_id, expires_at) VALUES (?, ?, ?, ?)",
			[token, channel, channelUserId, expiresAt],
		);
	})();
	return token;
}

/** Bind the token's channel identity to a logged-in user. Single-use. */
export function confirmLink(token: string, userId: string): boolean {
	return db.transaction(() => {
		const req = db
			.query<
				{ channel: string; channel_user_id: string; expires_at: string },
				[string]
			>(
				"SELECT channel, channel_user_id, expires_at FROM link_requests WHERE token = ?",
			)
			.get(token);
		if (!req) return false;
		db.run("DELETE FROM link_requests WHERE token = ?", [token]); // consume regardless
		if (req.expires_at < new Date().toISOString()) return false; // expired
		db.run(
			"INSERT INTO channel_links (channel, channel_user_id, user_id) VALUES (?, ?, ?) ON CONFLICT (channel, channel_user_id) DO UPDATE SET user_id = excluded.user_id",
			[req.channel, req.channel_user_id, userId],
		);
		return true;
	})();
}
