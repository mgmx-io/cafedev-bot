import { run } from "@/agents/agent";
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
	const text = await run([{ role: "user", content: msg.text }]);
	return { text };
}
