import type { ModelMessage } from "ai";
import { run } from "@/agents/agent";
import { loadContext, saveContext } from "@/chat/context";
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
	const ctx = loadContext(channel, channelUserId);
	const userMsg: ModelMessage = { role: "user", content };
	const { text, responseMessages } = await run([...ctx, userMsg]);
	saveContext(channel, channelUserId, [...ctx, userMsg, ...responseMessages]);
	return { text };
}
