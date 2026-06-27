import { run } from "@/agents/agent";
import { resolveIdentity, startLink } from "@/identity/service";
import { BETTER_AUTH_URL } from "@/lib/env";

export async function handleIncoming(msg: {
	content: string;
	channel: string;
	channelUserId: string;
}): Promise<{ text: string }> {
	const { content, channel, channelUserId } = msg;
	const userId = resolveIdentity(channel, channelUserId);
	if (!userId) {
		const token = startLink(channel, channelUserId);
		return { text: `Vinculá tu cuenta: ${BETTER_AUTH_URL}/api/link/${token}` };
	}
	const text = await run([{ role: "user", content }]);
	return { text };
}
