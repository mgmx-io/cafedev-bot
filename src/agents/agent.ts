import { type ModelMessage, ToolLoopAgent } from "ai";

const agent = new ToolLoopAgent({
	model: "openai/gpt-5.4-nano",
	instructions:
		"You are the career agent. You help users with career advice, job search, and professional development.",
});

export async function run(messages: ModelMessage[]): Promise<string> {
	const { text } = await agent.generate({ messages });
	return text;
}
