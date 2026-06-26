import { resolveIdentity, startLink } from "@/identity/service";
import { BETTER_AUTH_URL } from "@/lib/env";

export interface IncomingMessage {
	channel: string;
	channelUserId: string;
	text: string;
}

export async function handleIncoming(
	msg: IncomingMessage,
): Promise<{ text: string }> {
	const userId = resolveIdentity(msg.channel, msg.channelUserId);
	if (!userId) {
		const token = startLink(msg.channel, msg.channelUserId);
		return { text: `Vinculá tu cuenta: ${BETTER_AUTH_URL}/api/link/${token}` };
	}
	return { text: "Ya estás vinculado 👍" }; // TODO: route to the agent
}
