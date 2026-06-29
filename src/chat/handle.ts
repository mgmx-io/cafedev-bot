import type { ModelMessage } from "ai";
import { run } from "@/agents/agent";
import { loadContext, saveContext } from "@/chat/context";
import { resolveIdentity, type Sender, startLink } from "@/identity/service";
import { BETTER_AUTH_URL } from "@/lib/env";

class Conversation {
	constructor(private sender: Sender) {}

	async handle(content: string): Promise<{ text: string }> {
		const userId = resolveIdentity(this.sender);
		if (!userId) return { text: this.linkPrompt() };
		return { text: await this.chat(content, userId) };
	}

	private linkPrompt(): string {
		const token = startLink(this.sender);
		return `Vinculá tu cuenta: ${BETTER_AUTH_URL}/api/link/${token}`;
	}

	private async chat(content: string, userId: string): Promise<string> {
		const { channel, channelUserId } = this.sender;
		const sessionId = `${channel}:${channelUserId}`;
		const userMsg: ModelMessage = { role: "user", content };
		const history = [...loadContext(this.sender), userMsg];
		const { text, responseMessages } = await run(history, userId, sessionId);
		saveContext(this.sender, [...history, ...responseMessages]);
		return text;
	}
}

export function handleIncoming(
	msg: Sender & { content: string },
): Promise<{ text: string }> {
	return new Conversation(msg).handle(msg.content);
}
