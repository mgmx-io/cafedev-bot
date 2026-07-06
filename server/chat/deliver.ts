import type { Sender } from "@server/identity/service";

type OutText = { channelUserId: string; text: string };

type OutDoc = { channelUserId: string; filename: string; data: Uint8Array };

/** What a channel can deliver outbound, keyed by the channel's own user id. */
type Delivery = {
	/** A mid-turn chat message, formatted like any bot reply. */
	message?: (msg: OutText) => Promise<void>;
	/** A short progress note (e.g. which tool is running). */
	progress?: (note: OutText) => Promise<void>;
	/** A file; returns a user-facing receipt of where it went. */
	document?: (doc: OutDoc) => Promise<string>;
};

const channels = new Map<string, Delivery>();

/** Called by each channel at startup to plug in its outbound delivery. */
export function registerDelivery(channel: string, delivery: Delivery) {
	channels.set(channel, delivery);
}

/** Fire-and-forget a mid-turn message; channels without delivery drop it. */
export function deliverMessage(sender: Sender, text: string) {
	channels
		.get(sender.channel)
		?.message?.({ channelUserId: sender.channelUserId, text })
		.catch((err) => console.error("deliverMessage failed:", err));
}

/** Fire-and-forget a short progress note; channels without delivery drop it. */
export function deliverProgress(sender: Sender, text: string) {
	channels
		.get(sender.channel)
		?.progress?.({ channelUserId: sender.channelUserId, text })
		.catch((err) => console.error("deliverProgress failed:", err));
}

/** Deliver a document on the sender's channel. Returns a user-facing receipt. */
export function deliverDocument(
	sender: Sender,
	filename: string,
	data: Uint8Array,
): Promise<string> {
	const deliver = channels.get(sender.channel)?.document;
	if (!deliver)
		throw new Error(`Channel '${sender.channel}' cannot deliver documents.`);
	return deliver({ channelUserId: sender.channelUserId, filename, data });
}
