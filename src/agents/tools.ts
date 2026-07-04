import type { Tool, ToolSet } from "ai";
import { queryTools } from "@/agents/query";
import { deliverProgress } from "@/chat/deliver";
import { cvTools } from "@/cv/tools";
import type { Sender } from "@/identity/service";
import { jobsTools } from "@/jobs/tools";
import { profileTools } from "@/profile/tools";
import { researchTools } from "@/research/tools";
import { skillsTools } from "@/skills/tools";

/** Announce each tool call on the sender's channel just before it runs. */
function withProgress(tools: ToolSet, sender: Sender): ToolSet {
	return Object.fromEntries(
		Object.entries(tools).map(([name, t]) => {
			const execute = t.execute;
			if (!execute) return [name, t];
			const wrapped: Tool = {
				...t,
				execute: (input, options) => {
					deliverProgress(sender, `⚙️ ${name}`);
					return execute(input, options);
				},
			};
			return [name, wrapped];
		}),
	);
}

/** Every tool the agent can use, bound to one user. Composes one slice per spread. */
export const buildTools = (userId: string, sender: Sender) =>
	withProgress(
		{
			...skillsTools,
			...researchTools,
			...profileTools(userId),
			...jobsTools(userId),
			...queryTools(userId),
			...cvTools(sender),
		},
		sender,
	);
