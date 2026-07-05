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
): Promise<{ text: string; responseMessages: ModelMessage[] }> {
	const sessionId = `${sender.channel}:${sender.channelUserId}`;
	const agent = new ToolLoopAgent({
		model: "anthropic/claude-sonnet-5",
		instructions: systemPrompt(userId),
		tools: buildTools(userId, sender),
	});

	// text emitted alongside tool calls never reaches result.text — send it as it happens
	return await propagateAttributes({ userId, sessionId }, () =>
		agent.generate({
			messages,
			onStepEnd: (step) => {
				if (step.toolCalls.length && step.text.trim())
					deliverMessage(sender, step.text);
			},
		}),
	);
}
