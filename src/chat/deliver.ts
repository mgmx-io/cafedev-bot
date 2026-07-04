import type { Sender } from "@/identity/service";

type DeliverDocument = (
	channelUserId: string,
	filename: string,
	data: Uint8Array,
) => Promise<string>;

const channels = new Map<string, DeliverDocument>();

/** Called by each channel at startup to plug in its document delivery. */
export function registerDocumentDelivery(channel: string, fn: DeliverDocument) {
	channels.set(channel, fn);
}

/** Deliver a document on the sender's channel. Returns a user-facing receipt. */
export function deliverDocument(
	sender: Sender,
	filename: string,
	data: Uint8Array,
): Promise<string> {
	const deliver = channels.get(sender.channel);
	if (!deliver)
		throw new Error(`Channel '${sender.channel}' cannot deliver documents.`);
	return deliver(sender.channelUserId, filename, data);
}

type DeliverProgress = (channelUserId: string, text: string) => Promise<void>;

const progressChannels = new Map<string, DeliverProgress>();

/** Called by each channel at startup to plug in its progress notes. */
export function registerProgressDelivery(channel: string, fn: DeliverProgress) {
	progressChannels.set(channel, fn);
}

/** Fire-and-forget a short progress note; channels without delivery drop it. */
export function deliverProgress(sender: Sender, text: string) {
	progressChannels
		.get(sender.channel)?.(sender.channelUserId, text)
		.catch(() => {});
}
