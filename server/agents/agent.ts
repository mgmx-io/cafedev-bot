import { propagateAttributes } from "@langfuse/tracing";
import { systemPrompt } from "@server/agents/prompt";
import { buildTools } from "@server/agents/tools";
import { deliverMessage } from "@server/chat/deliver";
import type { Sender } from "@server/identity/service";
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
		}),
	);
}
