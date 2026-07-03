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
