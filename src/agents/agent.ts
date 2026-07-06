import { propagateAttributes } from "@langfuse/tracing";
import { type ModelMessage, ToolLoopAgent } from "ai";
import { systemPrompt } from "@/agents/prompt";
import { buildTools } from "@/agents/tools";
import { deliverMessage } from "@/chat/deliver";
import type { Sender } from "@/identity/service";

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
