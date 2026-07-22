import { propagateAttributes } from "@langfuse/tracing";
import { systemPrompt } from "@server/agents/prompt";
import { recordUsage } from "@server/agents/usage";
import { deliverMessage } from "@server/channels/shared/deliver";
import type { Sender } from "@server/channels/shared/identity";
import { buildTools } from "@server/channels/telegram/tools";
import { type ModelMessage, ToolLoopAgent } from "ai";

export async function run(
	messages: ModelMessage[],
	userId: string,
	sender: Sender,
): Promise<{ responseMessages: ModelMessage[] }> {
	const sessionId = `${sender.channel}:${sender.channelUserId}`;
	const agent = new ToolLoopAgent({
		model: "deepseek/deepseek-v4-pro",
		instructions: systemPrompt(userId),
		tools: buildTools(userId, sender),
	});

	return await propagateAttributes({ userId, sessionId }, () =>
		agent.generate({
			messages,
			onStepEnd: ({ text }) => {
				if (text.trim()) deliverMessage(sender, text);
			},
			onEnd: ({ usage }) => {
				recordUsage(userId, usage);
			},
		}),
	);
}
