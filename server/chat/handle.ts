import { run } from "@server/agents/agent";
import { loadContext, saveContext } from "@server/chat/context";
import { deliverMessage } from "@server/chat/deliver";
import {
	resolveIdentity,
	type Sender,
	startLink,
} from "@server/identity/service";
import { BETTER_AUTH_URL } from "@server/lib/env";
import type { ModelMessage } from "ai";

class Conversation {
	constructor(private sender: Sender) {}

	async handle(content: string): Promise<void> {
		const userId = resolveIdentity(this.sender);
		if (!userId) {
			deliverMessage(this.sender, this.linkPrompt());
			return;
		}
		await this.chat(content, userId);
	}

	private linkPrompt(): string {
		const token = startLink(this.sender);
		return `☕ [Start CafeDev Agent](${BETTER_AUTH_URL}/api/link/${token})`;
	}

	private async chat(content: string, userId: string): Promise<void> {
		const userMsg: ModelMessage = { role: "user", content };
		const history = [...loadContext(this.sender), userMsg];
		const { responseMessages } = await run(history, userId, this.sender);
		saveContext(this.sender, [...history, ...responseMessages]);
	}
}

const queues = new Map<string, Promise<unknown>>();

export function handleIncoming(
	msg: Sender & { content: string },
): Promise<void> {
	const key = `${msg.channel}:${msg.channelUserId}`;
	const tail = queues.get(key) ?? Promise.resolve();
	const job = tail.then(() => new Conversation(msg).handle(msg.content));
	queues.set(
		key,
		job.catch(() => {}),
	);
	return job;
}
