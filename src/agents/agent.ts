import { propagateAttributes } from "@langfuse/tracing";
import { type ModelMessage, ToolLoopAgent } from "ai";
import { systemPrompt } from "@/agents/prompt";
import { buildTools } from "@/agents/tools";

export async function run(
	messages: ModelMessage[],
	userId: string,
	sessionId: string,
): Promise<{ text: string; responseMessages: ModelMessage[] }> {
	const agent = new ToolLoopAgent({
		model: "openai/gpt-5.4-nano",
		instructions: systemPrompt(userId),
		tools: buildTools(userId),
	});

	return await propagateAttributes({ userId, sessionId }, () =>
		agent.generate({ messages }),
	);
}
