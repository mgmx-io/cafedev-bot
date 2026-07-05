import type { Sender } from "@/identity/service";

/** What a channel can deliver outbound, keyed by the channel's own user id. */
type Delivery = {
	/** A mid-turn chat message, formatted like any bot reply. */
	message?: (channelUserId: string, text: string) => Promise<void>;
	/** A short progress note (e.g. which tool is running). */
	progress?: (channelUserId: string, text: string) => Promise<void>;
	/** A file; returns a user-facing receipt of where it went. */
	document?: (
		channelUserId: string,
		filename: string,
		data: Uint8Array,
	) => Promise<string>;
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
		?.message?.(sender.channelUserId, text)
		.catch(() => {});
}

/** Fire-and-forget a short progress note; channels without delivery drop it. */
export function deliverProgress(sender: Sender, text: string) {
	channels
		.get(sender.channel)
		?.progress?.(sender.channelUserId, text)
		.catch(() => {});
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
	return deliver(sender.channelUserId, filename, data);
}
